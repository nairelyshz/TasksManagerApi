# Makefile para comandos Docker comunes
.PHONY: help dev up down logs clean build restart db-reset db-shell test

# Comando por defecto
help:
	@echo "Comandos disponibles:"
	@echo "  make dev        - Iniciar en modo desarrollo"
	@echo "  make up         - Levantar todos los servicios"
	@echo "  make down       - Detener todos los servicios"
	@echo "  make logs       - Ver logs de todos los servicios"
	@echo "  make clean      - Limpiar volúmenes y contenedores"
	@echo "  make build      - Reconstruir imágenes"
	@echo "  make restart    - Reiniciar servicios"
	@echo "  make db-reset   - Resetear base de datos"
	@echo "  make db-shell   - Acceder a la shell de PostgreSQL"
	@echo "  make pgadmin    - Iniciar con pgAdmin"

# Desarrollo
dev:
	docker-compose up

# Levantar servicios en background
up:
	docker-compose up -d

# Detener servicios
down:
	docker-compose down

# Ver logs
logs:
	docker-compose logs -f

# Limpiar todo (contenedores, volúmenes, imágenes)
clean:
	docker-compose down -v --rmi local
	@echo "✓ Limpieza completa realizada"

# Reconstruir imágenes
build:
	docker-compose build --no-cache

# Reiniciar servicios
restart:
	docker-compose restart

# Resetear base de datos
db-reset:
	docker-compose down postgres
	docker volume rm task-manager-backend_postgres_data || true
	docker-compose up -d postgres
	@echo "✓ Base de datos reseteada"

# Acceder a PostgreSQL shell
db-shell:
	docker-compose exec postgres psql -U postgres -d task_manager

# Iniciar con pgAdmin
pgadmin:
	docker-compose --profile tools up -d

# Producción
prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

