'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuth } from './AuthContext';

interface Conversation {
    id: number;
    title: string;
    lastMessage: string;
    folderId: number | null;
    updatedAt: string;
}

interface Folder {
    id: number;
    name: string;
    createdAt: string;
}

interface ChatContextType {
    conversations: Conversation[];
    folders: Folder[];
    loading: boolean;
    refreshConversations: () => Promise<void>;
    refreshFolders: () => Promise<void>;
    createFolder: (name: string) => Promise<void>;
    deleteFolder: (id: number) => Promise<void>;
    renameFolder: (id: number, name: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshConversations = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.get('/chat/conversations');
            setConversations(res.data.conversations || []);
        } catch (error) {
            console.error('Failed to fetch conversations', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const refreshFolders = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get('/folders');
            setFolders(res.data.folders || []);
        } catch (error) {
            console.error('Failed to fetch folders', error);
        }
    }, [user]);

    const createFolder = async (name: string) => {
        await api.post('/folders', { name });
        await refreshFolders();
    };

    const deleteFolder = async (id: number) => {
        await api.delete(`/folders/${id}`);
        await refreshFolders();
        await refreshConversations(); // Conversations might have moved back to "Uncategorized"
    };

    const renameFolder = async (id: number, name: string) => {
        await api.patch(`/folders/${id}`, { name });
        await refreshFolders();
    };

    useEffect(() => {
        if (user) {
            refreshConversations();
            refreshFolders();
        } else {
            setConversations([]);
            setFolders([]);
        }
    }, [user, refreshConversations, refreshFolders]);

    return (
        <ChatContext.Provider value={{
            conversations,
            folders,
            loading,
            refreshConversations,
            refreshFolders,
            createFolder,
            deleteFolder,
            renameFolder
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within a ChatProvider');
    return context;
};
