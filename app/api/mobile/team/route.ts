import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";
import { getDefaultPermissions, ROLES, Role } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "team");
  if (access.error) return access.error;

  const [members, employees] = await Promise.all([
    prisma.teamMember.findMany({
      where: { farmId: access.session.farmId! },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.employee.findMany({ where: { farmId: access.session.farmId! }, orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({
    members,
    employees,
    roles: Object.keys(ROLES),
    permissionKeys: ["fields", "crops", "activities", "finance", "employees", "yields", "reports", "team"],
    workflow: { nativeInviteEditor: true, employeeFallbackIncluded: true },
  });
}

export async function POST(req: NextRequest) {
  const access = await requireMobilePermission(req, "team");
  if (access.error) return access.error;

  const body = await req.json();
  if (!body.email) return NextResponse.json({ error: "Invite email is required" }, { status: 400 });
  const role = (body.role || "viewer") as Role;
  if (!(role in ROLES)) return NextResponse.json({ error: "Unsupported role" }, { status: 400 });
  const token = crypto.randomBytes(24).toString("hex");
  const user = await prisma.user.findUnique({ where: { email: String(body.email).toLowerCase().trim() } });
  if (!user) return NextResponse.json({ error: "No AgriVault account found with that email address." }, { status: 404 });

  const existing = await prisma.teamMember.findFirst({
    where: { farmId: access.session.farmId!, userId: user.id },
  });
  if (existing) return NextResponse.json({ error: "This user is already a team member." }, { status: 400 });

  const member = await prisma.teamMember.create({
    data: {
      farmId: access.session.farmId!,
      userId: user.id,
      inviteEmail: String(body.email).toLowerCase().trim(),
      inviteToken: token,
      invitedBy: access.session.userId,
      role,
      permissions: body.permissions ?? getDefaultPermissions(role),
      status: "invited",
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  return NextResponse.json({ member, inviteToken: token, inviteLink: baseUrl ? `${baseUrl}/invite?token=${token}` : null }, { status: 201 });
}
