import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
    process.env.ADMIN_SECRET ?? "farmio-admin-secret-change-in-prod"
);

export async function signAdminToken(adminId: string) {
    return new SignJWT({ adminId })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("8h")
        .sign(SECRET);
}

export async function verifyAdminToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload as { adminId: string };
    } catch {
        return null;
    }
}

export async function getAdminSession() {
    const cookieStore = cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return null;
    const payload = await verifyAdminToken(token);
    if (!payload) return null;
    return prisma.adminUser.findUnique({ where: { id: payload.adminId } });
}