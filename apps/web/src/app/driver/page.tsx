"use client";

import { useEffect, useMemo, useState } from "react";
import type { Ride, RideStatus } from "@/lib/api";
import { getRides, acceptRide, setRideStatus, type RideStatus } from "@/lib/api";


/* ---------------- helpers ---------------- */

function formatMoney(n: number) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₦${Math.round(n)}`;
  }
}

function statusLabel(s: RideStatus) {
  switch (s) {
    case "REQUESTED":
      return "Requested";
    case "ACCEPTED":
      return "Accepted";
    case "ARRIVING":
      return "Arriving";
    case "IN_PROGRESS":
      return "In Trip";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return s;
  }
}

function statusPillClass(s: RideStatus) {
  switch (s) {
    case "REQUESTED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "ARRIVING":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "COMPLETED":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

/* ---------------- page ---------------- */

export default function DriverPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    try {
      setErr(null);
      const data = await getRides();
      setRides(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load rides");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, []);

  /* -------- derived lists -------- */

  const requested = useMemo(
    () => rides.filter((r) => r.status === "REQUESTED"),
    [rides]
  );

  const active = useMemo(
    () =>
      rides.filter((r) =>
        ["ACCEPTED", "ARRIVING", "IN_PROGRESS"].includes(r.status)
      ),
    [rides]
  );

  const recent = useMemo(
    () => rides.filter((r) => ["COMPLETED", "CANCELLED"].includes(r.status)),
    [rides]
  );

  /* -------- atomic accept -------- */

  async function acceptRideHandler(id: string) {
    try {
      setBusyId(id);
      setErr(null);

      // ATOMIC: server guarantees only one driver can accept
      await acceptRide(id, "TOP DRIVE Driver");

      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to accept ride");
    } finally {
      setBusyId(null);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(37,99,235,0.10), transparent 60%), radial-gradient(900px 500px at 80% 10%, rgba(59,130,246,0.10), transparent 55%), #ffffff",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 56px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 999,
                background: "rgba(37,99,235,0.08)",
                border: "1px solid rgba(37,99,235,0.18)",
                color: "#1d4ed8",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "#2563eb",
                  display: "inline-block",
                }}
              />
              Ijebu-Ode • Driver Console
            </div>

            <h1 style={{ margin: "10px 0 6px", fontSize: 28 }}>
              TOP DRIVE — Driver Dashboard
            </h1>
            <p style={{ margin: 0, color: "#475569", maxWidth: 720 }}>
              Accept rides safely. Updates are live and atomic.
            </p>
          </div>

          <button
            onClick={refresh}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(2,6,23,0.10)",
              background: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        {/* Error */}
        {err && (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(244,63,94,0.30)",
              background: "rgba(244,63,94,0.06)",
              color: "#9f1239",
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            {err}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ padding: 18 }}>Loading rides…</div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            <Section title="New Requests" subtitle="Waiting for a driver">
              {requested.map((r) => (
                <RideCard
                  key={r.id}
                  ride={r}
                  primaryAction={{
                    label: busyId === r.id ? "Accepting…" : "Accept Ride",
                    onClick: () => acceptRideHandler(r.id),
                    disabled: busyId !== null,
                  }}
                />
              ))}
            </Section>

            <Section title="Active" subtitle="Accepted or in progress">
              {active.map((r) => (
                <RideCard key={r.id} ride={r} />
              ))}
            </Section>

            <Section title="Recent" subtitle="Completed or cancelled">
              {recent.map((r) => (
                <RideCard key={r.id} ride={r} />
              ))}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- components ---------------- */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 20,
        border: "1px solid rgba(2,6,23,0.08)",
        background: "#fff",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
        <div style={{ color: "#64748b", fontSize: 13 }}>{subtitle}</div>
      </div>

      {isEmpty ? (
        <div style={{ color: "#64748b", fontWeight: 600 }}>
          No rides here yet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>{children}</div>
      )}
    </div>
  );
}

function RideCard({
  ride,
  primaryAction,
}: {
  ride: Ride;
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 18,
        border: "1px solid rgba(2,6,23,0.08)",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>
          {ride.pickup} → {ride.destination}
        </strong>
        <span
          className={statusPillClass(ride.status)}
          style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid" }}
        >
          {statusLabel(ride.status)}
        </span>
      </div>

      <div style={{ marginTop: 6, color: "#475569" }}>
        Estimate: {formatMoney(ride.estimate)}
        {ride.driverName ? ` • Driver: ${ride.driverName}` : ""}
      </div>

      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          style={{
            marginTop: 10,
            padding: "10px 14px",
            borderRadius: 14,
            background: primaryAction.disabled ? "#cbd5f5" : "#2563eb",
            color: "#fff",
            fontWeight: 900,
            cursor: primaryAction.disabled ? "not-allowed" : "pointer",
          }}
        >
          {primaryAction.label}
        </button>
      )}
    </div>
  );
}
