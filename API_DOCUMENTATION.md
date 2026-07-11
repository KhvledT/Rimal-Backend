# Rimal API Documentation & Postman Guide

This guide describes how to test and call all endpoints in the Rimal backend project using Postman.

All responses use the standardized repository success wrapper format:
```json
{
  "message": "Success message string",
  "result": { ... } // Payload data (omitted or null for simple action endpoints)
}
```

---

## Table of Contents
1. [Authentication (`/auth`)](#1-authentication-auth)
2. [Contact inquiries (`/contact`)](#2-contact-inquiries-contact)
3. [Team members (`/team`)](#3-team-members-team)
4. [Company Contact Info (`/contact-info`)](#4-company-contact-info-contact-info)
5. [Corporate Profile PDF (`/corporate-profile`)](#5-corporate-profile-pdf-corporate-profile)
6. [Admin Management (Super Admin Only) (`/admin`)](#6-admin-management-super-admin-only-admin)
7. [Health Diagnostics (`/health`)](#7-health-diagnostics-health)
8. [Rate Limiting Policy](#8-rate-limiting-policy)

---

## 1. Authentication (`/auth`)

### 1.1 Initiate Registration (Signup)
*   **Method**: `POST`
*   **URL**: `http://localhost:3000/auth/signup`
*   **Headers**: 
    *   `Content-Type`: `application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "username": "new_user",
      "email": "user@rimal.com",
      "password": "SecurePassword123"
    }
    ```
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Verification code sent successfully",
      "result": {
        "email": "user@rimal.com"
      }
    }
    ```

### 1.2 Verify Registration (Verify Signup)
*   **Method**: `POST`
*   **URL**: `http://localhost:3000/auth/verify-signup`
*   **Headers**: 
    *   `Content-Type`: `application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "email": "user@rimal.com",
      "otp": "123456",
      "username": "new_user",
      "password": "SecurePassword123",
      "phone": "+974 4400 1234" // Optional
    }
    ```
*   **Sample Response (201 Created)**:
    ```json
    {
      "message": "Registration successful",
      "result": {
        "id": "64adfb8b2a3d76b1f23cde4a",
        "userName": "new_user",
        "email": "user@rimal.com",
        "role": 0 // Forces RoleEnum.User (0)
      }
    }
    ```

### 1.3 Resend Registration Code (Resend OTP)
*   **Method**: `POST`
*   **URL**: `http://localhost:3000/auth/resend-signup-otp`
*   **Headers**: 
    *   `Content-Type`: `application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "email": "user@rimal.com"
    }
    ```
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Verification code resent successfully",
      "result": {
        "email": "user@rimal.com"
      }
    }
    ```

### 1.4 Authenticate (Login)
*   **Method**: `POST`
*   **URL**: `http://localhost:3000/auth/login`
*   **Headers**: 
    *   `Content-Type`: `application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "username": "new_user", // Can be username or email
      "password": "SecurePassword123"
    }
    ```
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Login successful",
      "result": {
        "user": {
          "id": "64adfb8b2a3d76b1f23cde4a",
          "userName": "new_user",
          "email": "user@rimal.com",
          "role": 0 // 0: User, 1: Admin, 2: SuperAdmin
        },
        "accessToken": "eyJhbGciOi...",
        "refreshToken": "eyJhbGciOi..."
      }
    }
    ```

### 1.5 Terminate Session (Logout)
*   **Method**: `POST`
*   **URL**: `http://localhost:3000/auth/logout`
*   **Headers**: 
    *   `Authorization`: `Bearer <accessToken>`
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Logged out successfully"
    }
    ```

### 1.6 Refresh Access Token (`/auth/refresh-token`)
*   **Method**: `POST`
*   **URL**: `http://localhost:3000/auth/refresh-token`
*   **Headers**: 
    *   `Content-Type`: `application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "refreshToken": "eyJhbGciOi..."
    }
    ```
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Token refreshed successfully",
      "result": {
        "accessToken": "eyJhbGciOi...",
        "refreshToken": "eyJhbGciOi..."
      }
    }
    ```
*   **Security Properties**:
    *   **Token type validation**: Token type is verified from the explicit `type` field inside the JWT payload body — not only from the `aud` array. An access token will always be rejected even if the audience array is manually crafted.
    *   **Automatic rotation**: Each successful call generates a completely new access token and refresh token. The previous refresh token is permanently invalidated.
    *   **Reuse detection**: If a previously rotated (or revoked) refresh token is submitted, a `401` is returned. The session is already revoked — no further escalation is possible.
    *   **Concurrent request protection**: The session rotation uses a single atomic `findOneAndUpdate` that filters on both the `refreshTokenHash` and `isRevoked: false`. Concurrent requests using the same token cannot both succeed — the losing request is rejected with a `401`.
    *   **Session metadata**: Each successful rotation records `lastIp` and `lastUserAgent` on the session document for audit visibility.
    *   **Independent secrets**: Access and refresh tokens always use distinct signing secrets (`JWT_SECRET_ACCESS_*` vs `JWT_SECRET_REFRESH_*`) — they are never shared.

*   **Possible Errors**:

    | HTTP Status | Message | Cause |
    | :--- | :--- | :--- |
    | `400 Bad Request` | `Validation Error` | Missing or empty `refreshToken` field |
    | `401 Unauthorized` | `Invalid refresh token format` | Token cannot be decoded or is missing required claims |
    | `401 Unauthorized` | `Invalid token type: only refresh tokens are accepted` | `payload.type` is not `"refresh"` — explicit field check |
    | `401 Unauthorized` | `Invalid token type: access tokens cannot be used for refresh` | `aud` array does not contain `"refresh"` — defence-in-depth check |
    | `401 Unauthorized` | `Refresh token is invalid or has expired` | JWT signature check failed or token expiry exceeded |
    | `401 Unauthorized` | `Refresh token has already been used or is invalid` | Token was already rotated (replay attack) or a concurrent request won the race |
    | `401 Unauthorized` | `Session has been revoked. Please log in again` | Session was explicitly revoked (logout or prior reuse detection) |
    | `401 Unauthorized` | `Session has expired. Please log in again` | Session `expiresAt` passed |
    | `401 Unauthorized` | `User account no longer exists` | User was deleted after session was created |
    | `429 Too Many Requests` | `Too many token refresh attempts. Please try again later.` | Rate limit exceeded (10 requests per 15 minutes) |

---

## 2. Contact Inquiries (`/contact`)

### 2.1 Submit Inquiry (Public)
*   **Method**: `POST`
*   **URL**: `http://localhost:3000/contact`
*   **Headers**: 
    *   `Content-Type`: `application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "name": "John Doe",
      "email": "johndoe@example.com",
      "phone": "+974 1234 5678",
      "message": "We would like to schedule a corporate discussion regarding regional representation."
    }
    ```
*   **Sample Response (201 Created)**:
    ```json
    {
      "message": "Message Sent Successfully",
      "result": {
        "_id": "64adfd4d2a3d76b1f23cde50",
        "name": "John Doe",
        "email": "johndoe@example.com",
        "phone": "+974 1234 5678",
        "message": "We would like to schedule a corporate discussion regarding regional representation.",
        "createdAt": "2026-07-10T17:42:00.000Z",
        "updatedAt": "2026-07-10T17:42:00.000Z"
      }
    }
    ```

### 2.2 List Inquiries (Admin Only)
*   **Method**: `GET`
*   **URL**: `http://localhost:3000/contact?page=1&limit=10`
*   **Headers**: 
    *   `Authorization`: `Bearer <accessToken>`
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Messages Retrieved Successfully",
      "result": {
        "data": [
          {
            "_id": "64adfd4d2a3d76b1f23cde50",
            "name": "John Doe",
            "email": "johndoe@example.com",
            "phone": "+974 1234 5678",
            "message": "We would like to schedule a corporate discussion regarding regional representation.",
            "createdAt": "2026-07-10T17:42:00.000Z"
          }
        ],
        "totalItems": 1,
        "page": 1,
        "limit": 10,
        "totalPages": 1
      }
    }
    ```

### 2.3 Delete Inquiry (Admin Only)
*   **Method**: `DELETE`
*   **URL**: `http://localhost:3000/contact/64adfd4d2a3d76b1f23cde50`
*   **Headers**: 
    *   `Authorization`: `Bearer <accessToken>`
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Message Deleted Successfully"
    }
    ```

---

## 3. Team Members (`/team`)

### 3.1 List Team Members (Public)
*   **Method**: `GET`
*   **URL**: `http://localhost:3000/team`
*   **Headers**: None
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Team members retrieved successfully",
      "result": [
        {
          "_id": "64adfe1a2a3d76b1f23cde55",
          "name": "Hamad Al-Thani",
          "role": "Founder & CEO",
          "department": "Executive Office",
          "email": "ceo@rimal.com",
          "photo": "https://res.cloudinary.com/dcmjxhgc0/image/upload/avatar.jpg",
          "description": "Hamad leads Rimal's overall corporate expansion strategy.",
          "expertise": ["Sovereign Investments", "GCC Operations"],
          "linkedin": "https://linkedin.com/in/hamad-althani"
        }
      ]
    }
    ```

### 3.2 Create Team Member (Admin Only)
*   **Method**: `POST`
*   **URL**: `http://localhost:3000/team`
*   **Headers**: 
    *   `Authorization`: `Bearer <accessToken>`
    *   *Do NOT specify `Content-Type` header* (Postman sets the correct boundaries automatically).
*   **Request Body (form-data)**:
    *   `photo` (File): *[Select file option, then upload an image (png/jpg)]*
    *   `name` (Text): `Hamad Al-Thani`
    *   `role` (Text): `Founder & CEO`
    *   `department` (Text): `Executive Office`
    *   `email` (Text): `ceo@rimal.com`
    *   `description` (Text): `Hamad leads Rimal's overall corporate expansion strategy.`
    *   `expertise[0]` (Text): `Sovereign Investments`
    *   `expertise[1]` (Text): `GCC Operations`
    *   `linkedin` (Text): `https://linkedin.com/in/hamad-althani`
*   **Sample Response (201 Created)**:
    ```json
    {
      "message": "Team member created successfully",
      "result": {
        "_id": "64adfe1a2a3d76b1f23cde55",
        "name": "Hamad Al-Thani",
        "role": "Founder & CEO",
        "department": "Executive Office",
        "email": "ceo@rimal.com",
        "photo": "https://res.cloudinary.com/dcmjxhgc0/image/upload/v1234/team/avatar.jpg", // Uploaded image URL
        "description": "Hamad leads Rimal's overall corporate expansion strategy.",
        "expertise": ["Sovereign Investments", "GCC Operations"],
        "linkedin": "https://linkedin.com/in/hamad-althani"
      }
    }
    ```

### 3.3 Update Team Member (Admin Only)
*   **Method**: `PUT`
*   **URL**: `http://localhost:3000/team/64adfe1a2a3d76b1f23cde55`
*   **Headers**: 
    *   `Authorization`: `Bearer <accessToken>`
    *   *Do NOT specify `Content-Type` header* (Postman sets the correct boundaries automatically).
*   **Request Body (form-data)**:
    *   `photo` (File, Optional): *[Select file option, then upload a new image if replacing]*
    *   `role` (Text, Optional): `Executive Chairman & Founder`
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Team member updated successfully",
      "result": {
        "_id": "64adfe1a2a3d76b1f23cde55",
        "name": "Hamad Al-Thani",
        "role": "Executive Chairman & Founder",
        "department": "Executive Office",
        "email": "ceo@rimal.com",
        "photo": "https://res.cloudinary.com/dcmjxhgc0/image/upload/v5678/team/new_avatar.jpg",
        "description": "Hamad leads Rimal's overall corporate expansion strategy.",
        "expertise": ["Sovereign Investments", "GCC Operations"],
        "linkedin": "https://linkedin.com/in/hamad-althani"
      }
    }
    ```

### 3.4 Delete Team Member (Admin Only)
*   **Method**: `DELETE`
*   **URL**: `http://localhost:3000/team/64adfe1a2a3d76b1f23cde55`
*   **Headers**: 
    *   `Authorization`: `Bearer <accessToken>`
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Team member deleted successfully"
    }
    ```

---

## 4. Company Contact Info (`/contact-info`)

### 4.1 Fetch Contact Info (Public)
*   **Method**: `GET`
*   **URL**: `http://localhost:3000/contact-info`
*   **Headers**: None
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Contact info retrieved successfully",
      "result": {
        "_id": "64adff2c2a3d76b1f23cde60",
        "address": "Marina Twin Towers, Lusail, Doha, Qatar",
        "emails": ["info@rimal.com", "support@rimal.com"],
        "phones": ["+974 4400 1234", "+974 4400 5678"],
        "linkedIn": "https://linkedin.com/company/rimal",
        "mapUrl": "https://maps.google.com/maps?q=Twin+Towers+Lusail"
      }
    }
    ```

### 4.2 Update/Upsert Contact Info (Admin Only)
*   **Method**: `PUT`
*   **URL**: `http://localhost:3000/contact-info`
*   **Headers**: 
    *   `Authorization`: `Bearer <accessToken>`
    *   `Content-Type`: `application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "address": "Marina Twin Towers, Lusail, Doha, Qatar",
      "emails": ["info@rimal.com", "careers@rimal.com"],
      "phones": ["+974 4400 1234", "+974 4400 9999"],
      "linkedIn": "https://linkedin.com/company/rimal-group",
      "mapUrl": "https://maps.google.com/maps?q=Twin+Towers+Lusail"
    }
    ```
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Contact info updated successfully",
      "result": {
        "_id": "64adff2c2a3d76b1f23cde60",
        "address": "Marina Twin Towers, Lusail, Doha, Qatar",
        "emails": ["info@rimal.com", "careers@rimal.com"],
        "phones": ["+974 4400 1234", "+974 4400 9999"],
        "linkedIn": "https://linkedin.com/company/rimal-group",
        "mapUrl": "https://maps.google.com/maps?q=Twin+Towers+Lusail"
      }
    }
    ```

---

## 5. Corporate Profile PDF (`/corporate-profile`)

### 5.1 Fetch Corporate Profile Metadata (Public)
*   **Method**: `GET`
*   **URL**: `http://localhost:3000/corporate-profile`
*   **Headers**: None
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Corporate profile retrieved successfully",
      "result": {
        "previewUrl": "https://res.cloudinary.com/dcmjxhgc0/image/upload/v1234/corporate-profile/rimal_profile.pdf",
        "originalFilename": "rimal_profile.pdf",
        "mimeType": "application/pdf",
        "size": 5242880,
        "updatedAt": "2026-07-10T19:20:00.000Z"
      }
    }
    ```

### 5.2 Download Corporate Profile File (Public)
*   **Method**: `GET`
*   **URL**: `http://localhost:3000/corporate-profile/download`
*   **Headers**: None
*   **Response Headers**:
    *   `Content-Type`: `application/pdf` (or matches stored mimeType)
    *   `Content-Disposition`: `attachment; filename="rimal_profile.pdf"` (forces file download with its original name)
    *   `Cache-Control`: `no-cache, no-store, must-revalidate`
*   **Response Body**: Binary PDF stream (direct download, no JSON payload).

### 5.3 Upload/Replace Corporate Profile PDF (Admin Only)
*   **Method**: `PUT`
*   **URL**: `http://localhost:3000/corporate-profile`
*   **Headers**: 
    *   `Authorization`: `Bearer <accessToken>`
    *   *Do NOT specify `Content-Type` header* (Postman sets the correct boundaries automatically).
*   **Request Body (form-data)**:
    *   Key: `file`
    *   Value: *[Select file option, then upload a PDF file]*
*   **Postman Screen Reference**:
    1. Select the **Body** tab.
    2. Select the **form-data** option.
    3. Type `file` as the key, hover over the field and click the dropdown option to select **File**.
    4. Click **Select Files** in the Value column to upload the PDF.
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Corporate profile uploaded successfully",
      "result": {
        "previewUrl": "https://res.cloudinary.com/dcmjxhgc0/image/upload/v1234/corporate-profile/rimal_profile.pdf",
        "originalFilename": "rimal_profile.pdf",
        "mimeType": "application/pdf",
        "size": 5242880,
        "updatedAt": "2026-07-10T19:20:00.000Z"
      }
    }
    ```

### 5.4 Delete Corporate Profile PDF (Admin Only)
*   **Method**: `DELETE`
*   **URL**: `http://localhost:3000/corporate-profile`
*   **Headers**: 
    *   `Authorization`: `Bearer <accessToken>`
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Corporate profile deleted successfully"
    }
    ```

---

## 6. Admin Management (Super Admin Only) (`/admin`)

### 6.1 List Users
*   **Method**: `GET`
*   **URL**: `http://localhost:3000/admin/users`
*   **Headers**: 
    *   `Authorization`: `Bearer <superAdminAccessToken>`
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Users list retrieved successfully",
      "result": [
        {
          "id": "64adfb8b2a3d76b1f23cde4b",
          "userName": "john_doe",
          "email": "john@rimal.com",
          "phone": "+974 4400 9999",
          "role": 0,
          "createdAt": "2026-07-10T17:42:00.000Z"
        }
      ]
    }
    ```

### 6.2 List Admins
*   **Method**: `GET`
*   **URL**: `http://localhost:3000/admin/admins`
*   **Headers**: 
    *   `Authorization`: `Bearer <superAdminAccessToken>`
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Admins list retrieved successfully",
      "result": [
        {
          "id": "64adfb8b2a3d76b1f23cde4c",
          "userName": "sub_admin",
          "email": "subadmin@rimal.com",
          "phone": "+974 4400 8888",
          "role": 1,
          "createdAt": "2026-07-10T17:42:00.000Z"
        }
      ]
    }
    ```

### 6.3 Promote User to Admin
*   **Method**: `PATCH`
*   **URL**: `http://localhost:3000/admin/promote/64adfb8b2a3d76b1f23cde4b`
*   **Headers**: 
    *   `Authorization`: `Bearer <superAdminAccessToken>`
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "User promoted to Admin successfully",
      "result": {
        "id": "64adfb8b2a3d76b1f23cde4b",
        "userName": "john_doe",
        "email": "john@rimal.com",
        "phone": "+974 4400 9999",
        "role": 1,
        "createdAt": "2026-07-10T17:42:00.000Z"
      }
    }
    ```

### 6.4 Demote Admin to User
*   **Method**: `PATCH`
*   **URL**: `http://localhost:3000/admin/demote/64adfb8b2a3d76b1f23cde4c`
*   **Headers**: 
    *   `Authorization`: `Bearer <superAdminAccessToken>`
*   **Sample Response (200 OK)**:
    ```json
    {
      "message": "Admin demoted to User successfully",
      "result": {
        "id": "64adfb8b2a3d76b1f23cde4c",
        "userName": "sub_admin",
        "email": "subadmin@rimal.com",
        "phone": "+974 4400 8888",
        "role": 0,
        "createdAt": "2026-07-10T17:42:00.000Z"
      }
    }
    ```

---

## 7. Health Diagnostics (`/health`)

### 7.1 Check Application Health
*   **Method**: `GET`
*   **URL**: `http://localhost:3000/health`
*   **Headers**: None (Public)
*   **Sample Response (200 OK - Healthy)**:
    ```json
    {
      "message": "Application is healthy",
      "result": {
        "status": "UP",
        "timestamp": "2026-07-10T22:16:42.312Z",
        "environment": "development",
        "version": "1.0.0",
        "uptime": {
          "seconds": 55,
          "human": "55s"
        },
        "runtime": {
          "node": "v22.18.0"
        },
        "services": {
          "server": {
            "status": "UP"
          },
          "database": {
            "status": "UP",
            "provider": "mongodb"
          },
          "storage": {
            "status": "UP",
            "provider": "supabase"
          }
        }
      }
    }
    ```
*   **Sample Response (503 Service Unavailable - Unhealthy)**:
    ```json
    {
      "message": "Application is unhealthy",
      "result": {
        "status": "DOWN",
        "timestamp": "2026-07-10T22:17:10.450Z",
        "environment": "development",
        "version": "1.0.0",
        "uptime": {
          "seconds": 83,
          "human": "1m 23s"
        },
        "runtime": {
          "node": "v22.18.0"
        },
        "services": {
          "server": {
            "status": "UP"
          },
          "database": {
            "status": "DOWN",
            "provider": "mongodb"
          },
          "storage": {
            "status": "UP",
            "provider": "supabase"
          }
        }
      }
    }
    ```

---

## 8. Rate Limiting Policy

To protect the platform against Denial of Service (DoS), brute force, credential stuffing, and spamming abuse, rate limiting has been enforced on all public write endpoints using `express-rate-limit`.

All rate limit responses return **HTTP 429 Too Many Requests** with a standard JSON envelope:
```json
{
  "message": "Too many attempts. Please try again later."
}
```

### 8.1 Configured Limiters

| Key / Name | Target Endpoint | Default Limit | Rationale |
| :--- | :--- | :--- | :--- |
| **`authLogin`** | `POST /auth/login` | 5 requests per 15 mins | Mitigates brute-force credential stuffing and password guessing attacks. |
| **`authSignup`** | `POST /auth/signup` | 3 requests per 1 hour | Prevents massive automated bot registrations and spamming mail queues. |
| **`verifySignupOtp`** | `POST /auth/verify-signup`| 5 requests per 15 mins | Prevents brute-forcing the 6-digit OTP verification token. |
| **`resendSignupOtp`** | `POST /auth/resend-signup-otp`| 3 requests per 15 mins | Restricts mail resource consumption and prevents email flooding abuse. |
| **`contact`** | `POST /contact` | 5 requests per 1 hour | Stops automated contact submission spam from filling up database collections. |
| **`authRefreshToken`** | `POST /auth/refresh-token` | 10 requests per 15 mins | Prevents token refresh brute-forcing and replay-attack amplification. |

*Note: Authenticated admin endpoints and public read/download actions are exempt from rate limiting to facilitate high-frequency administration operations and normal site browsing.*
