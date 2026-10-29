"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell, { AuthCrossLink } from "@/components/AuthShell";
import {
  pathFromReferrer,
  safeNextPath,
  withNextQuery,
} from "@/lib/auth-redirect";
import { mergeLocalCartToServer } from "@/lib/cart-local";
import { mergeLocalWishlistToServer } from "@/lib/wishlist-local";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const returnTo = safeNextPath(nextParam);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (nextParam) return;
    if (typeof window === "undefined") return;
    const from = pathFromReferrer(document.referrer, window.location.origin);
    if (!from) return;
    router.replace(withNextQuery("/login", from));
  }, [nextParam, router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
          remember,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error || "Unable to sign in.");
        return;
      }
      try {
        await mergeLocalCartToServer();
      } catch {
        /* guest cart merge is best-effort */
      }
      try {
        await mergeLocalWishlistToServer();
      } catch {
        /* guest wishlist merge is best-effort */
      }
      const { track } = await import("@/lib/analytics");
      track("logged_in", { method: "password" });
      router.replace(returnTo);
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="ACCOUNT"
      title="SIGN IN"
      subtitle="A more considered wardrobe begins here."
      imageSrc="/products/man-image-103.webp"
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <div className="auth-password-wrap">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="auth-row">
          <label className="auth-check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>
          <Link href="#" className="auth-link">
            Forgot password?
          </Link>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button
          type="submit"
          className="auth-submit"
          disabled={submitting}
          style={{ background: "#c4a574", color: "#111" }}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <AuthCrossLink
        prompt="New here?"
        href={withNextQuery("/signup", nextParam)}
        label="Create account"
      />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
