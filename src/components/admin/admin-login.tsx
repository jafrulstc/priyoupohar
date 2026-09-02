"use client";

/**
 * Admin sign-in screen — shown inside the overlay whenever there is no
 * valid session (no token, or the API returned 401).
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Flower2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginValues } from "@/lib/admin-schemas";
import { ApiError, pyFetch, type LoginResponse } from "@/lib/py-api";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Spinner } from "./admin-ui";

export default function AdminLogin() {
  const setAuth = useAdminStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      const res = await pyFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: { email: values.email, password: values.password },
      });
      setAuth(res.access_token, res.user);
      toast.success(`Welcome back, ${res.user.name} 🌿`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Unexpected error — please try again.";
      setServerError(message);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="w-full max-w-sm rounded-3xl border bg-card p-6 shadow-lift sm:p-8"
      >
        {/* Brand mark */}
        <div className="flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-white shadow-lift">
            <Flower2 className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-foreground">
            Bloom <span className="text-gold">&amp;</span> Bliss{" "}
            <span className="text-brand dark:text-rose-400">Admin</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage products, orders &amp; more.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          {serverError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {serverError}
            </div>
          )}

          <Field label="Email" htmlFor="admin-email" error={errors.email?.message}>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              placeholder="admin@bloombliss.test"
              className="rounded-xl"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </Field>

          <Field label="Password" htmlFor="admin-password" error={errors.password?.message}>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="rounded-xl pr-10"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full gap-2 rounded-xl bg-brand text-base font-extrabold text-white hover:bg-rose-700"
          >
            {isSubmitting ? (
              <>
                <Spinner className="h-4.5 w-4.5" /> Signing in…
              </>
            ) : (
              <>
                <LogIn className="h-4.5 w-4.5" aria-hidden /> Sign in
              </>
            )}
          </Button>
        </form>

        <div className="mt-5 rounded-xl border border-dashed px-3 py-2.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Demo credentials
          </p>
          <code className="mt-1 inline-block rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
            admin@bloombliss.test / Admin@12345
          </code>
        </div>
      </motion.div>
    </div>
  );
}
