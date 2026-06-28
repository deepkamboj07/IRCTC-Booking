import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Field } from "../../../../shared/components/ui/Field";
import { useLogin } from "../../../../shared/api/auth.api";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { extractError } from "../../../../shared/utils/extractError";

const schema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const navigate      = useNavigate();
  const { login }     = useAuth();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label="Email address" required error={errors.email?.message}>
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
        />
      </Field>

      <Field label="Password" required error={errors.password?.message}>
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register("password")}
        />
      </Field>

      {errors.root && (
        <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errors.root.message}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-brand-primary hover:bg-brand-hover text-white font-semibold h-11"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="text-brand-primary font-semibold hover:text-brand-hover hover:underline transition-colors"
        >
          Create one free
        </Link>
      </p>
    </form>
  );
}
