import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
    const accessToken = req.cookies.get('accessToken')?.value;
    const refreshToken = req.cookies.get('refreshToken')?.value;
    const isChatPage = req.nextUrl.pathname.startsWith('/chat');

    // Allow access if we have an accessToken OR a refreshToken (to allow auto-refresh)
    if (isChatPage && !accessToken && !refreshToken) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/chat/:path*", "/chat"],
};
