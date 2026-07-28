# Stage 1: Install ALL dependencies (including devDependencies for build)
FROM node:26-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

# Stage 2: Development
FROM deps AS dev

WORKDIR /app

COPY . .

RUN npm install

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Stage 3: Test / CI
FROM deps AS test

WORKDIR /app

COPY . .

RUN npm ci

ENV CI=true
ENV NODE_ENV=test

RUN npm run test

# Stage 4: Build the Next.js app
FROM deps AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

COPY . .

RUN npm run build

# Stage 5: Production runner (only production deps)
FROM node:26-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
