import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId, farmId: session.farmId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    notifications,
    unread: notifications.filter((notification) => !notification.isRead).length,
  });
}

export async function POST(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: session.userId, farmId: session.farmId, isRead: false },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
