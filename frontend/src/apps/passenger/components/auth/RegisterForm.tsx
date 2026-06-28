import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Field } from "../../../../shared/components/ui/Field";
import { useRegister } from "../../../../shared/api/auth.api";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { extractError } from "../../../../shared/utils/extractError";

const schema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone:    z
    .string()
    .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const navigate         = useNavigate();
  const { login }        = useAuth();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const payload = { ...values, phone: values.phone || undefined };
      const data    = await registerMutation.mutateAsync(payload);
      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError("root", { message: extractError(err) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label="Full name" required error={errors.name?.message}>
        <Input
          autoComplete="name"
          placeholder="Aanya Sharma"
          {...register("name")}
        />
      </Field>

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
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
          {...register("password")}
        />
      </Field>

      <Field
        label="Mobile number"
        error={errors.phone?.message}
        hint="Optional — 10-digit number without country code"
      >
        <Input
          type="tel"
          inputMode="numeric"
          placeholder="9876543210"
          maxLength={10}
          {...register("phone")}
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
            Creating account…
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-brand-primary font-semibold hover:text-brand-hover hover:underline transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
