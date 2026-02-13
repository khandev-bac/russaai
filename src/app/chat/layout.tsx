'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ChatProvider } from '@/context/ChatContext';

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <ChatProvider>
            <div className="flex h-screen bg-background text-foreground selection:bg-primary/30 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                {React.Children.map(children, child => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child as React.ReactElement<any>, { sidebarOpen, setSidebarOpen });
                    }
                    return child;
                })}
            </div>
        </ChatProvider>
    );
}
