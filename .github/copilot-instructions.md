# GitHub Copilot Core Instructions

## Token Optimization Rules (CRITICAL)
- **Be brief and concise:** Answer in fewer than 1000 characters when possible. Use progressive disclosure.
- **Start lean:** Implement minimal, functional code. Avoid implementing boilerplate from scratch.
- **No defensive code:** Do not handle hypothetical failures unless explicitly asked.
- **No style enforcement:** Ignore formatting, tabs, spacing, or semicolons. Trust our local linters/formatters.
- **No speculative test writing:** Skip unit tests completely unless a specific file or test coverage is requested.
- **Minimize logs:** Use logger metrics sparingly to avoid syntax noise.

## Project Context
- **Tech Stack:** Next.js 15, TypeScript, Supabase [PostgreSQL, auth], TailwindCSS, FastAPI, Python 3.12, Qwen 2.5 (local inference), Nginx
- **Architecture:** Monorepo/Single project. Follow rules in local configs (tsconfig, package.json).

## Git & Command Behavior
- If asked to revert/rollback, use verbatim `git checkout -- <filename>` instead of manual rewrites.
- Always output a compact 1-line summary of commands executed. Do not output verbose console logs.
- Never use emojis in code or code documentation.
