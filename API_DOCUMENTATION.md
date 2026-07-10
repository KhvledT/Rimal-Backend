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

---

## 1. Authentication (`/auth`)

### 1.1 Register Account (Signup)
*   **Method**: `POST`
*   **URL**: `http://localhost:3000/auth/signup`
*   **Headers**: 
    *   `Content-Type`: `application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "username": "admin_user",
      "email": "admin@rimal.com",
      "password": "SecurePassword123",
      "role": 1 // 1 represents RoleEnum.Admin, 0 represents RoleEnum.User
    }
    ```
*   **Sample Response (201 Created)**:
    ```json
    {
      "message": "Registration successful",
      "result": {
        "id": "64adfb8b2a3d76b1f23cde4a",
        "userName": "admin_user",
        "email": "admin@rimal.com",
        "role": 1
      }
    }
    ```

### 1.2 Authenticate (Login)
*   **Method**: `POST`
*   **URL**: `http://localhost:3000/auth/login`
*   **Headers**: 
    *   `Content-Type`: `application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "username": "admin_user", // Can be username or email
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
          "userName": "admin_user",
          "email": "admin@rimal.com",
          "role": 1
        },
        "accessToken": "eyJhbGciOi...", // Use this token to authenticate admin routes
        "refreshToken": "eyJhbGciOi..."
      }
    }
    ```

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
