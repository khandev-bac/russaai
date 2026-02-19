import { cookies, headers } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getAuthenticatedUser() {
    // 1. Check Custom JWT (via Cookie or Header)
    try {
        const headerStack = await headers();
        const authHeader = headerStack.get('authorization');
        const cookieStore = await cookies();
        let accessToken = cookieStore.get('accessToken')?.value;

        if (!accessToken && authHeader?.startsWith('Bearer ')) {
            accessToken = authHeader.split(' ')[1];
        }

        if (accessToken) {
            const decoded = verifyAccessToken(accessToken);
            if (decoded) {
                const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
                if (user) {
                    return user;
                }
            }
        }
    } catch (err) {
        // Silent fail for JWT
    }

    return null;
}
