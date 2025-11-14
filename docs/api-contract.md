# API Contract Documentation

This document outlines the API endpoints and their contracts for the Sports Recruitment Platform.

## Base URL
- Development: `http://localhost:4000`
- Production: `https://api.sports-recruitment.com`

## Authentication

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "PLAYER",
      "isEmailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### POST /auth/signup
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "PLAYER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "PLAYER",
      "isEmailVerified": false
    }
  }
}
```

### POST /auth/google/login
Login with Google OAuth.

**Request Body:**
```json
{
  "credential": "google-jwt-credential"
}
```

### POST /auth/google/signup
Register with Google OAuth.

**Request Body:**
```json
{
  "credential": "google-jwt-credential",
  "userType": "PLAYER"
}
```

### POST /auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /auth/reset-password
Reset password with OTP.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

### POST /auth/verify-account
Verify email with OTP.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### POST /auth/resend-otp
Resend verification OTP.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

## Companies

### GET /companies
Get paginated list of companies.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "message": "Companies retrieved successfully",
  "data": [
    {
      "id": "company-id",
      "name": "Company Name",
      "email": "company@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### POST /companies/invite
Invite a company.

**Request Body:**
```json
{
  "email": "company@example.com"
}
```

### DELETE /companies/:id
Delete a company (Admin only).

## Clubs

### GET /clubs
Get paginated list of clubs.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search term

### POST /clubs/invite
Invite a club.

**Request Body:**
```json
{
  "email": "club@example.com"
}
```

### DELETE /clubs/:id
Delete a club (Admin only).

## Admin

### GET /admin/profile
Get admin profile (Admin only).

### PUT /admin/profile
Update admin profile (Admin only).

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information (in development only)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## Headers

### Required Headers
- `Content-Type: application/json` (for POST/PUT requests)

### Authentication Headers
- `Authorization: Bearer <jwt-token>` (for protected routes)

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP
