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
import { useSession } from "@/hooks/useSession";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh: refreshSession } = useSession();
  const nextParam = searchParams.get("next");
  const returnTo = safeNextPath(nextParam);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (nextParam) return;
    if (typeof window === "undefined") return;
    const from = pathFromReferrer(document.referrer, window.location.origin);
    if (!from) return;
    router.replace(withNextQuery("/signup", from));
  }, [nextParam, router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!agree) {
      setError("Please agree to the privacy policy to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error || "Unable to create account.");
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
      track("signed_up", { method: "password" });
      router.replace(returnTo);
      router.refresh();
    } catch {
      setError("Unable to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="JOIN HIM"
      title="CREATE ACCOUNT"
      subtitle="Register for a more considered wardrobe."
      imageSrc="/products/man-image-104.webp"
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="signup-name">Full name</label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Aarav Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-phone">Phone (optional)</label>
          <input
            id="signup-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-password">Password</label>
          <div className="auth-password-wrap">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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

        <div className="auth-field">
          <label htmlFor="signup-confirm">Confirm password</label>
          <input
            id="signup-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        <label className="auth-check">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            I agree to the{" "}
            <Link
              href="#"
              className="auth-link"
              style={{ borderBottom: "1px solid currentColor" }}
            >
              privacy policy
            </Link>
          </span>
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button
          type="submit"
          className="auth-submit"
          disabled={submitting}
          style={{ background: "#c4a574", color: "#111" }}
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <AuthCrossLink
        prompt="Already have an account?"
        href={withNextQuery("/login", nextParam)}
        label="Sign in"
      />
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
