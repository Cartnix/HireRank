import { Footer } from "@/widgets/Footer";
import { Header } from "@/widgets/Header";
import Landing from "./landing/page";

export default function Home() {
  
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background font-sans">
      <Header />
      <main className="flex flex-1 w-full flex-col items-center justify-between py-32 px-16 bg-background sm:items-start">
        <Landing />
        
      </main>
      <Footer />
    </div>
  );
}
