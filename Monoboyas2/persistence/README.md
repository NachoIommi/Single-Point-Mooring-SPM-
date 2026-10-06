# Capa de Persistencia — SPM Monorepo

## Archivos entregados

```
prisma/
└── schema.prisma              # Schema Prisma completo (enums + 8 modelos)

lib/
├── prisma.ts                  # Singleton PrismaClient (safe para Next.js hot-reload)
└── repositories/
    ├── index.ts               # Barrel export
    ├── MedicionRepository.ts  # Implementa IMedicionRepository
    ├── AlertaRepository.ts    # Implementa IAlertaRepository
    ├── OperacionRepository.ts # Implementa IOperacionRepository
    ├── UsuarioAlertaRepository.ts  # Implementa IUsuarioAlertaRepository
    └── SensorRepository.ts    # DAO extra: reconstruye Sensor[] con construirSensor()
```

## Ubicación en el monorepo

Estos archivos van en la raíz del proyecto Next.js:

```
<monorepo-root>/
├── prisma/schema.prisma
├── lib/prisma.ts
├── lib/repositories/...
└── domain/...   ← ya existía (domain-layer.zip)
```

## Setup inicial

```bash
# 1. Instalar Prisma
npm install prisma @prisma/client

# 2. Agregar DATABASE_URL en .env.local
echo 'DATABASE_URL="postgresql://..."' >> .env.local

# 3. Generar el cliente Prisma
npx prisma generate

# 4a. Si la BD Neon ya tiene tablas (esquema viejo):
npx prisma db pull          # introspección para verificar diferencias
npx prisma migrate dev      # aplica las diferencias como migración

# 4b. Si la BD está vacía:
npx prisma migrate dev --name init
```

## Advertencia: estados de operación

Si la BD Neon tiene filas con el esquema **viejo de 5 estados**
(`PREPARADA`, `ACTIVA`, `PAUSADA` además de `PLANIFICADA`/`FINALIZADA`),
hay que correr una migración de datos antes de aplicar el schema:

```sql
-- Ejemplo de migración de datos (ajustar según lo que haya en Neon)
UPDATE operacion SET estado = 'PLANIFICADA' WHERE estado = 'PREPARADA';
UPDATE operacion SET estado = 'ENCURSO'     WHERE estado = 'ACTIVA';
UPDATE operacion SET estado = 'DETENIDA'    WHERE estado = 'PAUSADA';
```

## Cómo usar los repositorios

```typescript
import {
  MedicionRepository,
  AlertaRepository,
  OperacionRepository,
  UsuarioAlertaRepository,
  SensorRepository,
} from "@/lib/repositories";

// Inyectar en CentralDatos (dominio):
const centralDatos = new CentralDatos(
  new MedicionRepository(),
  new AlertaRepository(),
  new UsuarioAlertaRepository(),
);

// Leer sensores de una monoboya para reconstruirla:
const sensorRepo = new SensorRepository();
const sensores = await sensorRepo.obtenerPorMonoboya(monoboyaId);
```
