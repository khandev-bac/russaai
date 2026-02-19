'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import api from '@/lib/axios';
import {
    Plus,
    X,
    LayoutPanelLeft,
    HandMetal,
    Wallet,
    MoreVertical,
    Trash2,
    Edit2,
    FolderPlus,
    Folder as FolderIcon,
    ChevronRight,
    ChevronDown,
    ArrowRightLeft,
    LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { user, refreshUser, logout } = useAuth();
    const {
        conversations,
        folders,
        refreshConversations,
        createFolder,
        deleteFolder,
        renameFolder
    } = useChat();
    const params = useParams();
    const id = params?.id;
    const router = useRouter();

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [targetDeleteId, setTargetDeleteId] = useState<number | null>(null);

    // Folder states
    const [expandedFolders, setExpandedFolders] = useState<Record<number, boolean>>({});
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
    const [editFolderName, setEditFolderName] = useState('');
    const [showFolderMenuId, setShowFolderMenuId] = useState<number | null>(null);
    const [hoveredFolderId, setHoveredFolderId] = useState<number | null>(null);
    const [isDraggingOverUncategorized, setIsDraggingOverUncategorized] = useState(false);

    const toggleFolder = (folderId: number) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        try {
            await createFolder(newFolderName);
            setNewFolderName('');
            setIsCreatingFolder(false);
        } catch (error) {
            console.error('Failed to create folder', error);
        }
    };

    const handleRenameFolder = async (e: React.FormEvent, folderId: number) => {
        e.preventDefault();
        if (!editFolderName.trim()) return;
        try {
            await renameFolder(folderId, editFolderName);
            setEditingFolderId(null);
        } catch (error) {
            console.error('Failed to rename folder', error);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, conversationId: number) => {
        e.preventDefault();
        e.stopPropagation();
        setTargetDeleteId(conversationId);
        setShowDeleteConfirm(true);
        setMenuOpenId(null);
    };

    const confirmDelete = async () => {
        if (!targetDeleteId) return;

        try {
            await api.delete(`/chat/conversations/${targetDeleteId}`);
            await refreshConversations();
            if (Number(id) === targetDeleteId) {
                router.push('/chat');
            }
            setShowDeleteConfirm(false);
            setTargetDeleteId(null);
        } catch (error) {
            console.error('Failed to delete conversation', error);
        }
    };

    const handleRename = async (e: React.FormEvent, conversationId: number) => {
        e.preventDefault();
        if (!editTitle.trim()) return;

        try {
            await api.patch(`/chat/conversations/${conversationId}`, { title: editTitle });
            await refreshConversations();
            setEditingId(null);
        } catch (error) {
            console.error('Failed to rename conversation', error);
        }
    };
    const handleMoveToFolder = async (convId: number, folderId: number | null) => {
        try {
            await api.patch(`/chat/conversations/${convId}`, { folderId });
            await refreshConversations();
            setMenuOpenId(null);
        } catch (error) {
            console.error('Failed to move conversation', error);
        }
    };

    const renderConversationItem = (conv: any, idx: number) => (
        <motion.div
            key={conv.id}
            layout
            draggable
            onDragStart={(e: any) => {
                const data = JSON.stringify({ convId: conv.id });
                e.dataTransfer.setData('application/json', data);
                e.dataTransfer.effectAllowed = 'move';
            }}
            className="relative group cursor-grab active:cursor-grabbing"
        >
            {editingId === conv.id ? (
                <form
                    onSubmit={(e) => handleRename(e, conv.id)}
                    className="px-3 py-2 bg-white/5 rounded-xl border border-primary/30"
                >
                    <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => setEditingId(null)}
                        className="w-full bg-transparent text-sm text-white focus:outline-none"
                    />
                </form>
            ) : (
                <Link
                    href={`/chat/${conv.id}`}
                    className={`flex items-start gap-3 px-3 py-2 rounded-xl transition-all ${Number(id) === conv.id
                        ? 'bg-primary text-black'
                        : 'hover:bg-white/5 text-white'
                        }`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${Number(id) === conv.id ? 'bg-black/20 border-black/10' : 'bg-white/10 border-white/5'}`}>
                        {idx % 2 === 0 ? <Wallet className={`w-4 h-4 ${Number(id) === conv.id ? 'text-black' : 'text-green-400'}`} /> : <HandMetal className={`w-4 h-4 ${Number(id) === conv.id ? 'text-black' : 'text-orange-400'}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-semibold truncate ${Number(id) === conv.id ? 'text-black' : 'text-white'}`}>{conv.title || 'New Conversation'}</span>
                            <span className={`text-[10px] whitespace-nowrap ${Number(id) === conv.id ? 'text-black/60' : 'text-white/30'}`}>Wednesday</span>
                        </div>
                        <p className={`text-[11px] truncate mt-0.5 ${Number(id) === conv.id ? 'text-black/60' : 'text-white/40'}`}>
                            {conv.lastMessage || (idx % 2 === 0 ? 'Help me create a simple budg' : 'I\'m feeling overwhelmed, help')}
                        </p>
                    </div>

                    {/* More Options Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                        }}
                        className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${Number(id) === conv.id ? 'hover:bg-black/10 text-black/40 hover:text-black' : 'hover:bg-white/10 text-white/40 hover:text-white'}`}
                    >
                        < MoreVertical className="w-4 h-4" />
                    </button>
                </Link>
            )}

            {/* Dropdown Menu */}
            {menuOpenId === conv.id && (
                <div className="absolute top-10 right-0 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 p-1 overflow-visible">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(conv.id);
                            setEditTitle(conv.title);
                            setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        Rename
                    </button>

                    {/* Move to Folder Submenu */}
                    <div className="border-t border-white/5 my-1 pt-1">
                        <p className="px-3 py-1 text-[10px] text-white/30 font-bold uppercase">Move to Folder</p>
                        {folders.map(f => (
                            <button
                                key={f.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToFolder(conv.id, f.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <ArrowRightLeft className="w-3 h-3" />
                                {f.name}
                            </button>
                        ))}
                        {conv.folderId && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToFolder(conv.id, null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X className="w-3 h-3" />
                                Uncategorized
                            </button>
                        )}
                    </div>

                    <button
                        onClick={(e) => handleDeleteClick(e, conv.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors border-t border-white/5"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                    </button>
                </div>
            )}
        </motion.div>
    );

    return (
        <motion.aside
            initial={false}
            animate={{ width: isOpen ? 256 : 0, opacity: isOpen ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-screen bg-black/50 backdrop-blur-3xl border-r border-white/5 flex flex-col shrink-0 overflow-hidden relative"
        >
            {/* Header Icons */}
            <div className="p-4 flex items-center justify-between opacity-80 min-w-[256px]">
                <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Russa AI" width={24} height={24} className="object-contain" />
                    <span className="text-sm font-bold text-white tracking-tight">Russa AI</span>
                </div>
                <div className="flex items-center gap-2">
                    <X
                        className="w-5 h-5 text-white cursor-pointer hover:opacity-100 transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />
                    <LayoutPanelLeft
                        className="w-5 h-5 text-white cursor-pointer hover:opacity-100 transition-opacity"
                        onClick={() => setIsOpen(!isOpen)}
                    />
                </div>
            </div>

            {/* Navigation List */}
            <div className="px-3 py-2 space-y-1 min-w-[256px]">
                <button
                    onClick={() => router.push('/chat')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:text-white transition-colors text-sm font-medium rounded-lg hover:bg-white/5"
                >
                    <Plus className="w-4 h-4" />
                    New chat
                </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-3 py-6 custom-scrollbar pb-20">
                <div className="flex items-center justify-between px-3 mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/30 font-bold">LIBRARY</p>
                    <button
                        onClick={() => setIsCreatingFolder(true)}
                        className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white transition-all"
                    >
                        <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Folder Creation Input */}
                    {isCreatingFolder && (
                        <form onSubmit={handleCreateFolder} className="px-3 mb-4">
                            <input
                                autoFocus
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                                placeholder="Folder name..."
                                className="w-full bg-white/5 border border-primary/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                            />
                        </form>
                    )}

                    {/* Folders List */}
                    {folders.map(folder => {
                        const folderConvs = conversations.filter(c => c.folderId === folder.id);
                        const isExpanded = expandedFolders[folder.id];

                        return (
                            <div
                                key={folder.id}
                                className="space-y-1"
                                onDragOver={(e: any) => {
                                    e.preventDefault();
                                    setHoveredFolderId(folder.id);
                                }}
                                onDragLeave={() => setHoveredFolderId(null)}
                                onDrop={(e: any) => {
                                    e.preventDefault();
                                    const data = e.dataTransfer.getData('application/json');
                                    if (data) {
                                        const { convId } = JSON.parse(data);
                                        handleMoveToFolder(convId, folder.id);
                                    }
                                    setHoveredFolderId(null);
                                    setExpandedFolders(prev => ({ ...prev, [folder.id]: true }));
                                }}
                            >
                                <div
                                    className={`group relative flex items-center justify-between px-3 py-1.5 hover:bg-white/5 rounded-lg transition-all cursor-pointer ${hoveredFolderId === folder.id ? 'bg-primary/20 border border-primary/30' : 'border border-transparent'
                                        }`}
                                    onClick={() => toggleFolder(folder.id)}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-white/30" /> : <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
                                        <FolderIcon className="w-4 h-4 text-primary shrink-0" />
                                        {editingFolderId === folder.id ? (
                                            <form onSubmit={(e) => handleRenameFolder(e, folder.id)} className="flex-1 min-w-0">
                                                <input
                                                    autoFocus
                                                    value={editFolderName}
                                                    onChange={(e) => setEditFolderName(e.target.value)}
                                                    onBlur={() => setEditingFolderId(null)}
                                                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                                                />
                                            </form>
                                        ) : (
                                            <span className="text-sm font-medium text-white/80 truncate">{folder.name}</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowFolderMenuId(showFolderMenuId === folder.id ? null : folder.id);
                                            }}
                                            className="p-1 hover:bg-white/10 rounded"
                                        >
                                            <MoreVertical className="w-3.5 h-3.5 text-white/40" />
                                        </button>
                                    </div>

                                    {showFolderMenuId === folder.id && (
                                        <div className="absolute top-8 right-0 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 p-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingFolderId(folder.id);
                                                    setEditFolderName(folder.name);
                                                    setShowFolderMenuId(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                                Rename
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteFolder(folder.id);
                                                    setShowFolderMenuId(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {isExpanded && (
                                    <div className="ml-6 space-y-1">
                                        {folderConvs.length === 0 ? (
                                            <p className="text-[10px] text-white/20 py-2 px-3">No chats here</p>
                                        ) : (
                                            folderConvs.map((conv, idx) => renderConversationItem(conv, idx))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Uncategorized Chats */}
                    <div
                        className={`space-y-1 pt-4 rounded-xl transition-all ${isDraggingOverUncategorized ? 'bg-white/5 border border-white/10 p-2' : ''}`}
                        onDragOver={(e: any) => {
                            e.preventDefault();
                            setIsDraggingOverUncategorized(true);
                        }}
                        onDragLeave={() => setIsDraggingOverUncategorized(false)}
                        onDrop={(e: any) => {
                            e.preventDefault();
                            const data = e.dataTransfer.getData('application/json');
                            if (data) {
                                const { convId } = JSON.parse(data);
                                handleMoveToFolder(convId, null);
                            }
                            setIsDraggingOverUncategorized(false);
                        }}
                    >
                        <p className="text-[10px] uppercase tracking-wider text-white/30 font-bold px-3 mb-2">UNCATEGORIZED</p>
                        {conversations.filter(c => !c.folderId).map((conv, idx) => renderConversationItem(conv, idx))}
                    </div>
                </div>
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md space-y-4">
                {/* Credit Display */}
                <div className="px-3 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/20">
                            <Wallet className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Credits</span>
                    </div>
                    <span className={`text-sm font-black ${user?.credits && user.credits > 0 ? 'text-primary' : 'text-red-400'}`}>
                        {user?.credits || 0}
                    </span>
                </div>

                <div className="flex items-center gap-3 px-1">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold uppercase border border-white/10">
                        {user?.email?.charAt(0) || 'K'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate capitalize leading-tight">{user?.name || user?.email?.split('@')[0] || 'User'}</p>
                        <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest mt-0.5">{user?.plan || 'Free Plan'}</p>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={async () => {
                        await logout();
                        router.push('/');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-red-400 transition-all text-sm font-semibold group"
                >
                    <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span>Logout</span>
                </button>
            </div>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#1a1a1a] border border-white/10 p-6 rounded-[2rem] max-w-sm w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Delete chat?</h3>
                            <p className="text-white/60 text-sm mb-8">
                                This will permanently delete this conversation and all its messages. This cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-all shadow-lg shadow-red-500/20 text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.aside>
    );
};

export default Sidebar;
