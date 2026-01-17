import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = [
  "REQUESTED",
  "ACCEPTED",
  "ARRIVING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

type RideStatus = (typeof VALID_STATUSES)[number];

function isRideStatus(x: any): x is RideStatus {
  return typeof x === "string" && (VALID_STATUSES as readonly string[]).includes(x);
}

export async function GET(
  _req: NextRequest,
  context: { params: any }
) {
  const params = await Promise.resolve(context.params);
  const { id } = params as { id: string };

  const ride = await prisma.ride.findUnique({ where: { id } });
  if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });

  return NextResponse.json(ride);
}

export async function PATCH(
  req: NextRequest,
  context: { params: any }
) {
  const params = await Promise.resolve(context.params);
  const { id } = params as { id: string };

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = body?.status;
  const driverName = body?.driverName;

  if (!isRideStatus(status)) {
    return NextResponse.json(
      { error: `Invalid status. Use one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  // Optional: prevent accepting already accepted rides
  if (status === "ACCEPTED") {
    const existing = await prisma.ride.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Ride not found" }, { status: 404 });

    if (existing.status !== "REQUESTED") {
      return NextResponse.json(
        { error: `Ride already ${existing.status}. Cannot accept again.` },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.ride.update({
    where: { id },
    data: {
      status,
      driverName: typeof driverName === "string" ? driverName : undefined,
    },
  });

  return NextResponse.json(updated);
}
