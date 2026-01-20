# Jira Dashboard - Container Deployment Guide

This guide explains how to deploy the Jira Dashboard using containers with Podman or Docker.

## Prerequisites

- Podman (v5.0+) or Docker (v20.0+)
- Podman Compose or Docker Compose
- Jira API credentials (URL, email, API token)

## Quick Start

### 1. Configure Environment Variables

Create a `.env` file in the `backend` directory with your Jira credentials:

```bash
cp .env.example backend/.env
```

Edit `backend/.env` and add your credentials:
```env
JIRA_URL=https://datatorque.atlassian.net
JIRA_EMAIL=jamie.mcindoe@datatorque.com
JIRA_API_TOKEN=your-actual-token-here
```

### 2. Build and Run with Podman

#### Using Podman Compose (Recommended)

```bash
# Build and start all services
podman-compose up -d

# View logs
podman-compose logs -f

# Stop services
podman-compose down
```

#### Using Podman directly

```bash
# Create a network
podman network create jira-dashboard-network

# Build and run backend
podman build -t jira-dashboard-backend ./backend
podman run -d \
  --name jira-dashboard-backend \
  --network jira-dashboard-network \
  -p 5000:5000 \
  --env-file ./backend/.env \
  jira-dashboard-backend

# Build and run frontend
podman build -t jira-dashboard-frontend ./frontend
podman run -d \
  --name jira-dashboard-frontend \
  --network jira-dashboard-network \
  -p 80:80 \
  jira-dashboard-frontend
```

### 3. Build and Run with Docker

#### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Using Docker directly

```bash
# Create a network
docker network create jira-dashboard-network

# Build and run backend
docker build -t jira-dashboard-backend ./backend
docker run -d \
  --name jira-dashboard-backend \
  --network jira-dashboard-network \
  -p 5000:5000 \
  --env-file ./backend/.env \
  jira-dashboard-backend

# Build and run frontend
docker build -t jira-dashboard-frontend ./frontend
docker run -d \
  --name jira-dashboard-frontend \
  --network jira-dashboard-network \
  -p 80:80 \
  jira-dashboard-frontend
```

## Accessing the Dashboard

Once the containers are running:
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:5000

## Container Architecture

### Backend Container
- **Base Image**: node:20-alpine
- **Port**: 5000
- **Environment Variables**: JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN
- **Health Check**: GET /api/health

### Frontend Container
- **Base Image**: nginx:alpine (multi-stage build from node:20-alpine)
- **Port**: 80
- **Serves**: Production-optimized React build
- **Proxy**: API requests forwarded to backend:5000

### Network
- **Name**: jira-dashboard-network
- **Type**: Bridge network for inter-container communication

## Production Deployment Recommendations

### 1. Use Environment Variables Instead of .env File

For production servers, pass environment variables directly:

```bash
podman run -d \
  --name jira-dashboard-backend \
  -e JIRA_URL=https://your-domain.atlassian.net \
  -e JIRA_EMAIL=your-email@example.com \
  -e JIRA_API_TOKEN=your-token \
  -p 5000:5000 \
  jira-dashboard-backend
```

### 2. Use a Reverse Proxy

Deploy behind nginx or Traefik for:
- SSL/TLS termination
- Load balancing
- Additional security headers

Example nginx configuration:
```nginx
server {
    listen 443 ssl http2;
    server_name dashboard.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Persist Data with Volumes (if needed in future)

If you add data persistence requirements:
```yaml
volumes:
  - ./data:/app/data
```

### 4. Use Container Registry

Push images to a registry for easier deployment:

```bash
# Tag images
podman tag jira-dashboard-backend registry.example.com/jira-dashboard-backend:latest
podman tag jira-dashboard-frontend registry.example.com/jira-dashboard-frontend:latest

# Push to registry
podman push registry.example.com/jira-dashboard-backend:latest
podman push registry.example.com/jira-dashboard-frontend:latest

# Pull and run on production server
podman pull registry.example.com/jira-dashboard-backend:latest
podman pull registry.example.com/jira-dashboard-frontend:latest
```

### 5. Resource Limits

Set resource limits for production:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Monitoring and Maintenance

### View Logs

```bash
# All services
podman-compose logs -f

# Specific service
podman logs -f jira-dashboard-backend
podman logs -f jira-dashboard-frontend
```

### Check Container Status

```bash
# Using compose
podman-compose ps

# Direct
podman ps
```

### Update Containers

```bash
# Rebuild and restart
podman-compose up -d --build

# Or manually
podman-compose down
podman-compose build
podman-compose up -d
```

### Health Checks

Both containers include health checks:
- Backend: Checks `/api/health` endpoint every 30s
- Frontend: Checks nginx availability every 30s

Check health status:
```bash
podman inspect jira-dashboard-backend | grep -A 5 Health
podman inspect jira-dashboard-frontend | grep -A 5 Health
```

## Troubleshooting

### Container won't start

```bash
# Check logs
podman logs jira-dashboard-backend
podman logs jira-dashboard-frontend

# Check if ports are already in use
netstat -tulpn | grep -E '(80|5000)'
```

### API connection issues

1. Verify backend health: `curl http://localhost:5000/api/health`
2. Check backend logs: `podman logs jira-dashboard-backend`
3. Verify Jira credentials in `.env` file
4. Check network connectivity: `podman network inspect jira-dashboard-network`

### Frontend can't reach backend

1. Verify both containers are on same network
2. Check nginx proxy configuration in `frontend/nginx.conf`
3. Verify backend service name matches in nginx config (`backend:5000`)

## Security Considerations

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use secrets management** - Consider Docker/Podman secrets or external vaults
3. **Regular updates** - Keep base images updated
4. **Network isolation** - Use dedicated networks for container communication
5. **HTTPS only** - Always use TLS in production
6. **Limit container permissions** - Run as non-root user if possible

## Systemd Integration (Linux)

To run containers as systemd services:

```bash
# Generate systemd unit files
podman generate systemd --new --files --name jira-dashboard-backend
podman generate systemd --new --files --name jira-dashboard-frontend

# Move to systemd directory
sudo mv container-*.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable --now container-jira-dashboard-backend
sudo systemctl enable --now container-jira-dashboard-frontend
```

## Support

For issues or questions, refer to the main README.md or contact the development team.
