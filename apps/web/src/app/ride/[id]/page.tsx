"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getRide, type Ride, type RideStatus } from "@/lib/api";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

const steps: { key: RideStatus; label: string; hint: string }[] = [
  { key: "REQUESTED", label: "Requested", hint: "Waiting for a driver" },
  { key: "ACCEPTED", label: "Accepted", hint: "Driver assigned" },
  { key: "ARRIVING", label: "Arriving", hint: "Driver is on the way" },
  { key: "IN_PROGRESS", label: "In progress", hint: "Trip has started" },
  { key: "COMPLETED", label: "Completed", hint: "Trip finished" },
];

function statusIndex(status: RideStatus) {
  return steps.findIndex((s) => s.key === status);
}

function pill(status: RideStatus) {
  switch (status) {
    case "REQUESTED":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
    case "ACCEPTED":
      return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100";
    case "ARRIVING":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
    case "IN_PROGRESS":
      return "bg-slate-900 text-white ring-1 ring-slate-900/20";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
    default:
      return "bg-slate-50 text-slate-700 ring-1 ring-slate-100";
  }
}

function labelOf(status: RideStatus) {
  if (status === "CANCELLED") return "Cancelled";
  return status
    .split("_")
    .map((x) => x[0] + x.slice(1).toLowerCase())
    .join(" ");
}

export default function RideTrackingPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    try {
      const data = await getRide(id);
      setRide(data);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Ride not found");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [id]);

  const idx = useMemo(() => (ride ? statusIndex(ride.status) : -1), [ride]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Subtle premium background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute top-52 -left-24 h-[420px] w-[420px] rounded-full bg-indigo-200/35 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-[460px] w-[460px] rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(2,6,23,0.05)_1px,transparent_0)] [background-size:18px_18px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/75 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wider text-blue-700">
              LIVE TRACKING
            </p>
            <h1 className="text-base sm:text-lg font-extrabold truncate">
              TOP DRIVE — Ride Status
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 truncate">
              Ride ID:{" "}
              <span className="font-semibold">{id ? id.slice(0, 10) : "..."}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/request"
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              New request
            </a>
            <a
              href="/driver"
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
            >
              Driver →
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10 space-y-5">
        {err && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-800 font-semibold">
            {err}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur p-6">
            <div className="h-5 w-2/3 rounded bg-slate-100 animate-pulse" />
            <div className="mt-3 h-4 w-1/2 rounded bg-slate-100 animate-pulse" />
            <div className="mt-6 h-24 rounded bg-slate-100 animate-pulse" />
          </div>
        ) : !ride ? (
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur p-6">
            <p className="font-extrabold">Ride not found</p>
            <p className="mt-1 text-slate-600 text-sm">
              Go back and create a new request.
            </p>
          </div>
        ) : (
          <>
            {/* Ride summary */}
            <div className="rounded-3xl border border-slate-200/70 bg-white/85 backdrop-blur p-5 sm:p-7 shadow-[0_18px_55px_rgba(2,6,23,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight break-words">
                    {ride.pickup} → {ride.destination}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    City: <span className="font-semibold">{ride.city}</span>
                    {" • "}
                    Created:{" "}
                    <span className="font-semibold">
                      {new Date(ride.createdAt).toLocaleString()}
                    </span>
                  </p>
                </div>

                <span
                  className={
                    "rounded-full px-4 py-2 text-sm font-extrabold " +
                    pill(ride.status)
                  }
                >
                  {labelOf(ride.status)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
                  Estimate: {formatMoney(ride.estimate)}
                </span>

                {typeof ride.offeredPrice === "number" ? (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
                    Offer: {formatMoney(ride.offeredPrice)}
                  </span>
                ) : null}

                {ride.driverName ? (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-100">
                    Driver: {ride.driverName}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
                    No driver yet
                  </span>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-3xl border border-slate-200/70 bg-white/85 backdrop-blur p-5 sm:p-7 shadow-[0_18px_55px_rgba(2,6,23,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold">Trip progress</h3>
                  <p className="text-sm text-slate-600">
                    This updates automatically (every 2 seconds).
                  </p>
                </div>
                <div className="text-xs text-slate-500 font-semibold">
                  Updated: {new Date(ride.updatedAt).toLocaleTimeString()}
                </div>
              </div>

              {ride.status === "CANCELLED" ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 font-semibold">
                  This trip was cancelled.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {steps.map((s, i) => {
                    const done = idx >= i;
                    const activeStep = idx === i;
                    return (
                      <div key={s.key} className="flex items-start gap-3">
                        <div className="pt-0.5">
                          <div
                            className={
                              "h-7 w-7 rounded-full grid place-items-center text-xs font-extrabold " +
                              (done
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500")
                            }
                          >
                            {i + 1}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={
                                "font-extrabold " +
                                (activeStep ? "text-slate-900" : "text-slate-700")
                              }
                            >
                              {s.label}
                            </p>
                            {activeStep ? (
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                                Current
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-slate-600">{s.hint}</p>
                        </div>

                        <div className="pt-1">
                          {done ? (
                            <span className="text-xs font-bold text-emerald-700">
                              Done
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-extrabold">Tip</p>
                <p className="mt-1 text-slate-600">
                  Open the driver dashboard in another tab and accept this ride to see the status
                  move from <span className="font-semibold">Requested</span> →{" "}
                  <span className="font-semibold">Accepted</span>.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
