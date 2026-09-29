import { OnboardingCard } from "@/features/onboarding/ui/onBoardingCard";

export default function testPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, var(--brand-primary), transparent 60%)",
          opacity: 0.12,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
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
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(135deg, transparent 40%, var(--background-elevated) 50%, transparent 60%)",
          opacity: 0.4,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[3] bg-linear-to-b from-background/0 via-background/0 to-background/40"
      />
      <div className="relative z-10 w-full max-w-lg">
        <OnboardingCard />
      </div>
    </main>
  );
}
