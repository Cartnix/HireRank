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
      className="fixed top-0 left-0 w-full z-50 px-6 flex items-center justify-between
                        bg-background/70 backdrop-blur-md border-b border-border-subtle"
    >
      <div className="font-bold text-xl tracking-tight cursor-pointer text-foreground">
        <h3>HireRank</h3>
      </div>

      <nav>
        <ul className="flex items-center gap-8">
          {["Product", "mrxCompany", "Ecosystem", "News"].map((item) => (
            <li key={item}>
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
