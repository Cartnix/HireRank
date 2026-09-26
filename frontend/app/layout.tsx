import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/shared/ui/components/ThemeToogle";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { LegalAcceptModal } from "@/widgets/authModal/ui/LegalAcceptModal";
import { ThemeProvider } from "./providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <AuthProvider>
              {children}
              <LegalAcceptModal />
              <div className="fixed bottom-5 right-5 z-50">
                <ThemeToggle />
              </div>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}