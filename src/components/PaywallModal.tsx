'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Sparkles, X, Check } from 'lucide-react';

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] max-w-md w-full shadow-2xl overflow-hidden relative"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8 pt-12 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-6 relative">
                                <Wallet className="w-10 h-10 text-primary" />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"
                                />
                            </div>

                            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Out of Credits</h2>
                            <p className="text-white/60 text-base mb-8 leading-relaxed">
                                You've used all your free credits. Upgrade to Russa Pro for unlimited chats and early access to new models.
                            </p>

                            <div className="space-y-4 mb-10 text-left bg-white/5 p-6 rounded-3xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-sm text-white/80 font-medium">Unlimited conversations</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-sm text-white/80 font-medium">Faster response times</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-sm text-white/80 font-medium">Advanced AI models (GPT-4o, Claude 3.5)</span>
                                </div>
                            </div>

                            <button className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black text-lg transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group">
                                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                                Upgrade to Pro
                            </button>

                            <p className="mt-4 text-[10px] text-white/20 uppercase font-black tracking-widest">
                                Secure payment with Stripe
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PaywallModal;
