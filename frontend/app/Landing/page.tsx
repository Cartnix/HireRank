import { CTA, Features, Hero, HowItWorks, Stats, Testimonial } from "@/widgets/Landing"

export default function Landing() {
    return (
        <div className="w-full h-vh items-center justify-center">
            <Hero />
            <Stats />
            <Features />
            <HowItWorks />
            <Testimonial />
            <CTA />
        </div>
    )
}