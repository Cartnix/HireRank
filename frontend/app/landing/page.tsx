import { CTA, Features, Hero, HowItWorks, Stats, Testimonial } from "@/widgets/landing"

export default function Landing() {
    return (
        <div className="w-full">
            <Hero />
            <Stats />
            <Features />
            <HowItWorks />
            <Testimonial />
            <CTA />
        </div>
    )
}
