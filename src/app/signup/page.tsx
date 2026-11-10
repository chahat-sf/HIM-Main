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
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
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
    router.replace(withNextQuery("/signup", from));
  }, [nextParam, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const signupBody = () => ({
    fullName: fullName.trim(),
    email: email.trim(),
    phone: phone.trim() || undefined,
    password,
  });

  const sendCode = async () => {
    const res = await fetch("/api/auth/signup/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(signupBody()),
    });
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (!res.ok) {
      setError(body?.error || "We couldn't send the verification email.");
      return false;
    }
    setCodeSent(true);
    setResendIn(30);
    setOtp("");
    return true;
  };

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

    if (!codeSent) {
      setSubmitting(true);
      try {
        await sendCode();
      } catch {
        setError("We couldn't send the verification email. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...signupBody(),
          otp: otp.trim(),
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
      <a className="auth-google" href={googleAuthHref("/signup", nextParam)}>
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
          <label htmlFor="signup-name">Full name</label>
          <input
            id="signup-name"
            name="name"
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
            name="email"
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
            name="tel"
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
              name="password"
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
            name="confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        {codeSent && (
          <div className="auth-field">
            <label htmlFor="signup-otp">Verification code</label>
            <p className="auth-footer-note" style={{ margin: 0, textAlign: "left" }}>
              We sent a 6-digit code to {email.trim()}. It expires in 10 minutes.
            </p>
            <input
              id="signup-otp"
              name="one-time-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
            <button
              type="button"
              className="auth-link"
              disabled={submitting || resendIn > 0}
              onClick={async () => {
                setError("");
                setSubmitting(true);
                try {
                  await sendCode();
                } catch {
                  setError("We couldn't send the verification email. Please try again.");
                } finally {
                  setSubmitting(false);
                }
              }}
              style={{
                alignSelf: "flex-start",
                background: "none",
                border: "none",
                padding: 0,
                cursor: resendIn > 0 ? "default" : "pointer",
              }}
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
          </div>
        )}

        <label className="auth-check">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            I agree to the{" "}
            <Link
              href="/privacy-policy"
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
          {submitting
            ? codeSent
              ? "Verifying…"
              : "Sending code…"
            : codeSent
              ? "Verify"
              : "Send code"}
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

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#EA4335" d="M9 7.2v3.5h4.9c-.2 1.2-1.5 3.5-4.9 3.5A5.7 5.7 0 1 1 9 3.3c1.6 0 2.7.7 3.3 1.3l2.3-2.2C13.3 1.1 11.4 0 9 0 4 0 0 4 0 9s4 9 9 9c5.2 0 8.6-3.6 8.6-8.7 0-.6 0-1-.1-1.4H9z" />
    </svg>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
