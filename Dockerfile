FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
RUN npx tsc server.ts --outDir . --esModuleInterop --module commonjs --target ES2022 --skipLibCheck
EXPOSE 3005
ENV PORT=3005
ENV NODE_ENV=production
CMD ["node", "server.js"]