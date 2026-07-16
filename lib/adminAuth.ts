import { cookies } from "next/headers";
import { createAdminToken, verifyAdminToken } from "@/lib/adminToken";

// Alias kept for any existing imports
export const signAdminToken = createAdminToken;
export { createAdminToken, verifyAdminToken };

export async function getAdminSession(): Promise<{ id: string } | null> {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get("admin_token")?.value;
        if (!token) return null;

        const adminId = await verifyAdminToken(token);
        if (!adminId) return null;

        return { id: adminId };
    } catch {
        return null;
    }
}
