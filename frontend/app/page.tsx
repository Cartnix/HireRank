import { Footer } from "@/widgets/Footer";
import { Header } from "@/widgets/Header";
import Landing from "./Landing/page";
import { RegisterForm } from "./auth/login/page";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Header />
      <main className="flex flex-1 w-full flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Landing />
        <RegisterForm />
      </main>
      <Footer />
    </div>
  );
}
