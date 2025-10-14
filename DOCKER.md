# 🐳 Guía de Docker para Task Manager Backend

Esta guía explica cómo usar Docker para ejecutar el proyecto de manera fácil y consistente.

## 📋 Requisitos Previos

- Docker instalado (versión 20.10 o superior)
- Docker Compose instalado (versión 2.0 o superior)

Para verificar: `docker --version` y `docker-compose --version`

## 🚀 Inicio Rápido

### Desarrollo (Modo más común)

```bash
# Opción 1: Con Docker Compose directamente
docker-compose up

# Opción 2: Con Makefile (más fácil)
make dev

# Opción 3: En background
make up
```

¡Eso es todo! La aplicación estará corriendo en:

- **Backend API**: http://localhost:3000/api
- **PostgreSQL**: localhost:5432
- **pgAdmin** (opcional): http://localhost:5050

### Credenciales por Defecto

**PostgreSQL:**

- Database: `task_manager`
- User: `postgres`
- Password: `postgres`

**pgAdmin** (si está habilitado):

- Email: `admin@taskmanager.com`
- Password: `admin`

## 📦 Archivos Docker

### 1. `Dockerfile` (Multi-stage)

- **Stage development**: Para desarrollo con hot reload
- **Stage production**: Imagen optimizada para producción

### 2. `Dockerfile.dev`

- Dockerfile simplificado solo para desarrollo

### 3. `docker-compose.yml`

- PostgreSQL + Backend + pgAdmin (opcional)
- Configurado para desarrollo
- Hot reload activado
- Scripts SQL se ejecutan automáticamente

### 4. `docker-compose.prod.yml`

- Configuración para producción
- Lee variables de entorno del archivo `.env`
- Sin volúmenes de código (usa imagen compilada)

### 5. `.dockerignore`

- Excluye archivos innecesarios del build
- Optimiza tiempo de construcción

## 🛠️ Comandos Útiles (Makefile)

```bash
make help       # Ver todos los comandos disponibles
make dev        # Iniciar en modo desarrollo
make up         # Levantar servicios en background
make down       # Detener servicios
make logs       # Ver logs de todos los servicios
make build      # Reconstruir imágenes
make restart    # Reiniciar servicios
make clean      # Limpiar todo (contenedores, volúmenes, imágenes)
make db-reset   # Resetear base de datos
make db-shell   # Acceder a PostgreSQL shell
make pgadmin    # Iniciar con pgAdmin incluido
```

## 📝 Comandos Docker Compose Manuales

### Iniciar servicios

```bash
# Modo desarrollo (con logs visibles)
docker-compose up

# Modo background
docker-compose up -d

# Solo PostgreSQL
docker-compose up postgres -d

# Con pgAdmin
docker-compose --profile tools up -d
```

### Ver logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo PostgreSQL
docker-compose logs -f postgres
```

### Detener servicios

```bash
# Detener pero mantener volúmenes (mantiene datos)
docker-compose down

# Detener y eliminar volúmenes (elimina datos)
docker-compose down -v
```

### Acceder a contenedores

```bash
# Shell del backend
docker-compose exec backend sh

# Shell de PostgreSQL
docker-compose exec postgres psql -U postgres -d task_manager

# Ver estructura de base de datos
docker-compose exec postgres psql -U postgres -d task_manager -c "\dt"
```

## 🔧 Troubleshooting

### Puerto ya en uso

```bash
# Error: Puerto 3000 o 5432 ya está en uso
# Solución: Cambiar puertos en docker-compose.yml o detener servicio existente

# Ver qué está usando el puerto
lsof -i :3000
lsof -i :5432
```

### Resetear base de datos

```bash
# Opción 1: Con Makefile
make db-reset

# Opción 2: Manual
docker-compose down postgres
docker volume rm task-manager-backend_postgres_data
docker-compose up -d postgres
```

### Reconstruir desde cero

```bash
# Opción 1: Con Makefile
make clean
make build
make up

# Opción 2: Manual
docker-compose down -v --rmi local
docker-compose build --no-cache
docker-compose up
```

### Ver volúmenes

```bash
# Listar volúmenes
docker volume ls

# Inspeccionar volumen
docker volume inspect task-manager-backend_postgres_data

# Eliminar volumen específico
docker volume rm task-manager-backend_postgres_data
```

## 🌐 Producción

### Build y deploy

```bash
# Usando docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# O con Makefile
make prod-up

# Ver logs
make prod-logs

# Detener
make prod-down
```

### Variables de entorno en producción

Asegúrate de configurar estas variables:

```bash
NODE_ENV=production
PORT=3000
DB_HOST=postgres  # o tu host de BD externo
DB_PORT=5432
DB_USERNAME=tu_usuario_seguro
DB_PASSWORD=tu_password_seguro
DB_DATABASE=task_manager
JWT_SECRET=tu_secret_super_seguro_y_largo
JWT_EXPIRES_IN=7d
```

## 📊 Monitoreo

### Verificar estado de servicios

```bash
docker-compose ps
```

### Verificar salud de PostgreSQL

```bash
docker-compose exec postgres pg_isready -U postgres
```

### Ver uso de recursos

```bash
docker stats
```

## 🎯 Mejores Prácticas

1. **Desarrollo**: Usa `docker-compose.yml` con volúmenes para hot reload
2. **Testing**: Usa `make db-reset` para empezar con BD limpia
3. **Producción**: Usa `docker-compose.prod.yml` con variables de entorno seguras
4. **Limpieza**: Ejecuta `make clean` periódicamente para liberar espacio
5. **Logs**: Revisa logs con `make logs` si algo no funciona

## 🔐 Seguridad

### En Desarrollo

- ✅ Credenciales simples están OK
- ✅ Puerto 5432 expuesto está OK para debugging

### En Producción

- ⚠️ Cambia TODAS las contraseñas
- ⚠️ Usa secrets de Docker o variables de entorno seguras
- ⚠️ No expongas puerto 5432 públicamente
- ⚠️ Usa JWT_SECRET largo y aleatorio
- ⚠️ Configura HTTPS/SSL para la base de datos

## 📚 Recursos Adicionales

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs: `make logs`
2. Verifica el estado: `docker-compose ps`
3. Resetea todo: `make clean && make up`
4. Revisa el archivo DOCKER.md para troubleshooting
