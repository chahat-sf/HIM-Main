"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RouteLoading from "@/components/RouteLoading";
import type { AccountPayload } from "@/lib/account";
import { buildLoginHref } from "@/lib/auth-redirect";
import { toCardImage } from "@/lib/card-image";
import { firstNameFromFullName, formatDisplayDate } from "@/lib/format";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const BG = "#0a0a0a";
const INK = "#ffffff";
const MUTED = "rgba(255,255,255,0.45)";
const MUTED_SOFT = "rgba(255,255,255,0.55)";
const BORDER = "rgba(255,255,255,0.28)";
const RULE = "rgba(255,255,255,0.14)";
const GUTTER = "clamp(16px, 4vw, 60px)";
const CONTENT_MAX = "1120px";
const GOLD = "#c4a574";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="acc-card">{children}</div>;
}

function SectionHeader({
  title,
  action,
  onAction,
  href,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  href?: string;
}) {
  return (
    <div className="acc-section-header">
      <p className="acc-section-title">{title}</p>
      {action && onAction && (
        <button type="button" className="acc-action-link" onClick={onAction}>
          {action}
        </button>
      )}
      {action && href && !onAction && (
        <Link href={href} className="acc-action-link">
          {action}
        </Link>
      )}
    </div>
  );
}

function Chevron() {
  return (
    <ChevronRight
      size={10}
      strokeWidth={1.25}
      absoluteStrokeWidth={false}
      aria-hidden
      style={{ flexShrink: 0, opacity: 0.55 }}
    />
  );
}

function dash(value: string | null | undefined) {
  return value?.trim() ? value : "—";
}

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState<AccountPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [addrLabel, setAddrLabel] = useState("SHIPPING ADDRESS");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");
  const [makeDefaultAddress, setMakeDefaultAddress] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      let redirected = false;
      try {
        const res = await fetch("/api/account", { credentials: "include" });
        if (res.status === 401) {
          redirected = true;
          router.replace(buildLoginHref("/account"));
          return;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error || "Unable to load account.");
        }
        const payload = (await res.json()) as AccountPayload;
        if (!cancelled) {
          setData(payload);
          hydrateForms(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load account.");
        }
      } finally {
        // Stay on RouteLoading while navigating away on 401.
        if (!cancelled && !redirected) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function clearAddressForm(hasExisting: boolean) {
    setAddrLabel("SHIPPING ADDRESS");
    setLine1("");
    setLine2("");
    setCity("");
    setState("");
    setPostalCode("");
    setCountry("India");
    setMakeDefaultAddress(!hasExisting);
  }

  function hydrateForms(payload: AccountPayload) {
    setFullName(payload.user.fullName);
    setPhone(payload.user.phone ?? "");
    setDateOfBirth(payload.user.dateOfBirth?.slice(0, 10) ?? "");
  }

  async function onSignOut() {
    const { track } = await import("@/lib/analytics");
    track("logged_out");
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone: phone.trim() || null,
          dateOfBirth: dateOfBirth || null,
        }),
      });
      const body = (await res.json()) as AccountPayload & { error?: string };
      if (!res.ok) {
        setFormError(body.error || "Unable to update profile.");
        return;
      }
      setData(body);
      hydrateForms(body);
      setEditingProfile(false);
    } catch {
      setFormError("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveAddress(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: addrLabel,
          line1,
          line2: line2.trim() || null,
          city,
          state,
          postalCode,
          country,
          isDefault: makeDefaultAddress,
        }),
      });
      const body = (await res.json()) as AccountPayload & { error?: string };
      if (!res.ok) {
        setFormError(body.error || "Unable to save address.");
        return;
      }
      setData(body);
      hydrateForms(body);
      setEditingAddress(false);
      clearAddressForm(body.addresses.length > 0);
    } catch {
      setFormError("Unable to save address.");
    } finally {
      setSaving(false);
    }
  }

  async function onSetDefaultAddress(addressId: number) {
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/account/addresses/${addressId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const body = (await res.json()) as AccountPayload & { error?: string };
      if (!res.ok) {
        setFormError(body.error || "Unable to update default address.");
        return;
      }
      setData(body);
    } catch {
      setFormError("Unable to update default address.");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteAddress(addressId: number) {
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/account/addresses/${addressId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = (await res.json()) as AccountPayload & { error?: string };
      if (!res.ok) {
        setFormError(body.error || "Unable to delete address.");
        return;
      }
      setData(body);
      clearAddressForm(body.addresses.length > 0);
    } catch {
      setFormError("Unable to delete address.");
    } finally {
      setSaving(false);
    }
  }

  const welcomeName = data
    ? firstNameFromFullName(data.user.fullName)
    : "…";

  const detailRows: [string, string][] = data
    ? [
      ["Full Name", data.user.fullName],
      ["Email", data.user.email],
      ["Phone", dash(data.user.phone)],
      ["Date of Birth", dash(formatDisplayDate(data.user.dateOfBirth))],
    ]
    : [];

  if (loading) {
    return <RouteLoading />;
  }

  return (
    <>
      <Navbar />

      <main className="acc-page">
        <section
          className="acc-banner him-hero-media him-hero-media--center"
          aria-label="My Account"
        >
          <Image
            src="/products/man-image-103.webp"
            alt=""
            fill
            priority
            quality={80}
            sizes="100vw"
            className="object-cover"
            style={{ objectFit: "cover", objectPosition: "center 20%" }}
          />

          <div className="acc-hero">
            <div className="acc-hero-overlay" />
            <div className="acc-hero-content">
              <h1 className="acc-hero-title">MY ACCOUNT</h1>
              <p className="acc-hero-sub">
                A MORE CONSIDERED WARDROBE
                <br />
                BEGINS HERE.
              </p>
            </div>
          </div>

          <div className="acc-welcome">
            <div className="acc-welcome-dim" />
            <div className="acc-welcome-inner">
              <div className="acc-welcome-top">
                <p className="acc-welcome-label">WELCOME BACK</p>
                <button type="button" className="acc-signout" onClick={onSignOut}>
                  Sign out
                </button>
              </div>
              <h2 className="acc-welcome-name">{welcomeName}</h2>
              <p className="acc-welcome-tagline">
                {"A more considered wardrobe,\nfor wherever the day takes you."}
              </p>
            </div>
          </div>
        </section>

        <div className="acc-body">
          {error && <p className="acc-error">{error}</p>}
          {formError && <p className="acc-error">{formError}</p>}

          {data && (
            <>
              <div className="acc-two-col">
                <Card>
                  <SectionHeader
                    title="PERSONAL DETAILS"
                    action={editingProfile ? "CANCEL" : "EDIT"}
                    onAction={() => {
                      setFormError("");
                      if (editingProfile) hydrateForms(data);
                      setEditingProfile((v) => !v);
                    }}
                  />
                  {editingProfile ? (
                    <form className="acc-form" onSubmit={onSaveProfile}>
                      <label>
                        Full name
                        <input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Email
                        <input value={data.user.email} disabled />
                      </label>
                      <label>
                        Phone
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 …"
                        />
                      </label>
                      <label>
                        Date of birth
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                      </label>
                      <button
                        type="submit"
                        className="acc-save"
                        disabled={saving}
                        style={{ background: GOLD, color: "#111" }}
                      >
                        {saving ? "Saving…" : "Save details"}
                      </button>
                    </form>
                  ) : (
                    <table className="acc-details-table">
                      <tbody>
                        {detailRows.map(([label, value]) => (
                          <tr key={label}>
                            <td className="acc-detail-label">{label}</td>
                            <td className="acc-detail-value">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Card>

                <Card>
                  <SectionHeader
                    title="ADDRESSES"
                    action={editingAddress ? "CANCEL" : "ADD ADDRESS"}
                    onAction={() => {
                      setFormError("");
                      if (!editingAddress) {
                        clearAddressForm(data.addresses.length > 0);
                      }
                      setEditingAddress((v) => !v);
                    }}
                  />
                  {editingAddress ? (
                    <form className="acc-form" onSubmit={onSaveAddress}>
                      <label>
                        Label
                        <input
                          value={addrLabel}
                          onChange={(e) => setAddrLabel(e.target.value)}
                        />
                      </label>
                      <label>
                        Address line 1
                        <input
                          value={line1}
                          onChange={(e) => setLine1(e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Address line 2
                        <input
                          value={line2}
                          onChange={(e) => setLine2(e.target.value)}
                        />
                      </label>
                      <label>
                        City
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        State
                        <input
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Postal code
                        <input
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Country
                        <input
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        />
                      </label>
                      {data.addresses.length > 0 ? (
                        <label className="acc-check">
                          <input
                            type="checkbox"
                            checked={makeDefaultAddress}
                            onChange={(e) =>
                              setMakeDefaultAddress(e.target.checked)
                            }
                          />
                          Set as default shipping address
                        </label>
                      ) : null}
                      <button
                        type="submit"
                        className="acc-save"
                        disabled={saving}
                        style={{ background: GOLD, color: "#111" }}
                      >
                        {saving ? "Saving…" : "Add address"}
                      </button>
                    </form>
                  ) : null}
                  {!editingAddress && data.addresses.length === 0 ? (
                    <p className="acc-empty">No addresses yet</p>
                  ) : null}
                  {data.addresses.length > 0 ? (
                    <div className="acc-address-list">
                      {data.addresses.map((addr) => (
                        <div key={addr.id} className="acc-address-box">
                          <div className="acc-address-head">
                            <p className="acc-address-label">{addr.label}</p>
                            {addr.isDefault ? (
                              <span className="acc-address-badge">Default</span>
                            ) : null}
                          </div>
                          {addr.lines.map((line) => (
                            <p
                              key={`${addr.id}-${line}`}
                              className="acc-address-line"
                            >
                              {line}
                            </p>
                          ))}
                          <div className="acc-address-actions">
                            {!addr.isDefault ? (
                              <button
                                type="button"
                                className="acc-address-action"
                                disabled={saving}
                                onClick={() => void onSetDefaultAddress(addr.id)}
                              >
                                Set as default
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="acc-address-action"
                              disabled={saving}
                              onClick={() => void onDeleteAddress(addr.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </Card>
              </div>

              <Card>
                <SectionHeader title="ORDER HISTORY" />
                {data.orders.length === 0 ? (
                  <p className="acc-empty">No orders yet</p>
                ) : (
                  <div className="acc-orders-scroll">
                    <table className="acc-orders-table">
                      <thead>
                        <tr>
                          {["ORDER #", "DATE", "ITEMS", "STATUS", "TOTAL", ""].map(
                            (h, i) => (
                              <th key={h || `pad-${i}`}>{h}</th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {data.orders.map((order) => (
                          <tr key={order.id}>
                            <td className="acc-order-id">{order.orderNumber}</td>
                            <td>{order.date}</td>
                            <td>
                              {order.items}{" "}
                              {order.items === 1 ? "item" : "items"}
                            </td>
                            <td>
                              <span
                                className="acc-status"
                                style={{ color: order.statusColor }}
                              >
                                <span
                                  className="acc-status-dot"
                                  style={{ background: order.statusColor }}
                                />
                                {order.statusLabel}
                              </span>
                            </td>
                            <td className="acc-order-total">{order.total}</td>
                            <td className="acc-order-chevron">
                              <Chevron />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <section className="acc-saved" aria-label="Saved items">
                <div className="acc-section-header" style={{ marginBottom: 16 }}>
                  <p className="acc-section-title">SAVED ITEMS</p>
                  <Link href="/collection" className="acc-action-link">
                    VIEW ALL
                  </Link>
                </div>
                {data.savedItems.length === 0 ? (
                  <p className="acc-empty">
                    No saved items yet.{" "}
                    <Link href="/collection" className="acc-inline-link">
                      Browse the collection
                    </Link>
                  </p>
                ) : (
                  <div className="acc-saved-grid">
                    {data.savedItems.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/collection/${item.slug}`}
                        className="acc-saved-card"
                      >
                        <div className="acc-saved-img him-card-media">
                          <Image
                            src={toCardImage(item.image)}
                            alt={item.name}
                            fill
                            quality={75}
                            sizes="(max-width: 768px) 50vw, 28vw"
                            className="object-cover object-top"
                            style={{ objectFit: "cover", objectPosition: "top center" }}
                          />
                        </div>
                        <p className="acc-saved-name">{item.name}</p>
                        <p className="acc-saved-price">{item.price}</p>
                        {item.swatches.length > 0 && (
                          <div className="acc-saved-swatches">
                            {item.swatches.map((c, i) => (
                              <span
                                key={`${item.slug}-${c}-${i}`}
                                style={{ background: c }}
                              />
                            ))}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        .acc-page {
          background: ${BG};
          min-height: 100vh;
          color: ${INK};
        }

        .acc-banner {
          position: relative;
          overflow: hidden;
          background: #000;
        }
        /* % position shifts crop into the photo; px offsets leave a black gap */
        .acc-banner.him-hero-media > img,
        .acc-banner.him-hero-media img {
          object-position: center 20% !important;
          transform-origin: center center;
        }

        .acc-hero {
          position: relative;
          z-index: 1;
          height: clamp(240px, 34vw, 420px);
          overflow: hidden;
        }
        .acc-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.12) 0%,
            rgba(0, 0, 0, 0.28) 55%,
            rgba(0, 0, 0, 0.4) 100%
          );
          pointer-events: none;
        }
        .acc-hero-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: clamp(28px, 5vw, 56px) ${GUTTER};
          max-width: calc(${CONTENT_MAX} + ${GUTTER} * 2);
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        .acc-hero-title {
          margin: 0;
          font-family: ${SERIF};
          font-size: clamp(40px, 7.2vw, 88px);
          font-weight: 400;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: ${INK};
          line-height: 0.92;
        }
        .acc-hero-sub {
          margin: 14px 0 0;
          font-family: ${SANS};
          font-size: clamp(9px, 0.85vw, 11px);
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: ${MUTED_SOFT};
          line-height: 1.55;
        }

        .acc-welcome {
          position: relative;
          z-index: 1;
          overflow: hidden;
          border-top: 1px solid ${BORDER};
          border-bottom: 1px solid ${BORDER};
          min-height: clamp(140px, 18vw, 200px);
        }
        .acc-welcome-dim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.45) 0%,
            rgba(0, 0, 0, 0.62) 45%,
            rgba(0, 0, 0, 0.82) 100%
          );
          pointer-events: none;
        }
        .acc-welcome-inner {
          position: relative;
          z-index: 1;
          padding: clamp(28px, 4vw, 44px) ${GUTTER};
          max-width: calc(${CONTENT_MAX} + ${GUTTER} * 2);
          margin: 0 auto;
          box-sizing: border-box;
        }
        .acc-welcome-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .acc-welcome-label {
          margin: 0;
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: ${MUTED};
        }
        .acc-signout {
          background: none;
          border: none;
          padding: 0;
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: ${MUTED_SOFT};
          border-bottom: 1px solid ${MUTED_SOFT};
          cursor: pointer;
        }
        .acc-signout:hover {
          color: ${INK};
          border-bottom-color: ${INK};
        }
        .acc-welcome-name {
          margin: 0 0 10px;
          font-family: ${SERIF};
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 400;
          color: ${INK};
          letter-spacing: 0.01em;
          line-height: 1;
        }
        .acc-welcome-tagline {
          margin: 0;
          font-family: ${SANS};
          font-size: clamp(11px, 1vw, 13px);
          color: ${MUTED_SOFT};
          line-height: 1.55;
          white-space: pre-line;
          max-width: 340px;
        }

        .acc-body {
          max-width: ${CONTENT_MAX};
          margin: 0 auto;
          padding: clamp(28px, 4vw, 48px) ${GUTTER} clamp(56px, 8vw, 96px);
          display: flex;
          flex-direction: column;
          gap: clamp(16px, 2vw, 22px);
          box-sizing: border-box;
        }

        .acc-card {
          border: 1px solid ${BORDER};
          padding: clamp(18px, 2.2vw, 28px) clamp(18px, 2.4vw, 28px);
          background: transparent;
        }

        .acc-section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 18px;
          gap: 12px;
        }
        .acc-section-title {
          margin: 0;
          font-family: ${SANS};
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: ${INK};
        }
        .acc-action-link {
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: ${MUTED_SOFT};
          text-decoration: none;
          border-bottom: 1px solid ${MUTED_SOFT};
          padding-bottom: 1px;
          flex-shrink: 0;
          background: none;
          border-top: none;
          border-left: none;
          border-right: none;
          cursor: pointer;
        }
        .acc-action-link:hover {
          color: ${INK};
          border-bottom-color: ${INK};
        }

        .acc-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(14px, 1.8vw, 20px);
        }

        .acc-details-table {
          width: 100%;
          border-collapse: collapse;
        }
        .acc-details-table tr {
          border-bottom: 1px solid ${RULE};
        }
        .acc-details-table tr:last-child {
          border-bottom: none;
        }
        .acc-detail-label {
          padding: 12px 12px 12px 0;
          font-family: ${SANS};
          font-size: 11px;
          color: ${MUTED};
          width: 42%;
          vertical-align: top;
        }
        .acc-detail-value {
          padding: 12px 0;
          font-family: ${SANS};
          font-size: 12px;
          color: ${INK};
          font-weight: 400;
          text-align: right;
        }

        .acc-address-list {
          max-height: 26.5rem;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding-right: 4px;
          scrollbar-width: thin;
          scrollbar-color: ${RULE} transparent;
        }
        .acc-form + .acc-address-list {
          margin-top: 16px;
        }
        .acc-address-list::-webkit-scrollbar {
          width: 4px;
        }
        .acc-address-list::-webkit-scrollbar-thumb {
          background: ${RULE};
        }
        .acc-address-box {
          border: 1px solid ${RULE};
          padding: 16px 18px;
          background: rgba(255, 255, 255, 0.03);
        }
        .acc-address-box + .acc-address-box {
          margin-top: 12px;
        }
        .acc-address-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .acc-address-label {
          margin: 0;
          font-family: ${SANS};
          font-size: 8px;
          letter-spacing: 1.2px;
          color: ${MUTED};
          text-transform: uppercase;
        }
        .acc-address-badge {
          font-family: ${SANS};
          font-size: 8px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: ${GOLD};
          border: 1px solid ${GOLD};
          padding: 3px 8px;
        }
        .acc-address-line {
          margin: 0 0 2px;
          font-family: ${SANS};
          font-size: 12px;
          color: ${INK};
          line-height: 1.65;
        }
        .acc-address-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 16px;
          margin-top: 14px;
        }
        .acc-address-action {
          border: none;
          background: transparent;
          padding: 0;
          font-family: ${SANS};
          font-size: 9px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: ${MUTED_SOFT};
          cursor: pointer;
          border-bottom: 1px solid transparent;
        }
        .acc-address-action:hover:not(:disabled) {
          color: ${INK};
          border-bottom-color: ${INK};
        }
        .acc-address-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .acc-check {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: ${SANS};
          font-size: 11px;
          color: ${MUTED_SOFT};
          cursor: pointer;
          user-select: none;
        }
        .acc-check input {
          width: 14px;
          height: 14px;
          accent-color: ${GOLD};
        }

        .acc-empty {
          margin: 0;
          font-family: ${SANS};
          font-size: 12px;
          color: ${MUTED_SOFT};
          line-height: 1.5;
        }
        .acc-error {
          margin: 0;
          font-family: ${SANS};
          font-size: 12px;
          color: #e08a8a;
        }
        .acc-inline-link {
          color: ${INK};
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .acc-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .acc-form label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-family: ${SANS};
          font-size: 10px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: ${MUTED};
        }
        .acc-form input {
          background: transparent;
          border: 1px solid ${BORDER};
          color: ${INK};
          font-family: ${SANS};
          font-size: 13px;
          padding: 10px 12px;
          text-transform: none;
          letter-spacing: 0;
        }
        .acc-form input:disabled {
          opacity: 0.45;
        }
        .acc-save {
          margin-top: 4px;
          border: none;
          font-family: ${SANS};
          font-size: 11px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          padding: 12px 16px;
          cursor: pointer;
          align-self: flex-start;
        }
        .acc-save:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .acc-orders-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .acc-orders-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 560px;
        }
        .acc-orders-table th {
          padding: 0 12px 12px 0;
          font-family: ${SANS};
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: ${MUTED};
          text-align: left;
          border-bottom: 1px solid ${RULE};
          white-space: nowrap;
        }
        .acc-orders-table th:last-child {
          padding-right: 0;
          width: 20px;
        }
        .acc-orders-table td {
          padding: 16px 12px 16px 0;
          font-family: ${SANS};
          font-size: 12px;
          color: ${MUTED_SOFT};
          border-bottom: 1px solid ${RULE};
          white-space: nowrap;
          vertical-align: middle;
        }
        .acc-orders-table tr:last-child td {
          border-bottom: none;
        }
        .acc-order-id {
          color: ${INK} !important;
          font-weight: 500;
        }
        .acc-order-total {
          color: ${INK} !important;
          font-weight: 500;
        }
        .acc-order-chevron {
          padding-right: 0 !important;
          text-align: right;
          color: ${INK};
        }
        .acc-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: ${SANS};
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.2px;
        }
        .acc-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .acc-saved {
          margin-top: 8px;
        }
        .acc-saved-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px, 1.8vw, 20px);
        }
        .acc-saved-card {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        .acc-saved-img {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #1a1a1a;
        }
        .acc-saved-name {
          margin: 12px 0 4px;
          font-family: ${SANS};
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          color: ${INK};
          text-transform: uppercase;
        }
        .acc-saved-price {
          margin: 0 0 8px;
          font-family: ${SANS};
          font-size: 12px;
          color: ${MUTED_SOFT};
        }
        .acc-saved-swatches {
          display: flex;
          gap: 5px;
        }
        .acc-saved-swatches span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.25);
          display: inline-block;
          flex: 0 0 auto;
        }

        @media (max-width: 767px) {
          .acc-two-col {
            grid-template-columns: 1fr;
          }
          .acc-saved-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .acc-hero {
            height: clamp(220px, 55vw, 320px);
          }
          .acc-welcome-name {
            font-size: clamp(32px, 10vw, 48px);
          }
        }

        @media (max-width: 420px) {
          .acc-saved-grid {
            gap: 12px;
          }
          .acc-card {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
}
