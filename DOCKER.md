# Grand-Stay Frontend - Docker

## Requisitos

- Docker 20.10+
- Docker Compose v2+

## Estructura

```
Frontend/
├── Dockerfile              # Multi-stage build con nginx
├── docker-compose.yml      # Frontend standalone
├── nginx.conf              # Configuracion de nginx
├── .dockerignore
└── ...
```

## Uso

### Desarrollo standalone

```bash
# Construir y ejecutar
docker compose up -d

# Ver logs
docker compose logs -f frontend

# Detener
docker compose down
```

## Acceso

- Frontend: http://localhost:80
- El nginx proxyea `/api` al backend en `http://backend:4000`
