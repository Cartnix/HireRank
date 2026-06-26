"use client";

import { AuthModal } from "@/widgets/authModal/ui/AuthModal";

export const AuthForm = () => {

    return (
        <div
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 backdrop-blur-md p-4 space-y-4"
        >
            <div className="fixed -top-32 -left-24 w-96 h-96 rounded-full blur-[100px] opacity-40 bg-brand-primary/30 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-md h-112 rounded-full blur-[120px] opacity-30 bg-brand-primary/20 pointer-events-none" />

            <AuthModal />
        </div>
    );
};

