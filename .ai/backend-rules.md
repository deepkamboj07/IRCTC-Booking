# Backend Rules

## TypeScript

* Strict mode enabled
* No any type
* No ts-ignore
* Prefer interfaces

## Validation

Use Zod for all inputs.

Validate:

* Body
* Params
* Query

Never trust client input.

## Error Handling

Use centralized error handler.

Never expose stack traces.

Use custom errors:

* ValidationError
* NotFoundError
* UnauthorizedError
* ForbiddenError

## Logging

Use structured logging.

Never log:

* Passwords
* Tokens
* Secrets

## Security

Passwords:

* bcrypt hashing

Authentication:

* JWT Access Token

Environment Variables:

* Required
* Validated during startup

## Code Quality

Services should remain small.

One service = one responsibility.

Avoid functions longer than 200 lines.

# follow System Design Pattern whenever Required

use SOLID principle for writing Code
