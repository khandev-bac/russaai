'use client';

import React from 'react';
import ChatWindow from '@/components/ChatWindow';
import { useChatLayout } from '@/context/ChatLayoutContext';

export default function ChatPage() {
    const { sidebarOpen, setSidebarOpen } = useChatLayout();
    return <ChatWindow sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
}
