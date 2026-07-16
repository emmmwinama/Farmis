import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";
import { checkLimit } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.employee.findMany({
    where: { farmId: session.farmId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const session = getMobileSession(req);
  if (!session?.farmId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await checkLimit(session.userId, "Employees");
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }

  const body = await req.json();
  const { name, role, payRate, payRateUnit, phone } = body;

  if (!name || !role || !payRate || !payRateUnit) {
    return NextResponse.json(
      { error: "Name, role, pay rate and pay rate unit are required" },
      { status: 400 }
    );
  }

  const employee = await prisma.employee.create({
    data: {
      farmId: session.farmId,
      name,
      role,
      payRate: parseFloat(payRate),
      payRateUnit,
      phone: phone ?? "",
    },
  });

  return NextResponse.json(employee, { status: 201 });
}
