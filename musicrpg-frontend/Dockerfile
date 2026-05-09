FROM node:22-alpine AS builder

RUN apk upgrade --no-cache

WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

ARG NEXT_PUBLIC_APP_VERSION=dev
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx next build --webpack

# ---- runner ----
FROM node:22-alpine AS runner

RUN apk upgrade --no-cache

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
