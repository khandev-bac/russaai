import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { setAuthCookies } from '@/lib/cookies';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = signupSchema.parse(body);

        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser.length > 0) {
            return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [newUser] = await db.insert(users).values({
            email,
            passwordHash,
            credits: 10,
            plan: 'free',
        }).returning();

        const accessToken = generateAccessToken(newUser!.id);
        const refreshToken = generateRefreshToken(newUser!.id);

        const response = NextResponse.json({
            accessToken,
            user: { id: newUser!.id, email: newUser!.email, name: newUser!.name, credits: newUser!.credits }
        }, { status: 201 });

        setAuthCookies(response, accessToken, refreshToken);

        return response;

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.issues }, { status: 400 });
        }
        console.error('Signup Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
