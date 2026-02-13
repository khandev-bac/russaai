'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Send, Loader2, Paperclip, Mic, ChevronDown, Search, LayoutPanelLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import Image from 'next/image';
import PaywallModal from './PaywallModal';

interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

interface ChatWindowProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ sidebarOpen, setSidebarOpen }) => {
    const params = useParams();
    const id = params?.id as string | undefined;
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const { refreshConversations } = useChat();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [streamingResponse, setStreamingResponse] = useState('');
    const [personaType, setPersonaType] = useState('Friend');
    const [showPersonaMenu, setShowPersonaMenu] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (id) {
            const fetchHistory = async () => {
                try {
                    const response = await api.get(`/chat/history/${id}`);
                    setMessages(response.data.history);
                } catch (error) {
                    console.error('Failed to fetch history', error);
                }
            };
            fetchHistory();
        } else {
            setMessages([]);
        }
    }, [id]);

    useEffect(scrollToBottom, [messages, streamingResponse]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        // Check credits
        if (user && user.credits <= 0) {
            setShowPaywall(true);
            return;
        }

        const messageContent = input;
        setInput('');
        setLoading(true);
        setStreamingResponse('');

        // 1. Optimistically add user message
        const tempUserMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: messageContent,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempUserMessage]);

        try {
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    message: messageContent,
                    personaType,
                    conversationId: id ? parseInt(id) : undefined
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send message');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader');

            const decoder = new TextDecoder();
            let fullContent = '';
            let finalConversationId: number | null = null;
            let finalMessageId: number | null = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.done) {
                                finalMessageId = data.messageId;
                                refreshUser(); // Refresh user data (e.g. credits)
                            } else if (data.content) {
                                fullContent += data.content;
                                setStreamingResponse(fullContent);
                                if (data.conversationId) finalConversationId = data.conversationId;
                            }
                        } catch (e) {
                            // Ignore
                        }
                    }
                }
            }

            // 2. Persist assistant message
            if (fullContent) {
                const assistantMessage: Message = {
                    id: finalMessageId || Date.now() + 1,
                    role: 'assistant',
                    content: fullContent,
                    createdAt: new Date().toISOString()
                };
                setMessages(prev => [...prev, assistantMessage]);
                setStreamingResponse('');

                if (finalConversationId && !id) {
                    refreshConversations();
                    router.push(`/chat/${finalConversationId}`);
                }
            }

        } catch (error: any) {
            console.error('Streaming error', error);
            const errorMessage: Message = {
                id: Date.now() + 2,
                role: 'assistant',
                content: `Error: ${error.message || 'Something went wrong.'}`,
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const personas = ['Friend', 'Lover', 'Mom', 'Dad'];

    const renderInputForm = (isCentered: boolean = false) => (
        <form
            onSubmit={handleSend}
            className={`mx-auto relative group bg-black rounded-[2.5rem] border p-4 pb-3 transition-all ${isCentered
                ? 'max-w-4xl border-primary shadow-[0_0_30px_rgba(48,209,88,0.2)]'
                : 'max-w-3xl border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
                }`}
        >
            <input
                type="text"
                className="w-full bg-transparent px-4 py-2 text-white text-lg focus:outline-none placeholder:text-white/20 font-medium"
                placeholder="What challenge will we conquer today?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />

            <div className="flex items-center justify-between mt-4 px-2">
                <div className="flex items-center gap-4">
                    <button type="button" className="text-white/20 hover:text-white transition-colors">
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-primary px-4 py-2 rounded-full border border-white/5 transition-all text-xs font-bold"
                        >
                            <Image src="/logo.png" alt="" width={14} height={14} className="object-contain brightness-125" />
                            <span>{personaType}</span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </button>

                        {showPersonaMenu && (
                            <div className="absolute bottom-full mb-2 left-0 bg-secondary border border-white/10 rounded-2xl p-2 w-40 z-50 shadow-2xl">
                                {personas.map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => {
                                            setPersonaType(p);
                                            setShowPersonaMenu(false);
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button type="button" className="text-white/20 hover:text-white transition-colors">
                        <Mic className="w-5 h-5" />
                    </button>
                    {!isCentered && input.trim() && (
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="bg-primary text-black p-3 rounded-full hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                            <Send className="w-5 h-5 fill-current" />
                        </button>
                    )}
                </div>
            </div>
        </form>
    );

    return (
        <main className="flex-1 flex flex-col relative bg-black overflow-hidden">
            {/* Header / Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-8 z-30 pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    {!sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all shadow-xl backdrop-blur-md border border-white/5"
                        >
                            <LayoutPanelLeft className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="w-20" /> {/* Spacer */}

                <div className="flex items-center gap-4 pointer-events-auto">
                    <button className="text-white/40 hover:text-white transition-colors">
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto px-8 custom-scrollbar ${messages.length === 0 && !streamingResponse ? 'flex items-center justify-center' : 'pt-24 pb-8'}`}>
                {messages.length === 0 && !streamingResponse ? (
                    <div className="flex flex-col items-center justify-center w-full max-w-4xl px-8">
                        <div className="flex items-center justify-center gap-3 mb-10 opacity-80">
                            <Image src="/logo.png" alt="Russa AI Logo" width={48} height={48} className="object-contain" />
                            <h2 className="text-3xl font-bold text-white tracking-tight text-center">Let's unlock your full potential.</h2>
                        </div>
                        <div className="w-full">
                            {renderInputForm(true)}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto w-full space-y-12">
                        {messages.map((msg) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={msg.id}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="flex items-start gap-4 w-full">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
                                            <Image src="/logo.png" alt="" width={16} height={16} className="object-contain brightness-125" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white/90 text-[15px] leading-relaxed space-y-4 whitespace-pre-wrap">
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {msg.role === 'user' && (
                                    <div className="bg-primary text-black px-5 py-2.5 rounded-[2rem] text-[15px] font-medium shadow-lg shadow-primary/10">
                                        {msg.content}
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {streamingResponse && (
                            <div className="flex items-start gap-4 w-full">
                                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
                                    <Image src="/logo.png" alt="" width={16} height={16} className="object-contain brightness-125" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-[11px] text-white/40 mb-3">
                                        <span>Thinking...</span>
                                    </div>
                                    <div className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap">
                                        {streamingResponse}
                                        <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse align-middle" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {loading && !streamingResponse && (
                            <div className="flex items-center gap-2 text-primary animate-pulse ml-12">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs font-medium uppercase tracking-widest">Thinking</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Bottom Input Area */}
            {messages.length > 0 && (
                <div className="pb-10 px-8">
                    {renderInputForm(false)}
                </div>
            )}

            <PaywallModal
                isOpen={showPaywall}
                onClose={() => setShowPaywall(false)}
            />
        </main>
    );
};

export default ChatWindow;
