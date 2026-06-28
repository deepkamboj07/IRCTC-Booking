# Phase 2 — Auth Module

## Goal
Build register + login + get-me + update-me endpoints following strict Clean Architecture.
No business logic in controllers. No DB access in services. No Express objects in services.

## Files to Create
```
backend/src/auth/
├── auth.schemas.ts
├── auth.repository.ts
├── auth.service.ts
├── auth.controller.ts
└── auth.routes.ts
```
Also: mount the router in `src/index.ts`.

---

## 1. `auth.schemas.ts`

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits").optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type UpdateMeDto = z.infer<typeof updateMeSchema>;
```

---

## 2. `auth.repository.ts`

Prisma queries ONLY. No business logic. Import `prisma` from `../config/prisma`.

```typescript
import { prisma } from "../config/prisma";
import { RegisterDto } from "./auth.schemas";

export const authRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });
  },

  createUser(data: { name: string; email: string; passwordHash: string; phone?: string }) {
    return prisma.user.create({
      data,
      select: { id: true, email: true, name: true, role: true },
    });
  },

  updateUser(id: string, data: { name?: string; phone?: string }) {
    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
  },
};
```

---

## 3. `auth.service.ts`

Business logic only. No Request/Response objects. Throws custom errors for bad states.

```typescript
import { authRepository } from "./auth.repository";
import { hashPassword, comparePassword } from "../utils/hash.utils";
import { signToken } from "../utils/jwt.utils";
import { ConflictError, UnauthorizedError, NotFoundError } from "../errors/app.errors";
import { RegisterDto, LoginDto, UpdateMeDto } from "./auth.schemas";

export const authService = {
  async register(dto: RegisterDto) {
    const existing = await authRepository.findByEmail(dto.email);
    if (existing) throw new ConflictError("Email already registered");

    const passwordHash = await hashPassword(dto.password);
    const user = await authRepository.createUser({
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return { user, token };
  },

  async login(dto: LoginDto) {
    const user = await authRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedError("Invalid email or password");

    const valid = await comparePassword(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid email or password");

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async getMe(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw new NotFoundError("User");
    return user;
  },

  async updateMe(userId: string, dto: UpdateMeDto) {
    return authRepository.updateUser(userId, dto);
  },
};
```

---

## 4. `auth.controller.ts`

Handles request/response only. Validates input via `validate` middleware (in routes).
Calls service. Returns JSON.

```typescript
import { Request, Response } from "express";
import { authService } from "./auth.service";
import { RegisterDto, LoginDto, UpdateMeDto } from "./auth.schemas";

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body as RegisterDto);
    res.status(201).json({ success: true, data: result });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body as LoginDto);
    res.json({ success: true, data: result });
  },

  async getMe(req: Request, res: Response) {
    const user = await authService.getMe(req.user!.id);
    res.json({ success: true, data: user });
  },

  async updateMe(req: Request, res: Response) {
    const user = await authService.updateMe(req.user!.id, req.body as UpdateMeDto);
    res.json({ success: true, data: user });
  },
};
```

---

## 5. `auth.routes.ts`

```typescript
import { Router } from "express";
import { authController } from "./auth.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { registerSchema, loginSchema, updateMeSchema } from "./auth.schemas";

export const authRouter = Router();

authRouter.post("/register", validate({ body: registerSchema }), authController.register);
authRouter.post("/login",    validate({ body: loginSchema }),    authController.login);
authRouter.get( "/me",       verifyJWT,                          authController.getMe);
authRouter.patch("/me",      verifyJWT, validate({ body: updateMeSchema }), authController.updateMe);
```

---

## 6. Mount in `src/index.ts`

Add after the health route, before `app.use(errorMiddleware)`:

```typescript
import { authRouter } from "./auth/auth.routes";
// ...
app.use("/api/v1/auth", authRouter);
```

---

## Response Shape (consistent across all endpoints)

```json
// Success
{ "success": true, "data": { ... } }

// Error (from errorMiddleware)
{ "success": false, "code": "CONFLICT", "message": "Email already registered" }
```

---

## Verification Checklist

```bash
# Register
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Deep","email":"deep@test.com","password":"secret123"}'
# → 201 { success: true, data: { user: {...}, token: "eyJ..." } }

# Duplicate email
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Deep","email":"deep@test.com","password":"secret123"}'
# → 409 { success: false, code: "CONFLICT" }

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"deep@test.com","password":"secret123"}'
# → 200 { success: true, data: { user: {...}, token: "eyJ..." } }

# Get me
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
# → 200 { success: true, data: { id, email, name, role } }

# No token
curl http://localhost:4000/api/v1/auth/me
# → 401 { success: false, code: "UNAUTHORIZED" }
```

## Gotchas
- Never log the password or passwordHash — only the hashed value is stored
- `passwordHash` must be excluded from all SELECT responses — use `select: {}` in Prisma or destructure it out
- Use `"Invalid email or password"` for both wrong email AND wrong password — never reveal which one failed
