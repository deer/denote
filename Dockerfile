# Build stage
FROM denoland/deno:2.7.1 AS builder

WORKDIR /app

# Cache dependencies
COPY deno.json deno.lock ./
COPY packages/denote/deno.json ./packages/denote/
COPY packages/denote-init/deno.json ./packages/denote-init/
COPY docs/deno.json ./docs/
RUN deno install

# Copy source and build
COPY . .
RUN deno task build

# Runtime stage
FROM denoland/deno:2.7.1

WORKDIR /app

COPY --from=builder /app/docs/_fresh ./_fresh
COPY --from=builder /app/docs/content ./content
COPY --from=builder /app/docs/denote.config.ts ./denote.config.ts
COPY --from=builder /app/docs/static ./static

EXPOSE 8000

CMD ["deno", "serve", "-A", "_fresh/server.js"]
