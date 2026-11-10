import { Footer } from "@/widgets/Footer";
import { Header } from "@/widgets/Header";
import Landing from "./landing/page";

export default function Home() {
  
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background font-sans">
      <Header />
      <main className="flex w-full flex-1 flex-col items-center justify-between bg-background px-4 py-20 sm:items-start sm:px-6 sm:py-24 lg:px-8">
        <Landing />
      </main>
      <Footer />
    </div>
  );
}
