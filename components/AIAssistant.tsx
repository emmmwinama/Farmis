"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, RotateCcw } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const SUGGESTED = [
    "What's my most profitable crop?",
    "How does my yield compare to last season?",
    "Which field has the highest cost per hectare?",
    "What should I focus on this week?",
    "Suggest a selling price for my latest harvest",
];

function TypingDots() {
    return (
        <div className="flex items-center gap-1 px-4 py-3">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                />
            ))}
        </div>
    );
}

function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a3d1f] to-[#3d8c47] flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <Sparkles size={12} className="text-white" />
                </div>
            )}
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isUser
                        ? "bg-[#1a3d1f] text-white rounded-br-sm"
                        : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 rounded-bl-sm shadow-sm"
                }`}
            >
                {message.content.split("\n").map((line, i) => (
                    <span key={i}>
            {line}
                        {i < message.content.split("\n").length - 1 && <br />}
          </span>
                ))}
            </div>
        </div>
    );
}

export default function AIAssistant() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([{
                role: "assistant",
                content: "Hi! I'm your AgriVault AI assistant. I have full context about your farm — fields, crops, yields, costs and finances. What would you like to know?",
            }]);
        }
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const send = async (text?: string) => {
        const content = text ?? input.trim();
        if (!content || loading) return;

        const userMessage: Message = { role: "user", content };
        const updated = [...messages, userMessage];
        setMessages(updated);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: updated }),
            });
            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.message ?? "Sorry, I couldn't process that. Please try again." },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Something went wrong. Please check your connection and try again." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setMessages([{
            role: "assistant",
            content: "Hi! I'm your AgriVault AI assistant. I have full context about your farm — fields, crops, yields, costs and finances. What would you like to know?",
        }]);
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setOpen(!open)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
                    open
                        ? "bg-slate-700 rotate-0 scale-90"
                        : "bg-gradient-to-br from-[#1a3d1f] to-[#3d8c47] hover:scale-110 hover:shadow-xl"
                }`}
                title="AI Farm Assistant"
            >
                {open
                    ? <X size={20} className="text-white" />
                    : <Sparkles size={20} className="text-white" />}
            </button>

            {/* Chat panel */}
            {open && (
                <div className="fixed bottom-24 right-6 z-50 w-96 h-[560px] bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#1a3d1f] to-[#2d6a35] px-5 py-4 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <Sparkles size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">AgriVault AI</p>
                                <p className="text-xs text-white/70">Farm-aware assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={reset}
                            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                            title="Reset conversation"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 min-h-0">
                        {messages.map((msg, i) => (
                            <MessageBubble key={i} message={msg} />
                        ))}
                        {loading && (
                            <div className="flex justify-start mb-3">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a3d1f] to-[#3d8c47] flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                                    <Sparkles size={12} className="text-white" />
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm shadow-sm">
                                    <TypingDots />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions */}
                    {messages.length <= 1 && !loading && (
                        <div className="px-4 pb-2 flex-shrink-0">
                            <p className="text-xs text-slate-400 mb-2 font-medium">Try asking:</p>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => send(s)}
                                        className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-xl hover:border-[#3d8c47] hover:text-[#1a3d1f] dark:hover:text-[#7dd68a] transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 focus-within:border-[#3d8c47] transition-colors">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                                placeholder="Ask about your farm..."
                                className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400"
                            />
                            <button
                                onClick={() => send()}
                                disabled={!input.trim() || loading}
                                className="w-8 h-8 rounded-xl bg-[#1a3d1f] disabled:opacity-30 flex items-center justify-center hover:bg-[#2d5c35] transition-colors flex-shrink-0"
                            >
                                <Send size={13} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}