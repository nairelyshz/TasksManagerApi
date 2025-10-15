# 🚀 Task Manager - Backend API

API REST para gestión de tareas con autenticación JWT, desarrollada con NestJS y PostgreSQL.

---

## 🛠️ Tecnologías y Versiones

| Herramienta        | Versión  |
| ------------------ | -------- |
| **Node.js**        | v22.20.0 |
| **NestJS**         | v11.0.1  |
| **PostgreSQL**     | v15      |
| **TypeORM**        | v0.3.27  |
| **Docker**         | Latest   |
| **Docker Compose** | Latest   |

### Dependencias Principales

- **Joi** v18.0.1 - Validación de datos
- **Passport JWT** v4.0.1 - Autenticación
- **Bcrypt** v6.0.0 - Hash de contraseñas
- **Swagger** v7.1.17 - Documentación API

---

## ⚡ Inicio Rápido

### Levantar el proyecto con Docker

```bash
npm run docker
```

Este comando:

- ✅ Detiene contenedores existentes
- ✅ Construye las imágenes
- ✅ Levanta PostgreSQL y el backend
- ✅ Ejecuta scripts de schema y seed
- ✅ Inicia en modo detached

**El backend estará disponible en:**

- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs

**Credenciales de prueba:**

- Email: `demo@example.com`
- Password: `password123`

### Crear usuarios de prueba

Para crear 10 usuarios de prueba (user1@example.com a user10@example.com):

```bash
npm run seed:users
```

Todos con contraseña: `password123`

### Otros comandos útiles

```bash
# Ver logs
npm run docker:logs

# Detener contenedores
npm run docker:down

# Limpiar todo (contenedores, volúmenes, imágenes)
npm run docker:clean
```

---

## ✨ Funcionalidades Desarrolladas

### 🔐 Autenticación

- ✅ Registro de usuarios con validación
- ✅ Login con JWT
- ✅ Protección de rutas con guards
- ✅ Hash de contraseñas con bcrypt
- ✅ Tokens JWT con expiración de 7 días

### 👤 Gestión de Usuarios

- ✅ Obtener perfil del usuario autenticado
- ✅ Información del usuario actual
- ✅ Validación de sesión

### 📋 Gestión de Tareas

- ✅ Crear tareas (título, descripción, estado)
- ✅ Listar tareas del usuario
- ✅ Obtener tarea por ID
- ✅ Actualizar tareas
- ✅ Marcar como completada/pendiente (toggle)
- ✅ Eliminar tareas
- ✅ Estadísticas (total, completadas, pendientes)
- ✅ Validación de propiedad (cada usuario ve solo sus tareas)

### 🛡️ Seguridad

- ✅ Validación de datos con Joi
- ✅ Autenticación JWT obligatoria
- ✅ Validación de propiedad de recursos
- ✅ Protección contra inyección SQL (TypeORM)
- ✅ CORS habilitado
- ✅ Sanitización de respuestas (sin contraseñas)

### 📚 Documentación

- ✅ Swagger UI interactivo
- ✅ Endpoints documentados con ejemplos
- ✅ Schemas de validación visibles
- ✅ Autenticación Bearer en Swagger

### 🔍 Logging y Monitoreo

- ✅ Logger HTTP personalizado
- ✅ Logs de requests y responses
- ✅ Tiempo de respuesta
- ✅ Status codes y errores

### 🐳 DevOps

- ✅ Dockerfile multi-stage optimizado
- ✅ Docker Compose para desarrollo
- ✅ Scripts SQL automatizados
- ✅ Health checks
- ✅ Variables de entorno
- ✅ Volúmenes persistentes para PostgreSQL

---

## 📡 Endpoints API

### Autenticación

- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Usuarios

- `GET /api/users/profile` - Obtener perfil (protegido)
- `GET /api/users/me` - Información del usuario (protegido)

### Tareas

- `GET /api/tasks` - Listar tareas (protegido)
- `POST /api/tasks` - Crear tarea (protegido)
- `GET /api/tasks/:id` - Obtener tarea (protegido)
- `PUT /api/tasks/:id` - Actualizar tarea (protegido)
- `PATCH /api/tasks/:id/toggle` - Toggle completada (protegido)
- `DELETE /api/tasks/:id` - Eliminar tarea (protegido)
- `GET /api/tasks/stats` - Estadísticas (protegido)

### Utilidad

- `GET /api` - Health check
- `GET /api/health` - Estado del servicio
- `GET /api/docs` - Documentación Swagger

---

## 🏗️ Arquitectura

```
src/
├── _db/                    # Configuración de base de datos
├── common/                 # Código reutilizable
│   ├── decorators/        # Decorators personalizados (@GetUser)
│   ├── guards/            # Guards de autenticación
│   ├── interceptors/      # Logger HTTP
│   └── pipes/             # Validación con Joi
├── modules/
│   ├── auth/              # Autenticación y JWT
│   ├── users/             # Gestión de usuarios
│   └── tasks/             # Gestión de tareas
└── main.ts                # Entry point
```

---

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Server
PORT=3000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=task_manager

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

---

## 🧪 Testing

### Tests E2E (End-to-End)

```bash
npm run test:e2e
```

**71 tests - 100% passing** ✅

**Tests implementados:**

- ✅ Auth endpoints (register, login) - 16 tests
- ✅ Users endpoints (profile, me) - 15 tests
- ✅ Tasks endpoints (CRUD completo) - 29 tests
- ✅ Validaciones y seguridad
- ✅ Ownership de recursos
- ✅ Error handling

### Tests Unitarios

```bash
npm test
```

**Tests de servicios:**

- ✅ AuthService - 19 tests
- ✅ TasksService - 26 tests

---

## 📦 Base de Datos

### Schema

- **users**: Usuarios del sistema
  - id (UUID)
  - email (único)
  - password (hasheado)
  - name
  - createdAt, updatedAt

- **tasks**: Tareas de usuarios
  - id (UUID)
  - title
  - description (opcional)
  - completed (boolean)
  - userId (FK a users)
  - createdAt, updatedAt

### Seed Data

El proyecto incluye datos de prueba iniciales:

- 1 usuario demo: `demo@example.com` / `password123`
- 9 tareas de ejemplo

**Generar más usuarios de prueba:**

```bash
npm run seed:users
```

Este comando crea 10 usuarios adicionales (user1@example.com a user10@example.com) con contraseña `password123`

---

## 🐳 Docker

### Servicios

| Servicio     | Puerto | Descripción   |
| ------------ | ------ | ------------- |
| **backend**  | 3000   | API NestJS    |
| **postgres** | 5432   | Base de datos |

### Comandos Docker

```bash
# Levantar todo
npm run docker

# Solo levantar (sin rebuild)
npm run docker:up

# Ver logs en tiempo real
npm run docker:logs

# Detener servicios
npm run docker:down

# Limpiar todo (incluye volúmenes)
npm run docker:clean

# Rebuild completo
npm run docker:rebuild
```

---

## 🚀 Desarrollo

### Sin Docker

```bash
# Instalar dependencias
npm install

# Modo desarrollo (hot reload)
npm run start:dev

# Build para producción
npm run build

# Iniciar producción
npm run start:prod
```

### Linting y Formato

```bash
# Lint
npm run lint

# Format
npm run format
```
