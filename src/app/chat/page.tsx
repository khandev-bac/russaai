'use client';

import React from 'react';
import ChatWindow from '@/components/ChatWindow';

interface ChatPageProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function ChatPage({ sidebarOpen, setSidebarOpen }: ChatPageProps) {
    return <ChatWindow sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
}
