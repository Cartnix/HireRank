import { Hero } from "@/widgets/Hero"
import { Stats } from "@/widgets/Stats"

export const Landing = () => {
    return (
        <div className="w-full h-vh flex items-center justify-center">
            <Hero />
            <Stats />
        </div>
    )
}