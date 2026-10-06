# SPM — Handoff: Migración Monorepo (Capa de Dominio completada)

> Documento de contexto para que un agente de IA continúe este trabajo en otro chat
> sin perder información. Leer completo antes de tocar código.

---

## 1. Qué es este proyecto

**SPM (Sistema de Monitoreo de Operaciones en Monoboya)** es un proyecto académico
(UNS Bahía Blanca, Grupo 15) que modela un sistema de **soporte a la decisión** —no
control físico— para operaciones de transferencia de hidrocarburos en una monoboya
(Single Point Mooring).

### Reglas de alcance que SIEMPRE deben respetarse

- El sistema **NO ejecuta acciones físicas** (no abre válvulas, no detiene operaciones
  por sí mismo). Solo monitorea, analiza y genera alertas para que humanos actúen.
- Actores: **Usuario de Planta** (admin/config), **Personal de Buque**, **Operador de
  Lancha**. No inventar actores nuevos.
- Una monoboya **no carga ni descarga**: es intermediaria entre Buque y Planta.
- Niveles de alerta: **Verde / Amarillo / Rojo**.
- No introducir tecnologías no justificadas. Priorizar claridad conceptual.

### Objetivo de la tarea en curso

El proyecto estaba fragmentado en dos repos:
- **Backend**: Java + Spring Boot + JdbcTemplate (DAOs manuales, sin JPA) + PostgreSQL
  en Neon.
- **Frontend**: Next.js + TypeScript.

**Meta**: unificar todo en un **monorepo fullstack** (Next.js + TypeScript) e integrar
Neon vía **Prisma ORM**, migrando la lógica de dominio Java a TypeScript.

### Reglas estrictas de refactorización (dadas por el usuario, innegociables)

1. **Conservar la lógica de negocio (Core) EXACTAMENTE como está** en el backend Java
   actual. No reinventar reglas.
2. **Ignorar la capa de red antigua** (Controllers/Services HTTP de Spring). Solo
   importa la lógica pura de dominio.
3. **Frontend intacto visualmente.** Solo cambia el wiring de datos (fetching), nunca
   componentes UI ni estilos.
4. **CERO decisiones automáticas en ambigüedades.** Si hay más de una forma válida de
   implementar algo, el agente debe presentar opciones con pros/contras y dejar que el
   usuario elija. **No asumir.**

### Arquitectura de referencia (capas, de arriba hacia abajo)

```
CAPA API        → Controllers/Routers Next.js. Traducen HTTP ↔ objetos de dominio.
                  Deserializar request, llamar al dominio, serializar response.
                  CERO lógica de negocio acá.
                        │ llama a
CAPA DE DOMINIO → Administrador, Planta, OperadorLancha, OperadorBuque, CentralDatos,
                  Operacion. Toda la lógica de negocio vive acá. YA IMPLEMENTADA
                  (ver sección 2).
                        │ delega persistencia a
CAPA DE PERSISTENCIA → DAOs/Prisma. CRUD puro, sin lógica de negocio. Accedidos
                  SOLO por CentralDatos/Services vía interfaces (puertos). NO
                  IMPLEMENTADA TODAVÍA (ver sección 3).
```

El repo Java de referencia es `FranciscoUyua/ProyectoMonoBoyas` (ramas `main` y
`VersionVigia`). Los documentos del proyecto (ADRs, casos de uso, ER, OpenAPI) están
en project knowledge.

---

## 2. Qué se implementó (capa de dominio — COMPLETA)

Entregada como `domain-layer.zip`, 18 archivos TypeScript, ~1385 líneas, **cero
dependencias de framework** (no Next.js, no Prisma, no Express — TypeScript puro).

### Estructura de carpetas

```
domain/
├── types/
│   ├── enums.ts          # 6 enums: EstadoOperacion, EstadoMonoboya, TipoSensor,
│   │                       OrigenMedicion, TipoAlerta, RolUsuario
│   └── interfaces.ts     # Puertos: ISensorDataProvider, IPublisher, ISubscriber,
│                            IMedicionRepository, IAlertaRepository,
│                            IOperacionRepository, IUsuarioAlertaRepository,
│                            + DTOs (OperacionInfo, AlertaInfo, TelemetriaResultado)
├── entities/
│   ├── Medicion.ts        # Value object inmutable
│   ├── Alerta.ts          # Entidad de alerta (sin lógica de reconocimiento)
│   ├── Sensor.ts          # Clase abstracta + 8 subclases + factory construirSensor()
│   ├── Usuario.ts         # Abstracta base. getOperacion() = null por defecto
│   ├── UsuarioOperador.ts # Abstracta intermedia (alertasRecibidas, operacion)
│   ├── OperadorBuque.ts
│   ├── OperadorLancha.ts
│   ├── OperadorPlanta.ts
│   ├── Administrador.ts   # planificarOperacion()
│   ├── Operacion.ts        # ENTIDAD CENTRAL — máquina de estados + reglas
│   ├── Monoboya.ts         # Hub de sensores, recolectarYTransmitirDatos()
│   ├── Buque.ts            # Sensor de presión propio, descontarCapacidad()
│   ├── Planta.ts           # Orquesta recibirSolicitudTransferencia()
│   └── CentralDatos.ts     # Cerebro analítico: procesarTelemetria() + 8 umbrales
├── messaging/
│   ├── BrokerMQTT.ts            # Pub/sub in-memory (emula MQTT, no lo implementa)
│   └── CentralDatosSubscriber.ts # Puente Broker → CentralDatos
└── index.ts                # Barrel export de todo lo anterior
```

### Decisiones de diseño YA TOMADAS por el usuario (no volver a preguntar)

Estas 5 decisiones fueron consultadas explícitamente y resueltas. **Ya están
implementadas en el código entregado:**

1. **Persistencia en paralelo a memoria**: todo lo que el dominio hace in-memory debe
   reflejarse también en BD. El flujo unificado usa la BD como fuente de verdad; el
   estado in-memory (`operacionesActivas` en `CentralDatos`) es un cache para el
   scheduler, no la fuente canónica.

2. **El `while` loop bloqueante de `Operacion.iniciarOperacion()` (Java) fue
   DESCARTADO.** No migrar esa lógica de simulación síncrona. En su lugar: habrá un
   **scheduler** (pendiente de implementar, ver sección 3) que cada 0.5–1 segundo
   itera las operaciones activas y llama a `monoboya.recolectarYTransmitirDatos()` y
   `buque.recolectarYTransmitirDatos()` por separado, de forma asíncrona/no bloqueante.

3. **El descuento de capacidad del buque (`descontarCapacidad`) se movió a
   `Operacion`.** Antes vivía en `Monoboya.recolectarYTransmitirDatos()` (acoplamiento
   indebido: lógica de negocio de transferencia mezclada con recolección de sensores).
   Ahora es `Operacion.descontarCapacidadBuque(litros)`, y `Monoboya` ya no conoce
   nada sobre caudal ni capacidad.

4. **`Planta` sigue orquestando la preparación de operación, pero recibe los
   operadores YA RESUELTOS como parámetros.** `Planta.recibirSolicitudTransferencia()`
   NO consulta ningún repositorio/DAO — solo asigna piezas de dominio ya armadas. La
   resolución de "qué operador está disponible" es responsabilidad de la futura capa
   de servicio (Sección 3), no del dominio.

5. **Estados de operación unificados a 4, con estos nombres exactos:**
   `PLANIFICADA, ENCURSO, DETENIDA, FINALIZADA`. Esto resuelve la discrepancia que
   había en Java entre el enum `TipoOperacion` (4 valores, nombres distintos) y los
   Strings usados en `OperacionService` (5 valores: PLANIFICADA/PREPARADA/ACTIVA/
   PAUSADA/FINALIZADA). **La versión correcta y única es la de 4 estados.** Cualquier
   parte nueva del sistema (servicios, API, frontend) debe usar
   `EstadoOperacion` de `domain/types/enums.ts`, nunca strings sueltos ni el esquema
   de 5 estados de Java.

### Detalle por archivo — qué hace y qué reglas de negocio contiene

**`Operacion.ts`** (entidad central, 174 líneas):
- Máquina de estados con guardas explícitas: `iniciar()` (PLANIFICADA→ENCURSO, valida
  buque y monoboya asignados), `detener()` (ENCURSO→DETENIDA), `reanudar()`
  (DETENIDA→ENCURSO), `finalizar()` (ENCURSO|DETENIDA→FINALIZADA, bloquea si ya está
  FINALIZADA).
- `descontarCapacidadBuque(litros)` — regla de negocio migrada desde Monoboya.
- `enviarAlertaOperadorBuque/Lancha/Planta(alerta)` — distribución a los 3 roles.
- Referencias a: monoboya, buque, planta, operadorBuque, operadorLancha,
  operadorPlanta.

**`CentralDatos.ts`** (cerebro analítico, 371 líneas — el archivo más grande):
- `procesarTelemetria(medicion)`: pipeline completo — persiste medición → evalúa
  umbrales según `TipoSensor` → si hay anomalía, genera **3 alertas** (una por rol,
  mismo nivel de severidad) → persiste cada alerta → registra recepción per-user en
  `usuario_alerta`.
- **8 métodos de verificación de umbral**, uno por tipo de sensor, con las MISMAS
  constantes numéricas que el Java original: AMARRE (700/900 kN), TENSION (8.0/12.0
  tf), PRESION (umbral alto 1.4M/1.6M Pa, bajo 50k Pa — caso especial con 3 ramas),
  OLEAJE (2.5/3.5 m), ORIENTACION (15°/25°), CORRIENTE (1.5/2.2 m/s), CAUDAL (solo
  amarilla, 1600 l/s), VIENTO (55/75 km/h).
- `iniciarOperacion()` / `finalizarOperacion()` — gestionan el Map in-memory
  `operacionesActivas` (cache para el scheduler).
- Depende de 4 interfaces inyectadas por constructor (no de Prisma directamente):
  `IMedicionRepository`, `IAlertaRepository`, `IOperacionRepository`,
  `IUsuarioAlertaRepository`. **Esto es a propósito** — permite testear el dominio sin
  levantar BD, y la capa de Prisma simplemente implementa estas interfaces.

**`Planta.ts`**: capacidad fija de 3 monoboyas, `obtenerMonoboyaDisponible()` busca por
estado `DISPONIBLE`, `recibirSolicitudTransferencia(operacion, operadorLancha,
operadorPlanta)` asigna todo y delega a `centralDatos.iniciarOperacion()`.

**`Monoboya.ts`**: array fijo de sensores, `recolectarYTransmitirDatos()` itera cada
sensor, pide `actualizarDato()`, construye `Medicion` y publica al broker. Ya NO
descuenta capacidad de nadie.

**`Buque.ts`**: tiene su propio `transmisorPresion` (un sensor), publica igual que
Monoboya. `descontarCapacidad(litros)` resta de `capacidadRestante`; quien LLAMA a
este método ahora es `Operacion`, no Monoboya.

**`Sensor.ts`**: clase abstracta + 8 subclases concretas (`SensorDePresion`,
`SensorDeAmarre`, `SensorDeOleaje`, `SensorDeTension`, `Anemometro`, `Correntometro`,
`Caudalimetro`, `Giroscopio`), cada una fija su `TipoSensor` y unidad. Factory
`construirSensor(id, tipo, dataProvider)` reconstruye el sensor correcto desde un
string de tipo — usado por la futura capa de persistencia (equivalente a
`SensorDAO.construirSensor()` en Java).

**`Usuario.ts` / `UsuarioOperador.ts`**: jerarquía abstracta. `Usuario.getOperacion()`
devuelve `null` por defecto; `UsuarioOperador` lo sobreescribe devolviendo su
`operacion` asignada. **Esto existe específicamente para filtrar operadores
disponibles sin `instanceof` ni casting** (preferencia explícita del usuario,
establecida en chats anteriores — ver sección 5).

**`BrokerMQTT.ts` / `CentralDatosSubscriber.ts`**: emulación in-memory de pub/sub.
**No es MQTT real** — fue una decisión de diseño documentada en los ADRs del proyecto
(correr en una sola JVM/proceso hace innecesario un broker externo). Si en el futuro
se requiere MQTT real, solo se reemplaza esta clase sin tocar Monoboya ni
CentralDatos.

### Barrel export

`domain/index.ts` reexporta todo. Importar con:
```ts
import { CentralDatos, Operacion, EstadoOperacion, type IMedicionRepository } from "@/domain";
```

---

## 3. Qué falta implementar (en orden recomendado)

### 3.1 Capa de persistencia (Prisma) — SIGUIENTE PASO INMEDIATO

No implementada todavía. Debe:

- Definir el `schema.prisma` contra la BD Neon existente (hay un diagrama ER en
  project knowledge: `diagrama_ER.jpeg`, y un `api-monoboyas.yaml` con los schemas
  HTTP — **atención**: ese YAML tiene inconsistencias señaladas en
  `Grupo_15_Entrega_4.pdf` que NO deben replicarse, ej. `Sensor.buqueNroIMO` y
  `Usuario.operacionId` están mal modelados ahí).
- Implementar las 4 interfaces de `domain/types/interfaces.ts`:
  `IMedicionRepository`, `IAlertaRepository`, `IOperacionRepository`,
  `IUsuarioAlertaRepository`. Cada implementación traduce entre las entidades de
  dominio y los modelos de Prisma.
- Implementar un repositorio para reconstruir sensores (`SensorDAO` equivalente) que
  use `construirSensor()` de `domain/entities/Sensor.ts`.
- **REGLA**: ningún repositorio Prisma debe contener lógica de negocio — solo
  CRUD/mapeo. La lógica vive exclusivamente en `domain/`.
- Antes de implementar, **preguntar al usuario sobre ambigüedades** (regla 4 de la
  sección 1) — por ejemplo, cómo mapear el `TipoOperacion`/`EstadoOperacion` de 4
  valores a la columna `estado` existente en Neon, que podría tener datos con el
  esquema viejo de 5 valores.

### 3.2 Scheduler de telemetría

Reemplaza el `while` loop bloqueante descartado. Debe:
- Ejecutarse cada 0.5–1 segundo (decisión pendiente de confirmar con el usuario:
  ¿0.5s o 1s? En `Descripcion_Pipeline_Datos.docx` se menciona "cada un segundo, 8
  mensajes por segundo por operación").
- Iterar `centralDatos.obtenerOperacionesActivas()`.
- Por cada operación activa, llamar `monoboya.recolectarYTransmitirDatos()` Y
  `buque.recolectarYTransmitirDatos()` (independientes, ambos publican al broker).
- Vivir en la capa de API/infraestructura de Next.js (ej. un route handler con cron,
  o un proceso background — **esto es una decisión arquitectónica de Next.js que
  todavía no se tomó y debe presentarse con opciones al usuario**, ya que Next.js no
  tiene un equivalente directo a un `@Scheduled` de Spring).

### 3.3 Capa de servicio (entre API y dominio)

Equivalente al `OperacionService` de Java, pero **limpio** (el Java original mezclaba
varias responsabilidades). Debe:
- Resolver operadores disponibles consultando repositorios (esto es lo que `Planta`
  ya NO hace — ver decisión #4 de la sección 2).
- Orquestar las transiciones: planificar → preparar (asignar monoboya/operadores) →
  iniciar → detener/reanudar → finalizar, llamando a los métodos de dominio
  correspondientes (`Operacion.iniciar()`, etc.) y persistiendo el resultado.
- **No implementar todavía** — falta definir junto con el usuario si esta capa vive
  en route handlers directamente o en una carpeta `services/` separada.

### 3.4 Capa API (Next.js routes/controllers)

Traduce HTTP ↔ dominio. Cero lógica. No implementada. Requiere:
- Decidir convención de Next.js (App Router route handlers vs. Pages API routes —
  **preguntar al usuario**, no asumir).
- Endpoints mínimos esperados según `api-monoboyas.yaml`: operaciones (CRUD +
  transiciones), mediciones (ingesta), alertas (listar, reconocer por usuario).
- **Atención al endpoint `/alertas/{id}/reconocer`**: el YAML lo describe con estado
  global y un 409 "ya fue reconocida". La memoria del proyecto indica que esto **nunca
  se implementó así** — el reconocimiento real es per-user (`usuario_alerta.reconocida`).
  Hay que decidir con el usuario si se corrige el YAML o si el frontend ya asume el
  contrato viejo (este YAML es del equipo, no de Juanma — coordinar).

### 3.5 Wiring del frontend Next.js existente

- El frontend YA EXISTE y debe mantenerse **idéntico visualmente**. Solo se cambia
  cómo obtiene los datos (fetch/data layer) para hablar con los nuevos endpoints
  unificados.
- Falta: inventariar qué llamadas hace hoy el frontend (a qué backend, con qué
  contratos) antes de tocar nada — no se ha hecho este inventario todavía en esta
  conversación.

### 3.6 Pendientes de dominio que NO bloquean lo anterior pero quedan abiertos

Heredados de memoria de conversaciones previas sobre el backend Java (puede que ya no
apliquen 1:1 tras la migración a TS, pero hay que revisarlos):
- Monoboya 501 tenía solo 1 sensor de 8 esperados (problema de datos en Neon, no de
  código).
- `generarValorSimulado()` (lógica de simulación de sensores) no tenía casos para
  TENSION y ORIENTACION — si se porta algún simulador de datos a TS, agregar esos
  casos.
- ADR pendiente de escribir documentando la decisión JPA → JdbcTemplate (ahora sería
  Java/JdbcTemplate → TypeScript/Prisma — ADR nuevo a escribir).
- CRUD de entidades secundarias (Usuarios, Plantas, Buques, Sensores) nunca se
  implementó ni en Java ni acá.

---

## 4. Inconsistencias que YA NO aplican (resueltas, no volver a tocar)

Estas 5 tensiones fueron identificadas al inventariar el Java original y **ya están
resueltas** en el código TS entregado (ver sección 2 para el detalle de cada una):

1. ~~Flujo dual (dominio en memoria vs. OperacionService HTTP)~~ → unificado: BD es
   fuente de verdad, dominio in-memory es cache.
2. ~~While loop bloqueante en Operacion~~ → descartado, reemplazado por scheduler
   (pendiente de implementar, no de decidir).
3. ~~Descuento de capacidad en Monoboya~~ → movido a Operacion.
4. ~~Planta acoplada a UsuarioDAO~~ → Planta recibe operadores resueltos.
5. ~~Nombres de estado inconsistentes~~ → 4 estados canónicos:
   PLANIFICADA/ENCURSO/DETENIDA/FINALIZADA.

---

## 5. Preferencias y restricciones del usuario (Juanma) a respetar siempre

- **Evitar `instanceof` y casting** — usar polimorfismo (de ahí el patrón
  `getOperacion() === null` en `Usuario`/`UsuarioOperador`).
- **CERO decisiones automáticas en ambigüedades** — siempre presentar opciones con
  pros/contras y esperar elección explícita. Esto es una regla dura para este
  proyecto, no una preferencia general.
- **Targeted diffs sobre full file replacements** cuando se trabaje sobre archivos
  existentes (no aplica todavía porque la capa de dominio se creó desde cero, pero
  aplicará en capas siguientes que toquen código existente del frontend).
- **Diseño primero, implementación después.** Decisiones arquitectónicas se
  establecen conceptualmente antes de escribir código.
- **Explicaciones paso a paso**, con conceptos ya explicados retomados para reforzar
  (preferencia de aprendizaje declarada).
- Solo patrones de las slides del curso son válidos como referencia arquitectónica
  (hexagonal architecture fue descartada explícitamente por esto en el proyecto Java
  original — no proponerla).

---

## 6. Archivos entregados hasta ahora

- `domain-layer.zip` — los 18 archivos de la sección 2, descargable y ya entregado al
  usuario.

## 7. Próxima pregunta a hacer al usuario al continuar

Antes de avanzar a la capa de persistencia, preguntar:
1. ¿El `schema.prisma` se escribe desde cero reflejando el dominio TS, o se debe
   respetar el esquema de columnas que ya existe en Neon (y por ende quizás requiere
   una migración de datos para el cambio de 5→4 estados de operación)?
2. ¿Preferencia sobre dónde vive el scheduler en Next.js (App Router route + cron
   externo, un proceso Node separado, etc.)?
3. ¿App Router o Pages Router para la capa API?
