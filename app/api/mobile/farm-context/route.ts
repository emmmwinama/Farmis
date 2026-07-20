import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession, signMobileToken } from "@/lib/mobileAuth";
import { getAllAccessibleFarms } from "@/lib/farmContext";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const farms = await getAllAccessibleFarms(session.userId);
  return NextResponse.json({ farms, activeFarmId: session.farmId });
}

export async function POST(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { farmId } = await req.json();
  const ownsFarm = await prisma.farm.findFirst({ where: { id: farmId, userId: session.userId } });
  const isMember = await prisma.teamMember.findFirst({ where: { farmId, userId: session.userId, status: "active" } });

  if (!ownsFarm && !isMember) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const token = signMobileToken({
    ...session,
    farmId,
    role: ownsFarm ? "owner" : isMember?.role ?? session.role,
  });

  return NextResponse.json({ token, activeFarmId: farmId });
}
