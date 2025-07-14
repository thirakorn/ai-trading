# Docker Setup and Usage

This project includes Docker configuration for both development and production environments.

## Prerequisites

- Docker and Docker Compose installed on your system
- At least 2GB of available RAM for the containers

## Quick Start

### Production Build

```bash
# Build and run the production container
npm run docker:prod

# Or manually:
docker-compose up -d
```

### Development Environment

```bash
# Build and run the development container with hot reloading
npm run docker:dev

# Or manually:
docker-compose -f docker-compose.dev.yml up --build
```

## Available Docker Scripts

| Command                   | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `npm run docker:build`    | Build the production Docker image                |
| `npm run docker:run`      | Run the production image directly                |
| `npm run docker:dev`      | Start development environment with hot reloading |
| `npm run docker:prod`     | Start production environment in detached mode    |
| `npm run docker:stop`     | Stop production containers                       |
| `npm run docker:stop-dev` | Stop development containers                      |
| `npm run docker:logs`     | View container logs                              |

## Container Details

### Production Container (Dockerfile)

- Multi-stage build for optimized image size
- Uses Node.js 18 Alpine Linux
- Runs Next.js in standalone mode
- Non-root user for security
- Optimized for production workloads

### Development Container (Dockerfile.dev)

- Single-stage build for faster iteration
- Volume mounting for hot reloading
- Development dependencies included
- Ideal for active development

## Environment Variables

Set environment variables in a `.env.local` file or modify the docker-compose files:

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
# Add your API keys and other environment variables here
```

## Ports

- **3000**: Main application port
- The application will be available at `http://localhost:3000`

## Volume Persistence

The production setup includes a named volume `ai-trading-data` for persistent data storage.

## Troubleshooting

### Common Issues

1. **Port already in use**: Stop any local Next.js development server before running Docker containers
2. **Permission errors**: Ensure Docker has proper permissions on your system
3. **Build failures**: Clear Docker cache with `docker system prune -a`

### Logs and Debugging

```bash
# View container logs
docker-compose logs -f

# Access container shell
docker-compose exec ai-trading-app sh

# View Docker images
docker images

# View running containers
docker ps
```

## Production Deployment

For production deployment, consider:

1. Setting up a reverse proxy (Nginx configuration included but commented)
2. Configuring SSL certificates
3. Setting up health checks
4. Implementing log aggregation
5. Adding monitoring and alerting

## Security Considerations

- The container runs as a non-root user
- Sensitive files are excluded via `.dockerignore`
- Environment variables should be managed securely in production
- Regular image updates recommended for security patches
