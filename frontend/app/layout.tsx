import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/shared/ui/components/ThemeToogle";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { LegalAcceptModal } from "@/widgets/authModal/ui/LegalAcceptModal";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <LegalAcceptModal />
            <div className="fixed bottom-5 right-5 z-50">
              <ThemeToggle />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
