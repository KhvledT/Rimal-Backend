# BACKEND_STYLE_GUIDE

This document captures the backend coding style used in this repository. It is a repository-specific style guide extracted from the current implementation patterns.

---

# 1) Project Shape

The backend is organized around these top-level areas under `src/`:

- `Modules/` → feature modules such as auth, user, post, comment, chat
- `Repo/` → repository layer over Mongoose models
- `DB/` → database models and Redis connection/service
- `Middleware/` → auth, validation, global error middleware
- `Common/` → shared infrastructure like token, mail, response, cloudinary, notification, multer
- `config/` → env/config access
- `enums/` → enums used across modules
- `main.ts` / `app.bootstrap.ts` → application entry and bootstrap

The codebase is **module-first**, but **repositories and shared infrastructure live outside modules** and are reused across modules.

---

# 2) File Naming Rules

Use lowercase module folder names and lowercase feature file names.

## Module REST files
For a module named `post`, use:

- `post.controller.ts`
- `post.service.ts`
- `post.validation.ts`
- `post.dto.ts`

Examples already in repo:
- `Modules/auth/auth.controller.ts`
- `Modules/post/post.service.ts`
- `Modules/comment/comment.validation.ts`

## Module GraphQL files
When a module exposes GraphQL behavior, create a `gql/` folder under that module:

- `post.args.ts`
- `post.gql.validation.ts`
- `post.resolvers.ts`
- `post.schema.ts`
- `post.type.ts`

## Realtime files
Realtime feature code is colocated under the owning module in `realtime/` when it belongs to a specific module:

- `Modules/chat/realtime/chat.event.ts`
- `Modules/chat/realtime/chat.gateway.ts`

There is also a global realtime bootstrap entry:
- `Modules/realtime/realtime.gateway.ts`

## Repository files
Repositories live in `src/Repo/`:

- `user.repo.ts`
- `post.repo.ts`
- `comment.repo.ts`
- `chat.repo.ts`
- `db.repo.ts`

---

# 3) Import Style

## 3.1 Always use ESM-style `.js` import paths in TypeScript source
The project uses NodeNext / ESM style imports.

### Correct
```ts
import postService from "./post.service.js";
import userRepo from "../../Repo/user.repo.js";
```

### Do not do
```ts
import postService from "./post.service";
import userRepo from "../../Repo/user.repo";
```

## 3.2 Type-only imports are used where appropriate
Examples:
```ts
import type { IHUser } from "../../DB/Models/user.model.js";
import type { JwtPayload } from "jsonwebtoken";
import type { Types } from "mongoose";
```

Use `import type` for purely type imports.

## 3.3 Shared imports are referenced by absolute project-relative depth, not aliases
The codebase does not use path aliases like `@/` or `~`.

---

# 4) Class / Instance Style

Services and repositories are class-based, then exported as a **singleton instance**.

## Service pattern
```ts
class PostService {
  async createPost() {}
}

export default new PostService();
```

## Repository pattern
```ts
class PostRepo extends DBRepo<IPost> {
  constructor() {
    super(PostModel);
  }
}

export default new PostRepo();
```

## Internal dependency style inside services
Service classes usually store shared dependencies on private fields prefixed with `_`.

Example pattern:
```ts
class CommentService {
  private _commentRepo = commentRepo;
  private _userRepo = userRepo;
  private _redisService = redisService;
  private _notificationService = NotificationService;
}
```

Use this same style when the service depends on repos or shared services.

---

# 5) Controller Style

Controllers are thin. They do four things only:

1. define routes
2. apply middleware
3. call service methods
4. return the success response wrapper

Business logic does **not** belong in controllers.

## Controller construction
Controllers use Express router instances:

```ts
import express from "express";

const postRouter: express.Router = express.Router();
```

or in some modules:

```ts
import { Router } from "express";
const chatRouter = Router({ mergeParams: true });
```

Both styles exist in the repo. Prefer matching the surrounding module’s existing style.

## Controller responsibilities
A route typically follows this order:

1. `authentication()` if protected
2. upload middleware if needed
3. `validation(...)`
4. async route handler
5. call service
6. `success(...)`

Example shape:
```ts
postRouter.post(
  "/create-post",
  authentication(),
  cloudFileUpload({}).array("createPostImage", 5),
  validation(createPostSchema, true),
  async (req, res) => {
    await postService.createPost(req.body, req.user!._id!);
    success({ res, message: "Post Created Successfully" });
  },
);
```

## Controller rules
- Do not query models directly from controllers.
- Do not construct Mongoose filters in controllers.
- Do not perform business validation in controllers.
- Do not manually build success JSON if `success()` already covers it.
- Route handlers are generally `async`.
- Controllers pass raw request pieces into services:
  - `req.body`
  - `req.params.xxx`
  - `req.query`
  - `req.user`
  - `req.files`

---

# 6) Service Layer Style

The service layer contains the actual business logic.

## 6.1 Services orchestrate repositories + shared services
Typical service responsibilities:
- validate cross-entity business rules
- load related entities from repos
- upload/delete files
- send notifications
- build DB update operations
- throw domain errors

## 6.2 Services throw domain errors, not raw Error
Use:
- `BadRequest`
- `NotFound`
- `Conflict`
- `Unauthorized`

Examples:
```ts
throw new BadRequest("OTP Expired");
throw new NotFound("post not found");
throw new Conflict("User already exists");
```

## 6.3 Services call repos, not Mongoose models directly
The codebase consistently routes database access through `Repo/*`.

### Correct
```ts
const post = await this._postRepo.findOne({ filter: { _id: postId } });
```

### Avoid
```ts
await PostModel.findOne(...)
```

## 6.4 Services often receive raw DTO/body + contextual data
Typical signatures:
```ts
async createPost(bodyData, userId, files?)
async createComment(bodyData, user, postId, files?)
async logout(userId, tokenData, logoutOption)
```

The service method signature should match what the controller naturally has available.

## 6.5 Mongoose ObjectId types are accepted as `Types.ObjectId | string`
This is a repeated pattern in the repo:
```ts
postId: Types.ObjectId | string
userId: Types.ObjectId | string
```

Use the same convention in service and repo boundaries where IDs may come from params or DB documents.

---

# 7) Repository Layer Style

Repositories wrap Mongoose models and expose reusable DB operations.

## 7.1 All repositories extend `DBRepo<T>`
`db.repo.ts` is the base abstraction. Concrete repos extend it and pass the Mongoose model into `super(...)`.

Example:
```ts
class PostRepo extends DBRepo<IPost> {
  constructor() {
    super(PostModel);
  }
}
```

## 7.2 Custom query helpers belong in repo classes
If a query concept is reused or tied to one entity, it belongs in that repo.

Example from `post.repo.ts`:
```ts
checkPostPrivacy(user: IHUser) {
  return [
    { privacy: PostPrivacyEnum.PUBLIC },
    { createdBy: { $in: [user._id] }, privacy: PostPrivacyEnum.FRIENDS },
    { tags: { $in: [user._id] } },
    { createdBy: user._id! },
  ];
}
```

This pattern is important: **entity-specific query logic lives in repo classes**, not controllers.

## 7.3 Use repo methods from `DBRepo`
Common methods already standardized:
- `create`
- `findOne`
- `findOneAndUpdate`
- `find`
- `findById`
- `updateOne`
- `getDBDoc`
- `saveDBDoc`
- `paginate`

Do not recreate equivalent helpers inside each repo unless the behavior is entity-specific.

---

# 8) Validation Style

Validation is handled with Zod schemas and centralized middleware.

## 8.1 Validation files export schema objects keyed by request segment
REST validation exports objects like:

```ts
export const createPostSchema = {
  body: z.strictObject({...}).superRefine(...),
};

export const getPostsSchema = {
  query: z.object({...}),
};

export const updatePostSchema = {
  body: z.strictObject({...}),
  params: z.object({...}),
};
```

The keys match Express request keys:
- `body`
- `params`
- `query`

## 8.2 Validation middleware is called with the schema object
```ts
validation(createPostSchema)
validation(updatePostSchema, true)
```

## 8.3 When files must be validated with body fields, pass `true`
The middleware supports `filesInBody`.
Use:
```ts
validation(createCommentSchema, true)
```

This merges `req.files` into `req.body.files` before validation.

## 8.4 Shared validation fields live in `commonValidationField`
Examples already present:
- `id`
- `userName`
- `email`
- `password`
- `confirmPassword`
- `age`
- `gender`
- `phone`
- `otp`

Reuse them instead of redefining the same validators in each module.

## 8.5 Use `superRefine` for cross-field rules
Patterns already used:
- ensure post has content or attachment
- ensure tag IDs are unique
- ensure each tag is a valid ObjectId

Use `superRefine` when validation depends on multiple fields or needs loop-based checks.

---

# 9) Response Style

Successful REST responses go through the shared `success()` helper.

Typical usage:
```ts
success({ res, message: "Post Created Successfully" });
success({ res, result });
success({ res, StatusCode: 201, result, message: "Check your inbox" });
```

## Rules
- Do not handcraft different success shapes per controller if `success()` already covers the response.
- Use `message` when the endpoint performs an action.
- Use `result` when returning data.
- Use `StatusCode` when the status is not the default.

---

# 10) Error Style

The codebase uses custom domain errors.

Available error classes:
- `BadRequest`
- `Unauthorized`
- `NotFound`
- `Conflict`

## Rules
- Throw domain errors from services and middleware.
- Do not return failure JSON manually from services.
- Do not throw generic `Error` for expected business failures.
- GraphQL validation/errors are mapped using `MapGQLError(...)`.

---

# 11) Authentication / Authorization Style

## 11.1 REST auth is middleware-based
Protected routes use:
```ts
authentication()
```

Optional token type is supported:
```ts
authentication(tokenType)
```

## 11.2 Middleware writes auth data onto `req`
The request is extended with:
- `req.user`
- `req.tokenPayload`

Controllers and services rely on these values rather than re-decoding tokens.

## 11.3 Token blacklist / credential invalidation uses Redis
The authentication flow checks:
- token signature / token type
- blacklist token key in Redis
- user existence
- `changeCreditTime` invalidation

New auth-sensitive code should integrate with this existing flow, not invent a separate one.

---

# 12) File Upload Style

File upload handling is centralized with the multer config helper:
```ts
cloudFileUpload({}).single("profilePic")
cloudFileUpload({}).array("createPostImage", 5)
```

Rules:
- upload middleware lives in controller
- upload processing / Cloudinary persistence lives in service
- validation uses `validation(schema, true)` when file presence is part of the body contract

---

# 13) Notification / Side Effect Style

Notification sending and Redis token retrieval are orchestrated in services.

Common pattern:
1. validate target users exist
2. fetch FCM tokens from Redis
3. send notifications via `NotificationService`

Do not send notifications from controllers.

---

# 14) GraphQL Style

GraphQL is integrated alongside REST, not instead of it.

## Layout
Global GraphQL composition lives in:
- `Modules/gql/schame.gql.ts`
- `Modules/gql/type.gql.ts`

Feature-specific GraphQL logic lives under the feature module’s `gql/` folder.

## Resolver style
Resolvers are class methods on a singleton resolver instance:
```ts
class PostResolver {
  private _postService = postService;

  reactPost = async (parent, args, context) => {
    validationGQL(reactPostValidation, args);
    return await this._postService.likeOrDislikePost(...);
  };
}

export default new PostResolver();
```

## Rules
- Resolver should validate args with `validationGQL(...)`
- Resolver should delegate business logic to the existing service
- Resolver should use the GraphQL context object for authenticated user data

---

# 15) Realtime / Socket Style

Realtime auth and connection bootstrapping are handled centrally in `Modules/realtime/realtime.gateway.ts`.

Feature-specific socket event registration is delegated to module gateways such as chat.

Pattern:
1. global gateway authenticates socket
2. auth result is written to `socket.data`
3. feature gateway registers events

Rules:
- global socket auth stays in the central realtime gateway
- feature events stay in module-specific realtime files
- event payload validation uses `validationRealtime(...)`

---

# 16) DTO Style

DTO files exist per module and are used for service typing.

Examples:
- `auth.dto.ts`
- `post.dto.ts`
- `comment.dto.ts`
- `chat.dto.ts`
- `user.dto.ts`

Rules:
- DTOs should describe request payloads used by the service layer
- service methods should prefer DTO types over ad-hoc object types when the DTO already exists
- if a module gains a new payload shape, add it to that module’s DTO file

---

# 17) Bootstrap Style

`main.ts` should stay minimal:
```ts
import bootstrap from "./app.bootstrap.js";
bootstrap();
```

`app.bootstrap.ts` is responsible for:
- app creation
- DB connection
- Redis connection
- Express middleware registration
- GraphQL route registration
- REST router mounting
- root route
- global error handler
- HTTP server start
- realtime gateway initialization

Do not move feature logic into bootstrap.

---

# 18) Conventions To Preserve Exactly

These are repository-specific conventions that new code should preserve unless the whole codebase is being refactored intentionally:

1. Use `.js` in TypeScript import paths.
2. Keep controllers thin and service-driven.
3. Use `success()` for REST success responses.
4. Throw domain errors from business logic.
5. Use repo classes instead of direct model access.
6. Keep module files named as `*.controller.ts`, `*.service.ts`, `*.validation.ts`, `*.dto.ts`.
7. Put GraphQL module code inside `Modules/<module>/gql/`.
8. Put module realtime code inside `Modules/<module>/realtime/` when needed.
9. Reuse `commonValidationField` and centralized validation middleware.
10. Export singleton instances for services and repos.
