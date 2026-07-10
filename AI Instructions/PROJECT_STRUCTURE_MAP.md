# PROJECT_STRUCTURE_MAP

This file maps the current repository structure and explains the responsibility of each folder / file type based on the codebase itself.

---

# 1) Top-Level Runtime Flow

The application starts here:

```txt
src/main.ts
  -> imports bootstrap from app.bootstrap.ts
  -> executes bootstrap()

src/app.bootstrap.ts
  -> creates express app
  -> connects MongoDB
  -> connects Redis
  -> registers JSON middleware
  -> registers GraphQL endpoint
  -> mounts REST routers
  -> mounts global error middleware
  -> starts HTTP server
  -> initializes Socket.IO realtime gateway
```

So the actual application entry chain is:

```txt
main.ts
  -> app.bootstrap.ts
    -> DB / Redis startup
    -> REST + GraphQL setup
    -> realtime setup
```

---

# 2) Repository Structure

```txt
src/
  main.ts
  app.bootstrap.ts

  Common/
  config/
  DB/
  enums/
  Middleware/
  Modules/
  Repo/
```

---

# 3) `src/Common/`

`Common/` contains shared infrastructure and cross-module helpers.

## Current sub-areas

### `Common/Cloudinary/`
Cloudinary upload/delete helpers.

Files:
- `cloudinary.service.ts`

Responsibility:
- upload files to Cloudinary
- delete uploaded files from Cloudinary

Used by:
- post service
- comment service
- any future feature with media upload

---

### `Common/Email/`
Email sending infrastructure.

Files:
- `email.config.ts`
- `email.service.ts`

Responsibility:
- mail transport configuration
- sending OTP / email flows

Used heavily by:
- auth module

---

### `Common/Exeptions/`
Custom error system.

Files:
- `custom.error.ts`
- `domain.error.ts`

Responsibility:
- define base custom error
- define domain-level error classes
- map domain errors to GraphQL errors

Key exported error types:
- `BadRequest`
- `Unauthorized`
- `NotFound`
- `Conflict`

---

### `Common/interfaces/`
Project-level interface extensions / shared TS interfaces.

Files:
- `express.interface.ts`

Responsibility:
- extend Express request typing to support fields like `req.user`, `req.tokenPayload`, etc.

---

### `Common/multer/`
Upload middleware configuration and upload-related validation helpers.

Files:
- `multer.config.ts`
- `multer.validation.ts`

Responsibility:
- build multer middleware instances
- centralize file upload configuration

Used by:
- user controller
- post controller
- comment controller

---

### `Common/Notification/`
Push notification integration.

Files:
- `Notification.service.ts`

Responsibility:
- send notifications to device tokens
- used together with Redis FCM token storage

Used by:
- auth
- post
- comment

---

### `Common/OTP/`
OTP generation / helper logic.

Files:
- `otp.service.ts`

Responsibility:
- support OTP workflows used by auth/email flows

---

### `Common/Response/`
Standard success response builder.

Files:
- `success.response.ts`

Responsibility:
- normalize successful REST responses

Used by:
- controllers across modules

---

### `Common/security/`
Security utilities.

Files:
- `encrypt.ts`
- `hash.ts`
- `token.ts`

Responsibility:
- hashing
- encryption
- token generation / verification / token checks

Used by:
- auth
- authentication middleware
- realtime auth

---

# 4) `src/config/`

Files:
- `config.service.ts`

Responsibility:
- read and export environment/config values such as ports, Google client id, etc.

Used by:
- bootstrap
- auth
- email/cloudinary/other shared services as needed

---

# 5) `src/DB/`

`DB/` contains persistence-level infrastructure.

## `DB/dbconnection.ts`
Responsibility:
- establish MongoDB connection

Used by:
- `app.bootstrap.ts`

## `DB/Models/`
Contains Mongoose models and document interfaces for main entities.

Current models:
- `user.model.ts`
- `post.model.ts`
- `comment.model.ts`
- `chat.model.ts`

Responsibility:
- define schema, model, and entity shape for MongoDB documents

## `DB/Redis/`
Redis integration.

Files:
- `redis.connection.ts`
- `redis.service.ts`

Responsibility:
- create Redis connection
- expose Redis helper methods for:
  - OTP storage
  - token blacklist
  - FCM token sets
  - other cache / key utilities

Used by:
- auth
- user
- post
- comment
- auth middleware

---

# 6) `src/enums/`

Contains project-wide enums used by services, validation, auth, and models.

Current enums include:
- `chat.enum.ts`
- `email.enum.ts`
- `multer.enum.ts`
- `post.enum.ts`
- `react.enum.ts`
- `token.enum.ts`
- `user.enums.ts`

Responsibility:
- centralize numeric/string enum values that represent business states or config choices

Examples:
- post privacy
- reaction type
- token type
- provider type
- role/gender values
- chat type

---

# 7) `src/Middleware/`

Contains Express middleware and shared validation helpers.

## `authentication.middleware.ts`
Responsibility:
- read bearer token
- decode/verify token
- validate token type
- check Redis blacklist
- load current user
- reject invalidated credentials
- write `req.user` and `req.tokenPayload`

Used by:
- protected REST routes

## `authorization.middleware.ts`
Responsibility:
- role/permission checks after authentication when needed

## `globalErr.middleware.ts`
Responsibility:
- catch thrown errors and convert them into HTTP responses

## `validation.middleware.ts`
Responsibility:
- validate `body`, `params`, `query` against Zod schemas
- optionally merge uploaded files into `req.body.files`
- expose:
  - `validation(...)` for REST
  - `validationGQL(...)` for GraphQL
  - `validationRealtime(...)` for socket payloads
  - `commonValidationField` shared validators

This file is a central piece of the repository style.

---

# 8) `src/Repo/`

`Repo/` is the database access layer over Mongoose models.

## `db.repo.ts`
Base repository abstraction.

Shared methods:
- `create`
- `findOne`
- `findOneAndUpdate`
- `find`
- `findById`
- `updateOne`
- `getDBDoc`
- `saveDBDoc`
- `paginate`

Responsibility:
- provide a uniform API for common model operations

## Entity repositories
Current files:
- `user.repo.ts`
- `post.repo.ts`
- `comment.repo.ts`
- `chat.repo.ts`

Responsibility:
- extend `DBRepo<T>`
- expose entity-specific reusable query logic

Example:
- `post.repo.ts` contains post privacy query helper logic

This means the repo layer is not just CRUD wrapping; it also holds reusable entity-aware DB filters.

---

# 9) `src/Modules/`

`Modules/` contains feature modules. This is the main application feature layer.

Current modules:
- `auth`
- `user`
- `post`
- `comment`
- `chat`
- `gql`
- `realtime`

---

# 10) Standard Module File Types

A normal module in this repository may contain some or all of the following:

```txt
Modules/<module>/
  <module>.controller.ts
  <module>.service.ts
  <module>.validation.ts
  <module>.dto.ts
```

## Responsibility of each file type

### `*.controller.ts`
HTTP route registration and request orchestration.

Responsibilities:
- create router
- apply auth / validation / upload middleware
- call service
- return `success(...)`

### `*.service.ts`
Business logic.

Responsibilities:
- load and validate entities
- orchestrate repos
- build updates
- call shared services like Redis, mail, cloudinary, notification
- throw domain errors

### `*.validation.ts`
Zod request schemas for REST endpoints.

Responsibilities:
- define `body`, `params`, `query` contracts
- use shared validators and custom cross-field checks

### `*.dto.ts`
Module-local request payload / method typing.

Responsibilities:
- define types used by service methods and internal module logic

---

# 11) Module-by-Module Map

## 11.1 `Modules/auth/`

Files:
- `auth.controller.ts`
- `auth.service.ts`
- `auth.validation.ts`
- `auth.dto.ts`

Responsibility:
- login
- signup
- email confirmation
- resend confirmation OTP
- forget-password OTP flow
- reset password
- Google login/signup flow

Dependencies:
- `user.repo`
- token service
- hash/encrypt helpers
- email service
- Redis service
- notification service
- Google auth client

This module is the authentication and account recovery entry point.

---

## 11.2 `Modules/user/`

Files:
- `user.controller.ts`
- `user.service.ts`
- `user.validation.ts`
- `user.dto.ts`
- `gql/` folder

Responsibility:
- current user retrieval
- logout
- profile upload endpoint
- user GraphQL features
- nested chat routing under `/user/:userId/chat`

Notable structural detail:
`user.controller.ts` mounts `chatRouter` under:
```txt
/user/:userId/chat
```

So user is also the entry path for one-to-one chat access.

---

## 11.3 `Modules/post/`

Files:
- `post.controller.ts`
- `post.service.ts`
- `post.validation.ts`
- `post.dto.ts`
- `gql/` folder

Responsibility:
- create post
- fetch posts with pagination/search/privacy filtering
- update post
- react to post
- GraphQL post operations

Dependencies:
- `post.repo`
- `user.repo`
- Redis
- notification service
- Cloudinary

This module is a good reference module for the repository’s overall style because it includes:
- controller
- service
- validation
- dto
- repo usage
- file upload handling
- GraphQL integration

---

## 11.4 `Modules/comment/`

Files:
- `comment.controller.ts`
- `comment.service.ts`
- `comment.validation.ts`
- `comment.dto.ts`

Responsibility:
- create comment on post
- reply to comment
- comment details retrieval

Dependencies:
- `comment.repo`
- `post.repo`
- `user.repo`
- Redis
- notification service
- Cloudinary

This module mirrors post patterns closely, but for comments and replies.

---

## 11.5 `Modules/chat/`

Files:
- `chat.controller.ts`
- `chat.service.ts`
- `chat.validation.ts`
- `chat.dto.ts`
- `realtime/chat.event.ts`
- `realtime/chat.gateway.ts`

Responsibility:
- fetch one-to-one chat
- fetch group chat
- send realtime chat messages / register chat socket events

This module is the reference for **feature-local realtime integration**.

---

## 11.6 `Modules/gql/`

Files:
- `schame.gql.ts`
- `type.gql.ts`

Responsibility:
- central GraphQL schema composition / shared GraphQL types/context definitions

This folder is **global GraphQL infrastructure**, not a business module like `post` or `user`.

---

## 11.7 `Modules/realtime/`

Files:
- `realtime.gateway.ts`

Responsibility:
- create Socket.IO server
- authenticate socket connections
- register feature gateways such as chat realtime

This is the **global realtime bootstrap layer**.

---

# 12) GraphQL Feature Folder Pattern

Some modules contain a nested `gql/` folder.

Examples:
- `Modules/post/gql/`
- `Modules/user/gql/`

Typical contents:
- `*.args.ts`
- `*.gql.validation.ts`
- `*.resolvers.ts`
- `*.schema.ts`
- `*.type.ts`

## Responsibilities

### `*.args.ts`
GraphQL argument definitions or argument helpers.

### `*.gql.validation.ts`
Zod validation for GraphQL args/payloads.

### `*.resolvers.ts`
Resolver methods that call service methods.

### `*.schema.ts`
Feature schema definitions / resolver exports used by GraphQL assembly.

### `*.type.ts`
GraphQL type definitions for the feature.

---

# 13) Realtime Feature Folder Pattern

Some modules may include a nested `realtime/` folder.

Example:
- `Modules/chat/realtime/`

Typical contents:
- `chat.event.ts`
- `chat.gateway.ts`

## Responsibilities

### `*.event.ts`
Per-event payload validation / event handler grouping

### `*.gateway.ts`
Feature-level event registration logic using the authenticated socket

The global socket server and socket authentication stay outside in `Modules/realtime/realtime.gateway.ts`.

---

# 14) How A Typical REST Request Moves Through The Codebase

Example request path shape:

```txt
HTTP Request
  -> Modules/<module>/<module>.controller.ts
  -> Middleware/authentication.middleware.ts (if protected)
  -> Middleware/validation.middleware.ts
  -> Modules/<module>/<module>.service.ts
  -> Repo/<entity>.repo.ts
  -> DB/Models/<entity>.model.ts
  -> success.response.ts
```

If files are uploaded:

```txt
controller
  -> Common/multer/multer.config.ts
  -> validation(..., true)
  -> service
  -> Common/Cloudinary/cloudinary.service.ts
```

If notifications are sent:

```txt
service
  -> DB/Redis/redis.service.ts
  -> Common/Notification/Notification.service.ts
```

---

# 15) How A Typical GraphQL Request Moves

```txt
/graphql
  -> app.bootstrap.ts GraphQL handler
  -> Modules/gql/schame.gql.ts
  -> Modules/<module>/gql/<module>.resolvers.ts
  -> validationGQL(...)
  -> Modules/<module>/<module>.service.ts
  -> Repo layer
```

---

# 16) How A Typical Socket Event Moves

```txt
socket connection
  -> Modules/realtime/realtime.gateway.ts
  -> token validation / socket auth
  -> feature gateway registration (e.g. chat gateway)
  -> feature event handler
  -> service / repo logic
```

---

# 17) Recommended Reading Order For New Contributors

To understand the codebase quickly, read in this order:

1. `src/main.ts`
2. `src/app.bootstrap.ts`
3. `src/Middleware/validation.middleware.ts`
4. `src/Middleware/authentication.middleware.ts`
5. `src/Repo/db.repo.ts`
6. `src/Modules/post/` as the reference feature module
7. `src/Modules/comment/`
8. `src/Modules/auth/`
9. `src/Modules/chat/` + `src/Modules/realtime/`
10. `src/Modules/gql/`

That reading order gives the fastest understanding of:
- boot flow
- auth flow
- validation flow
- repo abstraction
- standard module pattern
- GraphQL integration
- realtime integration
