"use client";

import { MainButton } from "@/shared/ui/buttons/MainButton";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { useAuth } from "@/features/auth/useAuth";
import { useRouter } from "next/navigation";

export const Header = () => {
  const { user, isLoading, clearSession } = useAuthSession();
  const { signOut } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await signOut();
    clearSession();
    router.push("/auth");
  };

  return (
    <header
      className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between px-4 sm:px-6
                        bg-background/70 backdrop-blur-md border-b border-border-subtle"
    >
      <div className="font-bold text-xl tracking-tight cursor-pointer text-foreground">
        <h3>HireRank</h3>
      </div>

      <nav aria-label="Основная навигация">
        <ul className="m-0 flex list-none items-center gap-3 p-0 sm:gap-6">
          {["Product", "mrxCompany", "Ecosystem", "News"].map((item) => (
            <li key={item} className="hidden sm:block">
              <a
                href="#"
                className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
              >
                {item}
              </a>
            </li>
          ))}
          <li>
            {!isLoading && user ? (
              <MainButton title="Выйти" onClick={onLogout} />
            ) : (
              <MainButton title="Sign Up" link="/auth" />
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};
