import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const { description, category, amount, date, recurring, notes } = body;

    const expense = await prisma.overheadExpense.update({
        where: { id },
        data: {
            description,
            category,
            amount: parseFloat(amount),
            date: new Date(date),
            recurring: recurring ?? false,
            notes: notes ?? "",
        },
    });

    return NextResponse.json(expense);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.overheadExpense.delete({ where: { id } });
    return NextResponse.json({ success: true });
}