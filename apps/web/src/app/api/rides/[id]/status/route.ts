import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Allowed status transitions (simple + safe)
const allowedNext: Record<string, string[]> = {
  REQUESTED: ["ACCEPTED"], // normally via /accept, but keep for completeness
  ACCEPTED: ["ARRIVING", "CANCELLED"],
  ARRIVING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await req.json().catch(() => ({}))) as { status?: string };
    const nextStatus = body.status;

    if (!nextStatus) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const ride = await prisma.ride.findUnique({ where: { id: params.id } });
    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    const ok = (allowedNext[ride.status] || []).includes(nextStatus);
    if (!ok) {
      return NextResponse.json(
        { error: `Invalid transition: ${ride.status} -> ${nextStatus}` },
        { status: 409 }
      );
    }

    const updated = await prisma.ride.update({
      where: { id: params.id },
      data: { status: nextStatus },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/rides/[id]/status crashed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
