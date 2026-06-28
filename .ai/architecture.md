# Architecture Rules

## Clean Architecture

Always follow:

Routes
→ Controllers
→ Services
→ Repositories
→ Database

## Responsibilities

### Routes

* Define routes only
* No business logic

### Controllers

* Handle request/response
* Validate request
* Call services
* No database access

### Services

* Business logic only
* Reusable
* Testable

### Repositories

* Database interaction only
* Prisma queries only

### Utils

* Generic helper functions

## Dependency Rules

Controllers must never call Prisma.

Services must never access Express Request or Response objects.

Repositories must never contain business logic.

## File Structure

backend/
src/
user.controller.ts
user.routes.ts
user.services.ts
user.repository.ts

