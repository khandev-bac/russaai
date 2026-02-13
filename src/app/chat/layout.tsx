'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { ChatProvider } from '@/context/ChatContext';
import { ChatLayoutProvider, useChatLayout } from '@/context/ChatLayoutContext';

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
    const { sidebarOpen, setSidebarOpen } = useChatLayout();

    return (
        <ChatProvider>
            <div className="flex h-screen bg-background text-foreground selection:bg-primary/30 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                {children}
            </div>
        </ChatProvider>
    );
}

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ChatLayoutProvider>
            <ChatLayoutContent>{children}</ChatLayoutContent>
        </ChatLayoutProvider>
    );
}
