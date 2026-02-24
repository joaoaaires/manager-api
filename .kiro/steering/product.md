# Product Overview

manager-api is a REST API backend for user management. It provides:

- User registration and authentication (sign-up / sign-in) with JWT tokens
- User profile retrieval behind auth guards
- Password hashing with bcrypt
- Swagger/OpenAPI documentation served at `/docs`

The API currently has a single domain entity (User) and an auth layer built on top of it. Validation messages are in Portuguese (pt-BR).
