import { MainButton } from "@/shared/ui/buttons/MainButton";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 px-6 flex items-center justify-between
                        bg-background/70 backdrop-blur-md border-b border-border-subtle">


      <div className="font-bold text-xl tracking-tight cursor-pointer text-foreground">
        <h3>HireAI</h3>
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
            <MainButton title="Sign Up" link="/auth"/>
          </li>
        </ul>
      </nav>
    </header >
  );
};
