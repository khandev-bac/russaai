'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatLayoutContextType {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const ChatLayoutContext = createContext<ChatLayoutContextType | undefined>(undefined);

export function ChatLayoutProvider({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <ChatLayoutContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
            {children}
        </ChatLayoutContext.Provider>
    );
}

export function useChatLayout() {
    const context = useContext(ChatLayoutContext);
    if (!context) {
        throw new Error('useChatLayout must be used within ChatLayoutProvider');
    }
    return context;
}
