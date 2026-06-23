export const Footer = () => (
    <footer className="py-10 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-foreground/50">
            <span>HireRank © 2026</span>
            <div className="flex gap-6">
                <a href="#" className="hover:text-foreground/80 transition-colors">Конфиденциальность</a>
                <a href="#" className="hover:text-foreground/80 transition-colors">Условия</a>
                <a href="#" className="hover:text-foreground/80 transition-colors">Контакты</a>
            </div>
        </div>
    </footer>
)