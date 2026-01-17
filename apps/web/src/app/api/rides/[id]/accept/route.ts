import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { driverName } = (await req.json().catch(() => ({}))) as {
      driverName?: string;
    };

    if (!driverName) {
      return NextResponse.json(
        { error: "driverName is required" },
        { status: 400 }
      );
    }

    // Atomic: only update if it's still REQUESTED
    const updated = await prisma.ride.updateMany({
      where: { id, status: "REQUESTED" },
      data: { status: "ACCEPTED", driverName },
    });

    if (updated.count === 0) {
      // Distinguish NOT FOUND vs ALREADY ACCEPTED
      const exists = await prisma.ride.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!exists) {
        return NextResponse.json({ error: "Ride not found" }, { status: 404 });
      }

      return NextResponse.json(
        { error: `Ride not available (current status: ${exists.status})` },
        { status: 409 }
      );
    }

    // Return the updated ride
    const ride = await prisma.ride.findUnique({ where: { id } });
    return NextResponse.json(ride);
  } catch (e) {
    console.error("PATCH /api/rides/[id]/accept crashed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
