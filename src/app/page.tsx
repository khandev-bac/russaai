'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Paperclip, Mic, ChevronDown, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function Landing() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between p-8 font-sans overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/logo.png"
              alt="Russa AI Logo"
              width={64}
              height={64}
              className="object-contain"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Let's unlock your full potential.
            </h1>
          </div>

          <div className="text-muted-foreground text-lg mb-8">
            {user ? (
              <p>Welcome back, <span className="text-primary font-bold">{user.email.split('@')[0]}</span></p>
            ) : (
              <p>Get started with your AI companion.</p>
            )}
          </div>

          <div className="flex flex-col gap-4 items-center">
            {user ? (
              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/chat')}
                  className="bg-primary hover:opacity-90 text-primary-foreground font-bold px-10 py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                  Go to Chat
                </button>
                <button
                  onClick={() => logout()}
                  className="bg-secondary/40 hover:bg-secondary/60 text-white font-bold px-10 py-4 rounded-2xl transition-all border border-white/10"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/login')}
                  className="bg-primary hover:opacity-90 text-primary-foreground font-bold px-10 py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-3"
                >
                  Get Started
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="bg-secondary/40 hover:bg-secondary/60 text-white font-bold px-10 py-4 rounded-2xl transition-all border border-white/10 flex items-center gap-3"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Simulated Chat Bar at Bottom */}
      <div className="w-full max-w-4xl">
        <div className="relative group bg-black rounded-[2.5rem] border border-white/10 p-4 pb-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer"
          onClick={() => user ? router.push('/chat') : router.push('/login')}>
          <input
            type="text"
            readOnly
            className="w-full bg-transparent px-4 py-2 text-white text-lg focus:outline-none placeholder:text-muted-foreground/40 font-medium cursor-pointer"
            placeholder="What challenge will we conquer today?"
          />

          <div className="flex items-center justify-between mt-4 px-2">
            <div className="flex items-center gap-4">
              <Paperclip className="w-5 h-5 text-muted-foreground" />

              <div className="flex items-center gap-2 bg-secondary/40 text-primary px-4 py-2 rounded-full border border-white/5 text-sm font-bold">
                <Image
                  src="/logo.png"
                  alt=""
                  width={16}
                  height={16}
                  className="object-contain brightness-125"
                />
                <span>Friend</span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-muted-foreground" />
              <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                <Send className="w-5 h-5 fill-current" />
              </div>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-center mt-6 text-muted-foreground font-medium uppercase tracking-widest opacity-30">
          Russa AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
