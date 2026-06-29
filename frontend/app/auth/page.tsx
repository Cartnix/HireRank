"use client";

import { AuthModal } from "@/widgets/authModal/ui/AuthModal";

export default function AuthForm() {
    return (
        <main className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
            <div
                className="absolute inset-0 z-0"
                style={{
                    background:
                        "radial-gradient(ellipse 80% 50% at 50% -10%, var(--brand-primary), transparent 60%)",
                    opacity: 0.12,
                }}
            />

            <div
                className="absolute inset-0 z-1"
                style={{
                    backgroundImage:
                        "radial-gradient(var(--foreground-tertiary) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                    maskImage:
                        "radial-gradient(ellipse 70% 70% at 50% 40%, black 0%, transparent 75%)",
                    WebkitMaskImage:
                        "radial-gradient(ellipse 70% 70% at 50% 40%, black 0%, transparent 75%)",
                    opacity: 0.5,
                }}
            />

            <div
                className="absolute inset-0 z-2 pointer-events-none"
                style={{
                    background:
                        "linear-gradient(135deg, transparent 40%, var(--background-elevated) 50%, transparent 60%)",
                    opacity: 0.4,
                }}
            />

            <div className="absolute inset-0 z-3 bg-linear-to-b from-background/0 via-background/0 to-background/40 pointer-events-none" />

            <div className="z-10 relative">
                <AuthModal />
            </div>
        </main>
    );
}