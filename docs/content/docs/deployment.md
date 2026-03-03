---
title: Deployment
description: Deploy your Denote documentation site to production
ai-summary: Deploy Denote to Deno Deploy (recommended one-click), Docker, or any Deno-capable host. Covers production builds, environment variables, GitHub Actions CI/CD, and custom domain setup.
ai-keywords: [
  deployment,
  Deno Deploy,
  Docker,
  production build,
  CI/CD,
  GitHub Actions,
  environment variables,
  hosting,
]
---

# Deployment

Denote is a standard [Fresh](https://fresh.deno.dev) app. It can be deployed
anywhere that runs Deno or Docker.

## Build for Production

Create a production build:

```bash
deno task build
```

This generates an optimized build in the `_fresh/` directory. To preview it
locally:

```bash
deno task start
```

Your site will be available at [http://localhost:8000](http://localhost:8000).

## Deno Deploy

[Deno Deploy](https://deno.com/deploy) is the fastest way to deploy. Since
Denote is a Fresh app, follow the standard
[Fresh deployment guide](https://fresh.deno.dev/docs/deployment).

The quickest option is connecting your GitHub repository for automatic deploys
on every push — no CLI needed.

### Manual Deploy

If you prefer the CLI:

```bash
deno install -gArf jsr:@deno/deployctl

deno task build
deployctl deploy --project=<your-project> _fresh/server.js
```

## Docker

Every Denote project includes a production-ready `Dockerfile`.

### Build and Run

```bash
docker build -t my-docs .
docker run -p 8000:8000 my-docs
```

Your site will be available at [http://localhost:8000](http://localhost:8000).

### Container Platforms

The Docker image works on any container platform — Railway, Fly.io, Render,
Coolify, Kubernetes, or any VPS with Docker installed.

## Security Headers

Denote automatically sets security headers on every response — no reverse proxy
configuration needed:

| Header                      | Value                                          |
| --------------------------- | ---------------------------------------------- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options`    | `nosniff`                                      |
| `X-Frame-Options`           | `DENY`                                         |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`              |
| `Content-Security-Policy`   | Auto-configured policy                         |

These headers are always active in both development and production. Hashed
static assets (files matching `/_fresh/` or `.[hash].(js|css|...)`) also receive
`Cache-Control: public, max-age=31536000, immutable` for aggressive caching.

If you run Denote behind a reverse proxy, the proxy's headers will merge with
these. No extra proxy configuration is needed for basic security compliance.

## Next Steps

- [Configuration](/docs/configuration) — Customize your site before deploying
- [Writing Content](/docs/content) — Add more documentation pages
