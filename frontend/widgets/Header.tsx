import { MainButton } from "@/shared/buttons/MainButton";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between
                        bg-background/70 backdrop-blur-md border-b border-border-subtle">

      <div className="font-bold text-xl tracking-tight cursor-pointer text-foreground">
        HireRank<span className="text-brand-primary">.</span>
      </div>

      <nav>
        <ul className="flex items-center gap-8">
          {["Product", "Company", "Ecosystem", "News"].map((item) => (
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
            <MainButton title="Sign Up" />
          </li>
        </ul>
      </nav>
    </header >
  );
};