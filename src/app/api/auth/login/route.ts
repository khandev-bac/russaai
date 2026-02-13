import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { setAuthCookies } from '@/lib/cookies';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = loginSchema.parse(body);

        console.log('Login attempt for:', email);

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        console.log('User found:', !!user);

        if (!user || !user.passwordHash) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        console.log('Password valid:', validPassword);

        if (!validPassword) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        console.log('Generating tokens...');
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        console.log('Tokens generated:', !!accessToken, !!refreshToken);

        const response = NextResponse.json({
            accessToken,
            user: { id: user.id, email: user.email, name: user.name, credits: user.credits }
        }, { status: 200 });

        setAuthCookies(response, accessToken, refreshToken);

        return response;

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', errors: error.issues }, { status: 400 });
        }
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
