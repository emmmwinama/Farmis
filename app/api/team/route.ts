import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkFeature } from "@/lib/subscription";
import { getDefaultPermissions, Role } from "@/lib/permissions";
import crypto from "crypto";

async function getFarm(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { farms: true },
    });
    return { user, farm: user?.farms[0] ?? null };
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { farm } = await getFarm(session.user.email);
    if (!farm) return NextResponse.json({ error: "No farm" }, { status: 404 });

    const members = await prisma.teamMember.findMany({
        where: { farmId: farm.id },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        permissions: m.permissions,
        status: m.status,
        createdAt: m.createdAt,
    })));
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { user, farm } = await getFarm(session.user.email);
    if (!farm || !user) return NextResponse.json({ error: "No farm" }, { status: 404 });

    try {
        await checkFeature(user.id, "teamAccounts");
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
        return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Check tier team member limit
    const sub = await prisma.subscription.findUnique({
        where: { userId: user.id },
        include: { tier: true },
    });
    const currentCount = await prisma.teamMember.count({ where: { farmId: farm.id } });
    if (sub && sub.tier.maxTeamMembers !== -1 && currentCount >= sub.tier.maxTeamMembers) {
        return NextResponse.json({
            error: `Your plan allows a maximum of ${sub.tier.maxTeamMembers} team members.`,
        }, { status: 403 });
    }

    const invitedUser = await prisma.user.findUnique({ where: { email } });
    if (!invitedUser) {
        return NextResponse.json({ error: "No Farmio account found with that email address." }, { status: 404 });
    }

    const existing = await prisma.teamMember.findFirst({
        where: { farmId: farm.id, userId: invitedUser.id },
    });
    if (existing) {
        return NextResponse.json({ error: "This user is already a team member." }, { status: 400 });
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const permissions = getDefaultPermissions(role as Role);

    const member = await prisma.teamMember.create({
        data: {
            farmId: farm.id,
            userId: invitedUser.id,
            role,
            permissions,
            status: "invited",
            inviteEmail: email,
            inviteToken,
            invitedBy: user.id,
        },
    });

    const inviteLink = `${process.env.NEXTAUTH_URL}/invite?token=${inviteToken}`;

    return NextResponse.json({ success: true, memberId: member.id, inviteLink }, { status: 201 });
}