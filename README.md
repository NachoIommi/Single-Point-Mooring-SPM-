# Proyecto Final - Arquitectura y Diseño de Sistemas 2026

## 📖 Descripción del Proyecto
Este repositorio contiene el diseño y la implementación de un sistema de software distribuido, desarrollado como trabajo práctico para la asignatura **Arquitectura y Diseño de Sistemas 2026**.

**Dominio del Sistema:** [Insertar aquí el dominio elegido, ej: Plataforma para reservas de actividades / Sistema de seguimiento de envíos / etc.]

**Objetivo:** Aplicar los conceptos teóricos de arquitectura de software, patrones de diseño, comunicación distribuida y procesamiento de datos en un entorno práctico y escalable.

---

## 🏗️ Arquitectura del Sistema

El sistema ha sido diseñado bajo una **arquitectura distribuida**, contemplando los siguientes enfoques y patrones:

*   **[Elegir el utilizado: Monolito Modular / Microservicios]**: [Breve justificación de por qué se eligió este patrón base].
*   **Arquitectura Orientada a Eventos (EDA)**: [Explicar brevemente qué parte del sistema se beneficia de los eventos].
*   **Patrones Adicionales**: [Agregar si aplica, ej: CQRS, BFF, API Gateway].

---

## 🚀 Tecnologías y Componentes (Requerimientos Obligatorios)

### 1. Comunicación entre Componentes
Para asegurar una correcta interacción entre los servicios, se implementaron los siguientes mecanismos:
*   **Síncrona:** Interacción a través de APIs REST para [mencionar caso de uso].
*   **Asíncrona:** Utilización de [Colas de mensajes / Eventos - ej: RabbitMQ, Kafka] para [mencionar caso de uso].

### 2. Persistencia de Datos
*   **Tipo de Base de Datos:** [Relacional (ej: PostgreSQL, MySQL) / NoSQL (ej: MongoDB, Cassandra)].
*   **Estrategia de Persistencia:** [Explicar brevemente el modelo de datos adoptado y justificar la elección].

### 3. Procesamiento de Datos
El sistema incluye un pipeline de procesamiento de datos que realiza las siguientes operaciones:
*   **Transformación:** [Ej: Transformación de archivos CSV a JSON, o parseo de Logs a Métricas].
*   **Agregación:** [Ej: Generación de promedios, reportes agrupados, dashboards].

### 4. Infraestructura y Despliegue
El sistema está preparado para ser desplegado en un entorno distribuido:
*   **Contenedores:** [Ej: Docker, Docker Compose].
*   **Estrategia de Despliegue:** Separación clara de servicios, gestión de configuración externalizada y diseño orientado a la escalabilidad potencial.

---

## 📅 Entregables y Estado del Proyecto

A continuación, se detalla el progreso de los artefactos requeridos por la cátedra:

- [ ] **Modelo de Dominio** (Entidades, relaciones, reglas de negocio) - *6 de abril*
- [ ] **Requerimientos Funcionales y No Funcionales** - *6 de abril*
- [ ] **Diagramas de Arquitectura (C4 Model)** - *27 de abril*
  - [ ] Diagrama de Contexto
  - [ ] Diagrama de Contenedores
  - [ ] Diagrama de Componentes
- [ ] **Modelo de Datos** - *18 de mayo*
- [ ] **Diseño de APIs** - *8 de junio*
- [ ] **Descripción del Pipeline de Datos** - *8 de junio*
- [ ] **Decisiones Arquitectónicas (ADRs)** - *8 de junio*
- [ ] **Estrategia de Despliegue** (Opcional) - *22 de junio*

---

## 🛠️ Instalación y Ejecución Local

*(Instrucciones para que los docentes o compañeros puedan levantar el proyecto localmente)*

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/tu-repositorio.git
   ```
2. Configurar las variables de entorno:
   ```bash
   cp .env.example .env
   ```
3. Levantar la infraestructura (Bases de datos, colas de mensajes) y los servicios:
   ```bash
   docker-compose up -d
   ```
4. [Agregar pasos adicionales si es necesario, como migraciones de BD o carga de datos semilla]

---

## 👥 Equipo de Trabajo

Este proyecto fue desarrollado por un grupo de 6 integrantes. Cada miembro tiene roles asignados que aseguran el correcto desarrollo del ciclo de vida del software, aunque la responsabilidad y conocimiento del sistema es compartida.

| Nombre | Rol Asignado |
| :--- | :--- |
| [Nombre Integrante 1] | [Ej: Arquitecto de Software / Backend] |
| [Nombre Integrante 2] | [Ej: DevOps / Backend] |
| [Nombre Integrante 3] | [Ej: Ingeniero de Datos] |
| [Nombre Integrante 4] | [Ej: Frontend / UX] |
| [Nombre Integrante 5] | [Ej: QA / Testing] |
| [Nombre Integrante 6] | [Ej: DBA / Backend] |

> **Nota:** Todos los integrantes del grupo están capacitados para explicar y justificar las decisiones arquitectónicas del sistema, tal como lo requiere el criterio de evaluación de la asignatura.
