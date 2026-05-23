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
docker compose logs -f grandstay-frontend

# Detener
docker compose down
```

### Stack completo (frontend + backend + mysql)

```bash
cd ..
docker compose up --build -d
```

## Acceso

- Frontend: http://localhost:80
- El nginx proxyea /api al backend en http://grandstay-backend:4000
