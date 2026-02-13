import { getAuthenticatedUser } from "@/lib/auth-server";
import { db } from "@/db";
import { folders, conversations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const folderSchema = z.object({
    name: z.string().min(1).max(50),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const folderId = parseInt((await params).id);

    try {
        const body = await req.json();
        const { name } = folderSchema.parse(body);

        const [updatedFolder] = await db.update(folders)
            .set({ name })
            .where(and(eq(folders.id, folderId), eq(folders.userId, user.id)))
            .returning();

        if (!updatedFolder) {
            return NextResponse.json({ message: "Folder not found" }, { status: 404 });
        }

        return NextResponse.json({ folder: updatedFolder });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 });
        }
        console.error("Failed to update folder:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const folderId = parseInt((await params).id);

    try {
        // Move conversations to no folder (null)
        await db.update(conversations)
            .set({ folderId: null })
            .where(and(eq(conversations.folderId, folderId), eq(conversations.userId, user.id)));

        // Delete the folder
        const [deletedFolder] = await db.delete(folders)
            .where(and(eq(folders.id, folderId), eq(folders.userId, user.id)))
            .returning();

        if (!deletedFolder) {
            return NextResponse.json({ message: "Folder not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Folder deleted successfully" });
    } catch (error) {
        console.error("Failed to delete folder:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
