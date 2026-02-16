---
title: Deployment
description: Deploy your Denote documentation site to production
---

# Deployment

Denote can be deployed anywhere that runs Deno or Docker. This guide covers the
most common options.

## Build for Production

Before deploying, create a production build:

```bash
deno task build
```

This generates an optimized build in the `_fresh/` directory. To test it
locally:

```bash
deno task start
```

Your site will be available at [http://localhost:8000](http://localhost:8000).

## Deno Deploy

[Deno Deploy](https://deno.com/deploy) is the fastest way to deploy a Denote
site. It runs on Deno's global edge network with zero configuration.

### Prerequisites

Install the `deployctl` CLI:

```bash
deno install -gArf jsr:@deno/deployctl
```

### Deploy

Build and deploy in two commands:

```bash
deno task build
deployctl deploy --project=<your-project> _fresh/server.js
```

### Automatic Deploys

Connect your GitHub repository to Deno Deploy for automatic deployments on every
push. See the [Deno Deploy docs](https://docs.deno.com/deploy/manual/) for setup
instructions.

### Environment Variables

Deno Deploy supports environment variables through the dashboard. No special
configuration is needed for Denote — it works out of the box.

## Docker

Docker is ideal for self-hosting or deploying to any container platform.

### Quick Start

Denote ships with a production-ready `Dockerfile`:

```bash
docker build -t my-docs .
docker run -p 8000:8000 my-docs
```

Your site will be available at [http://localhost:8000](http://localhost:8000).

### Docker Compose

For easier management, use the included `docker-compose.yml`:

```bash
docker compose up -d
```

The default compose file mounts your `content/` directory and `denote.config.ts`
as read-only volumes, so you can update documentation without rebuilding the
image.

### Custom Content Directory

To serve different content, mount your own directory:

```bash
docker run -p 8000:8000 \
  -v ./my-content:/app/content:ro \
  -v ./my-config.ts:/app/denote.config.ts:ro \
  my-docs
```

### Container Platforms

The Docker image works on any container platform:

- **Railway** — Connect your repo or deploy the Docker image directly
- **Fly.io** — Use `fly launch` with the included Dockerfile
- **Render** — Select "Docker" as the environment
- **Any Kubernetes cluster** — Use the image in your pod spec

## Fly.io

[Fly.io](https://fly.io) runs Docker containers on a global edge network.

### Quick Start

```bash
fly launch
fly deploy
```

### fly.toml

Create a `fly.toml` in your project root:

```toml
app = "my-docs"
primary_region = "iad"

[build]

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  path = "/"
  timeout = "5s"
```

### Environment Variables

Set environment variables with:

```bash
fly secrets set MY_VAR=value
```

## Coolify

[Coolify](https://coolify.io) is a self-hosted PaaS that deploys Docker
containers.

### Setup

1. In Coolify, create a new **Docker** resource and connect your Git repository
   (or point to the Docker image).

2. Set the build pack to **Dockerfile** — Coolify will use the included
   `Dockerfile` automatically.

3. Configure environment variables in the Coolify dashboard under your
   application's **Environment Variables** tab.

4. Set your custom domain under **Domains** — Coolify handles SSL via Let's
   Encrypt automatically.

### Docker Compose (Alternative)

If you prefer compose-based deploys, Coolify also supports `docker-compose.yml`.
Point it at the included compose file and Coolify will manage the stack.

## VPS / Self-Hosting

For a traditional VPS deployment with Deno installed directly:

```bash
# On your server
git clone https://github.com/<your-org>/my-docs.git
cd my-docs
deno task build
deno task start
```

### Reverse Proxy

Put Denote behind a reverse proxy like Caddy or Nginx for SSL and custom
domains.

**Caddy** (recommended — automatic HTTPS):

```
docs.example.com {
    reverse_proxy localhost:8000
}
```

**Nginx:**

```nginx
server {
    listen 80;
    server_name docs.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Next Steps

- [Configuration](/docs/configuration) — Customize your site before deploying
- [Writing Content](/docs/content) — Add more documentation pages
