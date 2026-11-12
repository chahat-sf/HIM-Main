"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell, { AuthCrossLink } from "@/components/AuthShell";
import {
  googleAuthError,
  googleAuthHref,
  pathFromReferrer,
  safeNextPath,
  withNextQuery,
} from "@/lib/auth-redirect";
import { mergeLocalCartToServer } from "@/lib/cart-local";
import { ARCHIVIST_HERO } from "@/lib/page-heroes";
import { mergeLocalWishlistToServer } from "@/lib/wishlist-local";
import { useSession } from "@/hooks/useSession";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh: refreshSession } = useSession();
  const nextParam = searchParams.get("next");
  const returnTo = safeNextPath(nextParam);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const message = googleAuthError(searchParams.get("error"));
    if (message) setError(message);
  }, [searchParams]);

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
      await refreshSession();
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
      imageSrc={ARCHIVIST_HERO}
    >
      <a className="auth-google" href={googleAuthHref("/login", nextParam)}>
        <GoogleMark />
        Continue with Google
      </a>
      <p className="auth-or">or</p>
      <form
        className="auth-form"
        method="post"
        autoComplete="on"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="auth-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
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
              name="password"
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
              name="remember"
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

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#EA4335" d="M9 7.2v3.5h4.9c-.2 1.2-1.5 3.5-4.9 3.5A5.7 5.7 0 1 1 9 3.3c1.6 0 2.7.7 3.3 1.3l2.3-2.2C13.3 1.1 11.4 0 9 0 4 0 0 4 0 9s4 9 9 9c5.2 0 8.6-3.6 8.6-8.7 0-.6 0-1-.1-1.4H9z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
