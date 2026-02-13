'use client';

import React from 'react';
import ChatWindow from '@/components/ChatWindow';

interface ChatIdPageProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function ChatIdPage({ sidebarOpen, setSidebarOpen }: ChatIdPageProps) {
    return <ChatWindow sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
}
