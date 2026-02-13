import { getAuthenticatedUser } from "@/lib/auth-server";
import { db } from "@/db";
import { folders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const folderSchema = z.object({
    name: z.string().min(1).max(50),
});

export async function GET() {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const list = await db.select().from(folders)
            .where(eq(folders.userId, user.id))
            .orderBy(desc(folders.createdAt));

        return NextResponse.json({ folders: list });
    } catch (error) {
        console.error("Failed to list folders:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { name } = folderSchema.parse(body);

        const [newFolder] = await db.insert(folders).values({
            name,
            userId: user.id
        }).returning();

        return NextResponse.json({ folder: newFolder }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 });
        }
        console.error("Failed to create folder:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
