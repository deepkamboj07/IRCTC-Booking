# Phase 7 — Auth Frontend

## Goal
Build the login and register pages + the shared auth API layer.
After this phase: users can register, log in, and the JWT is stored so all subsequent
API calls include the Authorization header automatically.

## Files to Create
```
frontend/src/
├── shared/api/
│   └── auth.api.ts
├── apps/passenger/
│   ├── pages/auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   └── components/auth/
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
```

Wire up in `App.tsx`: replace the placeholder elements for `/login` and `/register`.

---

## 1. `src/shared/api/auth.api.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api.client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "PASSENGER" | "ADMIN";
  phone?: string;
  createdAt: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const authKeys = {
  me: ["auth", "me"] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      api.post<{ data: AuthResponse }>("/auth/register", payload).then(r => r.data.data),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post<{ data: AuthResponse }>("/auth/login", payload).then(r => r.data.data),
  });
}

export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () =>
      api.get<{ data: AuthUser }>("/auth/me").then(r => r.data.data),
    retry: false,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; phone?: string }) =>
      api.patch<{ data: AuthUser }>("/auth/me", payload).then(r => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}
```

---

## 2. `src/apps/passenger/components/auth/LoginForm.tsx`

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Field } from "../../../../shared/components/ui/Field";
import { useLogin } from "../../../../shared/api/auth.api";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { extractError } from "../../../../shared/utils/extractError";

const schema = z.object({
  email:    z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginMutation = useLogin();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const data = await loginMutation.mutateAsync(values);
      login(data.user, data.token);
      navigate(data.user.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      setError("root", { message: extractError(err) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Email" required error={errors.email?.message}>
        <Input type="email" {...register("email")} placeholder="you@example.com" />
      </Field>

      <Field label="Password" required error={errors.password?.message}>
        <Input type="password" {...register("password")} placeholder="••••••••" />
      </Field>

      {errors.root && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {errors.root.message}
        </div>
      )}

      <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-hover" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign In"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link to="/register" className="text-brand-primary font-medium hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
```

---

## 3. `src/apps/passenger/components/auth/RegisterForm.tsx`

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Field } from "../../../../shared/components/ui/Field";
import { useRegister } from "../../../../shared/api/auth.api";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { extractError } from "../../../../shared/utils/extractError";

const schema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  email:    z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone:    z.string().regex(/^\d{10}$/, "Enter 10-digit phone number").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const registerMutation = useRegister();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const payload = { ...values, phone: values.phone || undefined };
      const data = await registerMutation.mutateAsync(payload);
      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError("root", { message: extractError(err) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Full Name" required error={errors.name?.message}>
        <Input {...register("name")} placeholder="Deep Kamboj" />
      </Field>

      <Field label="Email" required error={errors.email?.message}>
        <Input type="email" {...register("email")} placeholder="you@example.com" />
      </Field>

      <Field label="Password" required error={errors.password?.message}>
        <Input type="password" {...register("password")} placeholder="Minimum 8 characters" />
      </Field>

      <Field label="Phone" error={errors.phone?.message} hint="Optional — 10-digit mobile number">
        <Input {...register("phone")} placeholder="9876543210" maxLength={10} />
      </Field>

      {errors.root && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {errors.root.message}
        </div>
      )}

      <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-hover" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create Account"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="text-brand-primary font-medium hover:underline">
          Sign In
        </Link>
      </p>
    </form>
  );
}
```

---

## 4. Pages (Thin Shells)

### `src/apps/passenger/pages/auth/LoginPage.tsx`
```tsx
import { LoginForm } from "../../components/auth/LoginForm";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your IRCTC account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
```

### `src/apps/passenger/pages/auth/RegisterPage.tsx`
```tsx
import { RegisterForm } from "../../components/auth/RegisterForm";

export function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
          <p className="text-sm text-slate-500 mt-1">Book train tickets across India</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
```

---

## 5. Wire up in `App.tsx`
Replace the placeholders for `/login` and `/register` with real imports:

```tsx
import { LoginPage }    from "./apps/passenger/pages/auth/LoginPage";
import { RegisterPage } from "./apps/passenger/pages/auth/RegisterPage";

// In Routes:
<Route path="/login"    element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
```

---

## Verification Checklist

- Navigate to `/register` — form renders with 4 fields
- Fill form, submit → redirected to `/`
- Check `localStorage` in DevTools: `irtc_token` and `irtc_user` should be set
- Navigate to `/login`, sign in → redirected to `/` (PASSENGER) or `/admin` (ADMIN)
- Wrong password → shows error message inline (not an alert popup)
- Navbar shows "My Bookings" + "Logout" after login (since `useAuth` reads localStorage)

## Gotchas
- Admin users go to `/admin`, passengers go to `/` after login — check `data.user.role`
- `errors.root` is the catch-all error field — always `setError("root", ...)` in the catch block, never `alert()`
- Empty phone field — send `undefined` not `""` to the API (backend validates regex only if present)
- The `useAuth` hook is synchronous (localStorage) — no loading state needed on page load
