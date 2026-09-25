"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Bot, User, Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AgentsView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Привет! Я твой ИИ-ассистент по подбору и анализу кандидатов. Чем могу помочь?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 90)}px`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedInput,
    };

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedInput }),
      });

      if (!response.ok) throw new Error("Ошибка сети");

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || data.answer || "Ответ от сервера пуст.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Ошибка отправки:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ Произошла ошибка при получении ответа от сервера.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative w-full h-[calc(100vh-175px)] max-w-5xl mx-auto px-16 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground m-0 leading-tight">
              ИИ Агент-рекрутер
            </h1>
            <p className="text-[11px] text-muted-foreground m-0">
              Работает в реальном времени
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-3 min-h-0 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center text-brand-primary-foreground shrink-0 text-xs shadow-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[80%] md:max-w-[70%] px-3.5 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${
                msg.role === "user"
                  ? "bg-brand-primary text-brand-primary-foreground rounded-br-xs"
                  : "bg-card text-card-foreground border border-border rounded-bl-xs shadow-xs"
              }`}
            >
              {msg.content}
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 text-xs shadow-xs">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center text-brand-primary-foreground shrink-0 text-xs shadow-xs">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-card text-card-foreground border border-border rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 pt-2 pb-1">
        <div className="relative flex items-end gap-2 bg-card border border-input rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-ring transition-all shadow-xs">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение для агента..."
            rows={1}
            disabled={isLoading}
            className="w-full resize-none bg-transparent px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none max-h-20 text-xs md:text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="h-9 px-3.5 rounded-lg bg-brand-primary text-brand-primary-foreground font-medium flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-primary-hover transition-colors shrink-0 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-center mt-1">
          <span className="text-[10px] text-muted-foreground">
            Enter — отправить, Shift + Enter — новая строка
          </span>
        </div>
      </div>
    </main>
  );
}
