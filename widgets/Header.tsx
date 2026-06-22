import { MainButton } from "@/shared/buttons/MainButton";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md dark:bg-black/80">

      <div className="font-bold text-xl tracking-tight cursor-pointer">
        HireRank<span className="text-primary">.</span>
      </div>

      <nav>
        <ul className="flex items-center gap-8">
          {["Product", "Company", "Ecosystem", "News"].map((item) => (
            <li key={item}>
              <a 
                href="#" 
                className="text-sm font-medium text-zinc-600 hover:text-black transition-colors dark:text-zinc-400 dark:hover:text-white"
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
    </header>
  );
};