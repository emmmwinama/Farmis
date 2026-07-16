import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { assertStrongSecret, getRequiredEnv } from "@/lib/env";

export type MobileSession = {
    userId: string;
    farmId: string | null;
    email: string;
    role: string;
};

function getMobileSecret() {
    const secret = getRequiredEnv("JWT_SECRET");
    assertStrongSecret("JWT_SECRET", secret);
    return secret;
}

export function signMobileToken(session: MobileSession) {
    return jwt.sign(session, getMobileSecret(), { expiresIn: "7d" });
}

export function getMobileSession(req: NextRequest): MobileSession | null {
    try {
        const auth = req.headers.get("Authorization") ?? "";
        if (!auth.startsWith("Bearer ")) return null;
        return jwt.verify(auth.slice(7), getMobileSecret()) as MobileSession;
    } catch {
        return null;
    }
}
