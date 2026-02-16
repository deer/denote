# Build stage
FROM denoland/deno:2.3.5 AS builder

WORKDIR /app

# Cache dependencies
COPY deno.json deno.lock ./
RUN deno install

# Copy source and build
COPY . .
RUN deno task build

# Runtime stage
FROM denoland/deno:2.3.5

WORKDIR /app

COPY --from=builder /app/_fresh ./_fresh
COPY --from=builder /app/content ./content
COPY --from=builder /app/denote.config.ts ./denote.config.ts
COPY --from=builder /app/deno.json ./deno.json
COPY --from=builder /app/deno.lock ./deno.lock
COPY --from=builder /app/static ./static

RUN deno install

EXPOSE 8000

CMD ["deno", "task", "start"]
