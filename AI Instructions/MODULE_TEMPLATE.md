# MODULE_TEMPLATE

This is a reusable template for creating a new backend module in the style of this repository.

The example below uses a module named `story`.

---

# 1) Expected Folder / File Layout

## Minimum REST module
```txt
src/Modules/story/
  story.controller.ts
  story.service.ts
  story.validation.ts
  story.dto.ts
```

## If the module has GraphQL support
```txt
src/Modules/story/gql/
  story.args.ts
  story.gql.validation.ts
  story.resolvers.ts
  story.schema.ts
  story.type.ts
```

## If the module has realtime events
```txt
src/Modules/story/realtime/
  story.event.ts
  story.gateway.ts
```

## If the module has a DB entity
```txt
src/DB/Models/story.model.ts
src/Repo/story.repo.ts
```

---

# 2) `story.dto.ts`

```ts
export type CreateStoryDto = {
  content?: string;
  tags?: string[];
  privacy?: number;
};

export type UpdateStoryDto = {
  content?: string;
  tags?: string[];
  removeTags?: string[];
  removeFiles?: string[];
  privacy?: number;
};

export type GetStoriesDto = {
  page?: number;
  limit?: number;
  search?: string;
};
```

Notes:
- DTO file holds module-local payload types used by service methods.
- If the module only has one trivial payload, keep it small. Do not create unnecessary abstraction.

---

# 3) `story.validation.ts`

```ts
import z from "zod";
import { commonValidationField } from "../../Middleware/validation.middleware.js";

export const createStorySchema = {
  body: z
    .strictObject({
      content: z.string().min(3).max(1000).optional(),
      files: z.array(z.any()).optional(),
      tags: z.array(commonValidationField.id).optional(),
      privacy: z.coerce.number().optional(),
    })
    .superRefine((args, ctx) => {
      if (!args.content && !args.files?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "you should add content at least or upload one attachment",
        });
      }

      if (args.tags) {
        const uniqueTags = [...new Set(args.tags)];
        if (uniqueTags.length !== args.tags.length) {
          ctx.addIssue({
            code: "custom",
            path: ["tags"],
            message: "Duplicate Tag IDs are not allowed",
          });
        }
      }
    }),
};

export const getStoriesSchema = {
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(3),
    search: z.string().optional(),
  }),
};

export const updateStorySchema = {
  body: z.strictObject({
    content: z.string().min(3).max(1000).optional(),
    tags: z.array(commonValidationField.id).optional(),
    removeTags: z.array(commonValidationField.id).optional(),
    files: z.array(z.any()).optional(),
    removeFiles: z.array(z.string()).optional(),
    privacy: z.coerce.number().optional(),
  }),
  params: z.object({
    storyId: commonValidationField.id,
  }),
};
```

Template notes:
- use schema objects keyed by `body`, `params`, `query`
- use `validation(schema, true)` in the controller if uploaded files must be available as `body.files`

---

# 4) `story.controller.ts`

```ts
import express from "express";
import { authentication } from "../../Middleware/authentication.middleware.js";
import { validation } from "../../Middleware/validation.middleware.js";
import success from "../../Common/Response/success.response.js";
import cloudFileUpload from "../../Common/multer/multer.config.js";
import storyService from "./story.service.js";
import {
  createStorySchema,
  getStoriesSchema,
  updateStorySchema,
} from "./story.validation.js";

const storyRouter: express.Router = express.Router();

storyRouter.get("/", (req: express.Request, res: express.Response) => {
  res.json({ message: "Story router" });
});

storyRouter.post(
  "/create-story",
  authentication(),
  cloudFileUpload({}).array("createStoryImage", 5),
  validation(createStorySchema, true),
  async (req: express.Request, res: express.Response) => {
    await storyService.createStory(
      req.body,
      req.user!,
      req.files as Express.Multer.File[],
    );

    success({
      res,
      message: "Story Created Successfully",
    });
  },
);

storyRouter.get(
  "/get-stories",
  authentication(),
  validation(getStoriesSchema),
  async (req: express.Request, res: express.Response) => {
    const result = await storyService.getStories(req.user!, req.query as any);

    success({
      res,
      result,
      message: "Stories Retrieved Successfully",
    });
  },
);

storyRouter.patch(
  "/update-story/:storyId",
  authentication(),
  cloudFileUpload({}).array("updateStoryImage", 5),
  validation(updateStorySchema, true),
  async (req: express.Request, res: express.Response) => {
    await storyService.updateStory(
      req.body,
      req.params.storyId as string,
      req.user!,
      req.files as Express.Multer.File[],
    );

    success({
      res,
      message: "Story Updated Successfully",
    });
  },
);

export default storyRouter;
```

Controller rules reflected in the template:
- controller only wires middleware + service + success response
- business logic is not implemented here
- file upload middleware is attached here, but file persistence logic stays in service

---

# 5) `story.service.ts`

```ts
import type { Types } from "mongoose";
import type {
  CreateStoryDto,
  GetStoriesDto,
  UpdateStoryDto,
} from "./story.dto.js";
import type { IHUser } from "../../DB/Models/user.model.js";
import storyRepo from "../../Repo/story.repo.js";
import userRepo from "../../Repo/user.repo.js";
import redisService from "../../DB/Redis/redis.service.js";
import NotificationService from "../../Common/Notification/Notification.service.js";
import {
  BadRequest,
  NotFound,
} from "../../Common/Exeptions/domain.error.js";
import {
  uploadSmallFileToCloudinary,
  deleteFileFromCloudinary,
} from "../../Common/Cloudinary/cloudinary.service.js";

class StoryService {
  private _storyRepo = storyRepo;
  private _userRepo = userRepo;
  private _redisService = redisService;
  private _notificationService = NotificationService;

  async createStory(
    bodyData: CreateStoryDto,
    user: IHUser,
    files?: Express.Multer.File[],
  ) {
    const { tags } = bodyData;

    if (tags?.length) {
      const mentionedUsers = await this._userRepo.find({
        filter: {
          _id: { $in: tags },
        },
      });

      if (mentionedUsers.length !== tags.length) {
        throw new BadRequest("failed to find some tagged users");
      }
    }

    const story = this._storyRepo.getDBDoc(bodyData as any);

    if (files?.length) {
      const result = files.map(async (file) => {
        return await uploadSmallFileToCloudinary(file, "stories");
      });

      story.attachments = result as unknown as string[];
    }

    story.createdBy = user._id as Types.ObjectId;

    if (tags?.length) {
      for (const tag of tags) {
        const tokens = await this._redisService.getMemberFCMTokens(tag);

        if (tokens.length) {
          await this._notificationService.sendNotifications({
            tokens,
            data: {
              title: "Story Tagged",
              body: "you have been tagged on story",
            },
          });
        }
      }
    }

    return await this._storyRepo.saveDBDoc(story);
  }

  async getStories(user: IHUser, queryData: GetStoriesDto) {
    const searchQuery = queryData.search?.length
      ? {
          content: {
            $regex: queryData.search,
            $options: "i",
          },
        }
      : {};

    return await this._storyRepo.paginate({
      filter: {
        ...searchQuery,
      },
      page: +(queryData.page as number),
      limit: +(queryData.limit as number),
    });
  }

  async updateStory(
    bodyData: UpdateStoryDto,
    storyId: Types.ObjectId | string,
    user: IHUser,
    files?: Express.Multer.File[],
  ) {
    const story = await this._storyRepo.findOne({
      filter: {
        _id: storyId,
        createdBy: user._id,
      },
    });

    if (!story) {
      throw new NotFound("story not found");
    }

    let uploadedFiles: string[] = [];

    if (files?.length) {
      const result = files.map(async (file) => {
        return await uploadSmallFileToCloudinary(file, "stories");
      });

      uploadedFiles = result as unknown as string[];
    }

    if (bodyData.removeFiles?.length) {
      for (const fileUrl of bodyData.removeFiles) {
        const publicId = fileUrl.split("/").slice(-1)[0]!.split(".")[0];
        await deleteFileFromCloudinary(`stories/${publicId}`);
      }
    }

    await this._storyRepo.findOneAndUpdate({
      filter: { _id: storyId, createdBy: user._id },
      update: [
        {
          $set: {
            content: bodyData.content || story.content,
            privacy: bodyData.privacy || story.privacy,
            tags: {
              $setUnion: [
                {
                  $setDifference: ["$tags", bodyData.removeTags || []],
                },
                bodyData.tags || [],
              ],
            },
            attachments: {
              $setUnion: [
                {
                  $setDifference: ["$attachments", bodyData.removeFiles || []],
                },
                uploadedFiles || [],
              ],
            },
          },
        },
      ],
      options: {
        updatePipeline: true,
        returnDocument: "after",
      },
    });
  }
}

export default new StoryService();
```

Service template notes:
- keep repo and shared services on private `_` fields
- use repo methods instead of model calls
- throw domain errors
- perform side effects like notification/cloudinary in service

---

# 6) `story.repo.ts`

```ts
import StoryModel, { type IStory } from "../DB/Models/story.model.js";
import DBRepo from "./db.repo.js";
import type { IHUser } from "../DB/Models/user.model.js";

class StoryRepo extends DBRepo<IStory> {
  constructor() {
    super(StoryModel);
  }

  buildStoryVisibilityQuery(user: IHUser) {
    return [
      { createdBy: user._id },
    ];
  }
}

export default new StoryRepo();
```

Repo rules:
- extend `DBRepo<T>`
- add only entity-specific helpers here
- keep generic CRUD inside `DBRepo`

---

# 7) `story.model.ts`

```ts
import { model, Schema, Types } from "mongoose";

export interface IStory {
  content?: string;
  attachments?: string[];
  tags?: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  privacy?: number;
}

const storySchema = new Schema<IStory>(
  {
    content: String,
    attachments: [String],
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    privacy: Number,
  },
  {
    timestamps: true,
  },
);

const StoryModel = model<IStory>("Story", storySchema);

export default StoryModel;
```

Model template notes:
- keep the shape consistent with the actual entity requirements
- only add fields the feature really uses
- use refs where the module needs population / relation queries

---

# 8) Optional GraphQL Template

## `gql/story.gql.validation.ts`
```ts
import z from "zod";
import { commonValidationField } from "../../../Middleware/validation.middleware.js";

export const createStoryValidation = z.object({
  content: z.string().min(3).max(1000),
});

export const storyDetailsValidation = z.object({
  storyId: commonValidationField.id,
});
```

## `gql/story.resolvers.ts`
```ts
import { validationGQL } from "../../../Middleware/validation.middleware.js";
import type { ContextType } from "../../gql/type.gql.js";
import storyService from "../story.service.js";
import { createStoryValidation } from "./story.gql.validation.js";

class StoryResolver {
  private _storyService = storyService;

  createStory = async (parent: any, args: any, context: ContextType) => {
    validationGQL(createStoryValidation, args);

    return await this._storyService.createStory(args, context.user);
  };
}

export default new StoryResolver();
```

## `gql/story.schema.ts`
```ts
import storyResolver from "./story.resolvers.js";

const storySchema = {
  Mutation: {
    createStory: storyResolver.createStory,
  },
};

export default storySchema;
```

## `gql/story.type.ts`
```ts
const storyType = `#graphql
  type Story {
    _id: ID!
    content: String
  }

  extend type Mutation {
    createStory(content: String!): Story
  }
`;

export default storyType;
```

---

# 9) Optional Realtime Template

## `realtime/story.event.ts`
```ts
import z from "zod";
import { validationRealtime } from "../../../Middleware/validation.middleware.js";
import type { SocketAuthType } from "socket.io";

class StoryEvent {
  createStoryEvent(socket: SocketAuthType) {
    const schema = z.object({
      content: z.string().min(1),
    });

    return async (args: unknown) => {
      validationRealtime(schema, args);
      // delegate to service
    };
  }
}

export default new StoryEvent();
```

## `realtime/story.gateway.ts`
```ts
import type { Server, SocketAuthType } from "socket.io";
import storyEvent from "./story.event.js";

class StoryGateway {
  private _storyEvent = storyEvent;

  registerEvents(socket: SocketAuthType, io: Server) {
    socket.on("story:create", this._storyEvent.createStoryEvent(socket));
  }
}

export default new StoryGateway();
```

---

# 10) Final Integration Checklist For A New Module

After creating a module, verify all of this:

- [ ] controller file exists
- [ ] service file exists
- [ ] validation file exists
- [ ] dto file exists if payloads are non-trivial
- [ ] repo exists if the feature uses a DB entity
- [ ] model exists if the feature persists data
- [ ] controller uses `success(...)`
- [ ] protected routes use `authentication()`
- [ ] request validation is wired with `validation(...)`
- [ ] file-upload routes use `validation(schema, true)` when needed
- [ ] service throws domain errors instead of generic errors
- [ ] imports use `.js`
- [ ] module router is mounted in `app.bootstrap.ts` if it is a REST module
- [ ] GraphQL schema/resolvers are wired if the module exposes GraphQL operations
- [ ] realtime gateway registration is wired if the module exposes socket events
