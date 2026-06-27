"use client";

import { AuthModal } from "@/widgets/authModal/ui/AuthModal";

export default function AuthForm() {
    return (
        <main className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
            <div className="absolute -top-32 -left-32 w-105 h-105 bg-brand-primary/25 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-95 h-95 bg-success/20 rounded-full blur-[110px]" />
            <div className="absolute top-1/3 right-1/4 w-75 h-75 bg-warning/15 rounded-full blur-[100px]" />

            <div className="absolute inset-0 bg-linear-to-b from-background/0 via-background/0 to-background/40 pointer-events-none" />

            <div className="z-10 relative">
                <AuthModal />
            </div>
        </main>
    );
}

