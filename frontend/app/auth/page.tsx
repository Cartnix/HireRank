"use client";

import { AuthModal } from "@/widgets/authModal/ui/AuthModal";

export default function AuthForm() {
    return (
        <main className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* Мягкие цветовые пятна в стиле iOS wallpaper */}
            <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-brand-primary/25 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-[380px] h-[380px] bg-success/20 rounded-full blur-[110px]" />
            <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-warning/15 rounded-full blur-[100px]" />

            {/* Лёгкий шум/виньетка сверху, чтобы пятна не выглядели плоско */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/0 to-background/40 pointer-events-none" />

            <div className="z-10 relative">
                <AuthModal />
            </div>
        </main>
    );
}