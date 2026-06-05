import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, email, role, isActive } = body;

        const user = await prisma.user.update({
            where: { id: params.id },
            data: {
                ...(name     !== undefined ? { name }     : {}),
                ...(email    !== undefined ? { email }    : {}),
                ...(role     !== undefined ? { role }     : {}),
                ...(isActive !== undefined ? { isActive } : {}),
            },
        });

        return NextResponse.json(user);
    } catch (err: any) {
        console.error("PATCH /api/admin/users/[id] error:", err);
        return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
    }
}

export async function DELETE(
    _: Request,
    { params }: { params: { id: string } }
) {
    try {
        const admin = await getAdminSession();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await prisma.user.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("DELETE /api/admin/users/[id] error:", err);
        return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
    }
}