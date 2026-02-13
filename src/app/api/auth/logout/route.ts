import { clearAuthCookies } from '@/lib/cookies';
import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ message: 'Logged out successfully' });
    clearAuthCookies(response);
    return response;
}
