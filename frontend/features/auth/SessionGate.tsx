"use client";
import { useAuthSession } from "./AuthProvider";
import Link from "next/link";
export function SessionGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthSession();
  if (isLoading) return <p className="p-6">Проверяем сессию...</p>;
  if (!user) return <p className="p-6">Для доступа к ATS <Link className="text-brand-primary" href="/auth">войдите в аккаунт</Link>.</p>;
  return children;
}
