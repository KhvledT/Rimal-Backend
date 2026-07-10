# AI_INSTRUCTIONS

This file defines how an AI assistant must add or modify backend code in repositories that follow this backend style.

These are execution rules, not generic best practices. Follow the repository’s existing conventions exactly.

---

# 1) Prime Directive

When writing code in a repository that follows this style:

- **copy the repository’s established structure**
- **do not introduce a new architecture style**
- **do not replace conventions unless explicitly asked**
- **do not write “best practice” code that conflicts with the existing project pattern**

If the repository already has a pattern, reuse it even if you would personally structure it differently.

---

# 2) Mandatory Architectural Rules

## 2.1 Controllers stay thin
When adding a new endpoint:

- controller defines the route
- controller attaches middleware
- controller calls service
- controller returns `success(...)`

Do not place business logic in controllers.

## 2.2 Business logic goes in service classes
All entity checks, permission rules, side effects, upload processing, notification dispatch, and repo orchestration must live in the service layer.

## 2.3 Database access goes through repos
Do not import Mongoose models directly into controllers or services if a repo exists for that model.

Use the repo layer:
- `findOne`
- `find`
- `create`
- `updateOne`
- `findOneAndUpdate`
- `paginate`
- `getDBDoc`
- `saveDBDoc`

If a reusable entity-specific query is needed, add it to the entity repo.

---

# 3) File Creation Rules For New Modules

When creating a new backend module, create the same file pattern used by existing modules.

For a module named `story`, create:

```txt
src/Modules/story/
  story.controller.ts
  story.service.ts
  story.validation.ts
  story.dto.ts
```

If GraphQL is needed:

```txt
src/Modules/story/gql/
  story.args.ts
  story.gql.validation.ts
  story.resolvers.ts
  story.schema.ts
  story.type.ts
```

If realtime event handling is needed:

```txt
src/Modules/story/realtime/
  story.event.ts
  story.gateway.ts
```

If the module needs entity-specific DB helpers, create:

```txt
src/Repo/story.repo.ts
```

If the module needs a new model:

```txt
src/DB/Models/story.model.ts
```

---

# 4) Import Rules

## 4.1 Always use `.js` file extensions in TS imports
Correct:
```ts
import storyService from "./story.service.js";
```

Wrong:
```ts
import storyService from "./story.service";
```

## 4.2 Use `import type` for type-only imports
Examples:
```ts
import type { Types } from "mongoose";
import type { IHUser } from "../../DB/Models/user.model.js";
```

## 4.3 Do not introduce path aliases
Do not start using `@/`, `~/`, `src/`, or custom aliases unless the repository already uses them everywhere.

---

# 5) Controller Generation Rules

When generating a controller:

1. create a router
2. add route definitions
3. add `authentication()` where required
4. add upload middleware where required
5. add `validation(...)`
6. call the service
7. return `success(...)`

### Required controller shape
```ts
import express from "express";
import { authentication } from "../../Middleware/authentication.middleware.js";
import { validation } from "../../Middleware/validation.middleware.js";
import success from "../../Common/Response/success.response.js";
import storyService from "./story.service.js";
import * as storyValidation from "./story.validation.js";

const storyRouter: express.Router = express.Router();

storyRouter.post(
  "/create-story",
  authentication(),
  validation(storyValidation.createStorySchema),
  async (req: express.Request, res: express.Response) => {
    const result = await storyService.createStory(req.body, req.user!);
    success({ res, result, message: "Story Created Successfully" });
  },
);

export default storyRouter;
```

## Hard rules
- Do not call Mongoose model methods inside controller.
- Do not validate business rules inside controller.
- Do not return raw `res.status(...).json(...)` if `success()` should be used.

---

# 6) Service Generation Rules

When generating a service:

- create a class
- attach repos/shared services as private `_` fields when needed
- implement business logic in methods
- throw domain errors for expected failures
- export `new ServiceName()`

### Required service shape
```ts
class StoryService {
  private _storyRepo = storyRepo;
  private _userRepo = userRepo;

  async createStory(bodyData: CreateStoryDto, user: IHUser) {
    // business logic
  }
}

export default new StoryService();
```

## Service rules
- validate entity existence in service
- enforce ownership/visibility/business rules in service
- use repo methods, not raw model calls
- use Redis/Notification/Cloudinary helpers from `Common/` or `DB/Redis/`
- throw `BadRequest`, `NotFound`, `Conflict`, `Unauthorized` where appropriate

---

# 7) Validation Generation Rules

Each new module should have a `*.validation.ts` file exporting schema objects keyed by request segment.

### Pattern
```ts
export const createStorySchema = {
  body: z.strictObject({
    content: z.string().min(1),
  }),
};

export const storyDetailsSchema = {
  params: z.object({
    storyId: commonValidationField.id,
  }),
};
```

## Rules
- use Zod
- reuse `commonValidationField` whenever possible
- use `superRefine(...)` for cross-field validation
- if route uploads files and validation must see them, controller must call `validation(schema, true)`

---

# 8) DTO Rules

If a service consumes a structured payload, define the payload type in the module’s `*.dto.ts`.

Example:
```ts
export type CreateStoryDto = {
  content: string;
  privacy?: number;
};
```

Rules:
- DTOs belong to the module, not to `Common/`
- use DTO types in service signatures when possible
- do not scatter ad-hoc duplicate payload types across multiple files

---

# 9) Repo Rules

When a new entity needs database access:

1. create a Mongoose model in `DB/Models/`
2. create a repo in `Repo/`
3. extend `DBRepo<T>`
4. add entity-specific query helpers there if needed

### Pattern
```ts
class StoryRepo extends DBRepo<IStory> {
  constructor() {
    super(StoryModel);
  }

  buildStoryVisibilityQuery(user: IHUser) {
    return [...];
  }
}

export default new StoryRepo();
```

## Hard rules
- do not duplicate generic DB methods already available in `DBRepo`
- only add repo methods for entity-specific query logic or reusable filters

---

# 10) Error Rules

Use repository error classes only:

- `BadRequest`
- `Unauthorized`
- `NotFound`
- `Conflict`

Do not introduce a second error system.

Do not throw plain `Error` for expected domain failures.

---

# 11) Response Rules

For REST endpoints, always use `success(...)` for successful responses.

Examples:
```ts
success({ res, result });
success({ res, message: "Done" });
success({ res, result, StatusCode: 201 });
```

Do not invent a different success envelope per module.

---

# 12) Auth Rules

If an endpoint is protected, use:

```ts
authentication()
```

If a service needs the current user or token payload, consume the values already written to the request by the auth middleware:
- `req.user`
- `req.tokenPayload`

Do not decode JWT manually in controllers.

Do not create parallel auth middleware unless explicitly requested.

---

# 13) File Upload Rules

When a route accepts files:

- attach upload middleware in controller
- pass files to the service
- let service handle cloud upload / persistence logic

Example:
```ts
cloudFileUpload({}).array("storyImages", 5)
validation(createStorySchema, true)
```

---

# 14) GraphQL Rules

If a module already has GraphQL support or the new feature must be exposed over GraphQL:

- keep feature GraphQL files inside `Modules/<module>/gql/`
- validate resolver args using `validationGQL(...)`
- delegate business logic to the same service used by REST if possible
- use GraphQL context user rather than re-fetching auth state manually

### Resolver pattern
```ts
class StoryResolver {
  private _storyService = storyService;

  createStory = async (parent: any, args: any, context: ContextType) => {
    validationGQL(createStoryValidation, args);
    return await this._storyService.createStory(args, context.user);
  };
}

export default new StoryResolver();
```

---

# 15) Realtime Rules

If the feature needs socket behavior:

- put feature event logic inside `Modules/<module>/realtime/`
- do not modify central realtime auth flow unless the auth contract itself changes
- use `socket.data.user` and `socket.data.verifiedToken` after auth
- validate realtime payloads with `validationRealtime(...)`

---

# 16) Modification Rules For Existing Code

When editing an existing module:

1. inspect that module’s controller/service/validation/DTO first
2. preserve its naming, response wording, and route style
3. extend the existing service instead of creating a second parallel service
4. reuse the existing repo if the entity already has one
5. preserve existing request shape unless asked to change API contract

---

# 17) Things The AI Must Not Do

Do not do any of the following unless explicitly requested:

- do not convert the codebase to Clean Architecture / DDD / Hexagonal
- do not introduce dependency injection containers
- do not replace singleton service exports with named class exports
- do not add path aliases
- do not move repositories inside module folders
- do not replace `success()` with custom response wrappers
- do not bypass repos and talk to models directly
- do not add generic “utils” for logic that belongs in an existing service/repo
- do not add a new validation system besides Zod + existing middleware
- do not add a second auth flow for REST routes

---

# 18) Completion Checklist For Every New Feature

Before finishing, verify all of the following:

- [ ] route lives in the correct module controller
- [ ] controller only orchestrates middleware + service + success response
- [ ] service contains the business logic
- [ ] service throws domain errors where needed
- [ ] validation schema exists and is wired into controller/resolver
- [ ] DTO exists if the payload is non-trivial
- [ ] repo is used instead of direct model access
- [ ] imports use `.js`
- [ ] GraphQL / realtime files are added only if the feature actually needs them
- [ ] naming matches existing module naming patterns
