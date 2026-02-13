'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useSession, signOut as googleSignOut } from 'next-auth/react';

interface User {
    id: number;
    email: string;
    name?: string;
    credits: number;
    plan: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    signup: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { data: session, status } = useSession();

    const refreshUser = useCallback(async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // If Google session exists, we trust it (or we could sync with /auth/me)
        if (status === 'authenticated' && session?.user) {
            // Mapping Google session to our internal User type if needed
            // For now, let's just attempt to get internal data from /auth/me
            // which handles the sync via the signIn callback in auth.ts
            refreshUser();
        } else if (status === 'unauthenticated') {
            // Check for traditional session
            refreshUser();
        } else if (status === 'loading') {
            setLoading(true);
        }
    }, [status, session, refreshUser]);

    const login = async (credentials: any) => {
        const res = await api.post('/auth/login', credentials);
        setUser(res.data.user);
    };

    const signup = async (credentials: any) => {
        const res = await api.post('/auth/signup', credentials);
        setUser(res.data.user);
    };

    const logout = async () => {
        if (session) {
            await googleSignOut({ redirect: false });
        }
        await api.post('/auth/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
