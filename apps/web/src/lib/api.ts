export type RideStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "ARRIVING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type Ride = {
  id: string;
  pickup: string;
  destination: string;
  city: string;
  estimate: number;
  offeredPrice?: number | null;
  status: RideStatus;
  driverName?: string | null;
  createdAt: string;
  updatedAt: string;
};

async function readJsonOrThrow(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    if (contentType.includes("text/html")) {
      throw new Error(`Request failed (${res.status}). API route not found or crashed.`);
    }
    try {
      const data = JSON.parse(text);
      throw new Error(data?.error || `Request failed (${res.status})`);
    } catch {
      throw new Error(`Request failed (${res.status})`);
    }
  }

  if (!contentType.includes("application/json")) {
    throw new Error("Server did not return JSON. Check API routes.");
  }

  return JSON.parse(text);
}

export async function createRide(data: {
  pickup: string;
  destination: string;
  city: string;
  estimate: number;
  offeredPrice?: number;
}) {
  const res = await fetch(`/api/rides`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return (await readJsonOrThrow(res)) as Ride;
}

export async function getRides() {
  const res = await fetch(`/api/rides`, { cache: "no-store" });
  return (await readJsonOrThrow(res)) as Ride[];
}

export async function getRide(id: string) {
  const res = await fetch(`/api/rides/${id}`, { cache: "no-store" });
  return (await readJsonOrThrow(res)) as Ride;
}

export async function updateRide(
  id: string,
  data: { status: RideStatus; driverName?: string }
) {
  const res = await fetch(`/api/rides/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return (await readJsonOrThrow(res)) as Ride;
}

export async function acceptRide(id: string, driverName: string) {
  const res = await fetch(`/api/rides/${id}/accept`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverName }),
  });

  return (await readJsonOrThrow(res)) as Ride;
}

export async function setRideStatus(id: string, status: RideStatus) {
  const res = await fetch(`/api/rides/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  return (await readJsonOrThrow(res)) as Ride;
}
