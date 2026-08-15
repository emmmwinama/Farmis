import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/adminToken";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/api/mobile/")) {
        return mobileCors(req);
    }

    if (pathname.startsWith("/dashboard")) {
        return withSecurityHeaders(NextResponse.next(), pathname);
    }

    if (
        pathname === "/admin/login"  ||
        pathname === "/api/admin/login" ||
        pathname === "/api/admin/logout"
    ) {
        return NextResponse.next();
    }

    const token = req.cookies.get("admin_token")?.value;
    const valid = token ? await verifyAdminToken(token) : false;

    if (!valid) {
        if (pathname.startsWith("/api/")) {
            return withSecurityHeaders(
                NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
                pathname
            );
        }
        return withSecurityHeaders(
            NextResponse.redirect(new URL("/admin/login", req.url)),
            pathname
        );
    }

    return withSecurityHeaders(NextResponse.next(), pathname);
}

function mobileCors(req: NextRequest) {
    const origin = req.headers.get("origin") ?? "";
    const allowedOrigins = new Set([
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ]);
    const allowOrigin = allowedOrigins.has(origin) ? origin : "";

    const headers = new Headers();
    if (allowOrigin) headers.set("Access-Control-Allow-Origin", allowOrigin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (req.method === "OPTIONS") {
        return withSecurityHeaders(
            new NextResponse(null, { status: 204, headers }),
            req.nextUrl.pathname
        );
    }

    const response = NextResponse.next();
    headers.forEach((value, key) => response.headers.set(key, value));
    return withSecurityHeaders(response, req.nextUrl.pathname);
}

function withSecurityHeaders(response: NextResponse, pathname: string) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=()"
    );

    if (
        pathname.startsWith("/admin") ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/api/")
    ) {
        response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    }

    if (process.env.NODE_ENV === "production") {
        response.headers.set(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload"
        );
    }

    return response;
}

export const config = {
    matcher: ["/admin/:path*", "/dashboard/:path*", "/api/admin/:path*", "/api/mobile/:path*"],
};
