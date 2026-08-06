# Plataforma de psicología escolar — Colegio Lord Byron (byron.edu.pe)

Contexto consolidado de la plataforma web para el área de psicología del colegio. Este documento resume todas las decisiones tomadas para poder arrancar el desarrollo directamente, sin tener que re-derivar los requerimientos.

## 1. Objetivo

Sistema de gestión de casos, incidencias y citas para el área de psicología escolar. Reemplaza el manejo manual/disperso actual, centraliza el historial de cada alumno por año lectivo, y deja trazabilidad de reuniones con padres (con firma).

## 2. Stack técnico

- **Frontend + Backend**: Next.js (React), un solo proyecto con API routes. Hosting gratis en Vercel.
- **Base de datos**: PostgreSQL vía Supabase (tier free).
- **Autenticación**: Supabase Auth con **Google OAuth único** para los 4 roles, restringido al dominio del colegio (`@byron.edu.pe`). El rol de cada usuario se asigna internamente desde el módulo de administración, no desde Google.
- **Autorización**: Row Level Security (RLS) en PostgreSQL — ver sección 6.
- **Storage**: Supabase Storage, para evidencias adjuntas en incidencias.
- **UI**: Tailwind CSS + shadcn/ui.
- **Gráficos**: Recharts o Chart.js (para los dashboards).
- **Firma en pantalla**: librería `signature_pad` (canvas HTML5) — trazo simple, sin certificado digital, con nombre + fecha/hora.
- **Notificaciones**: in-app (tabla `notificaciones` + bandeja en la UI). Sin proveedor de email de pago por ahora.
- **Restricción**: presupuesto muy limitado — priorizar todo lo que sea gratuito/tier free.

## 3. Roles

1. **Profesor** — reporta incidencias y hace seguimiento pasivo de las suyas.
2. **Psicólogo** — atiende casos e incidencias, gestiona fichas de alumnos de su nivel/grado, registra actas de reunión con padres.
3. **Jefe de psicólogos** — hace todo lo que hace un psicólogo (atiende sus propios casos) + supervisa a todo el equipo y deriva casos cuando el psicólogo titular no está disponible.
4. **Administrador** — gestiona usuarios, alumnos, estructura académica y catálogos del sistema.

Hay **1 jefe de psicólogos y 4 psicólogos**. Cada psicólogo cubre un nivel/grado específico (relación psicólogo↔grado). Por defecto cada alumno tiene un psicólogo asignado automáticamente según su grado; el jefe solo interviene para derivar el caso a otro psicólogo cuando el titular no está disponible.

## 4. Flujos principales

### 4.1 Origen y asignación de un caso

1. **Caso 1**: el profesor reporta una incidencia sobre un alumno.
2. **Caso 2**: el psicólogo abre un caso directo, sin incidencia previa.
3. Ambos casos quedan **registrados y vinculados al alumno**.
4. **Asignación automática**: el sistema asigna el caso al psicólogo que cubre el nivel/grado del alumno.
5. **Verificación de disponibilidad**: si el psicólogo titular no está disponible, el **jefe de psicólogos deriva el caso** a otro psicólogo disponible (se guarda `psicologo_original_id` y `psicologo_actual_id` para trazabilidad).
6. El psicólogo asignado **da seguimiento** al caso, registrando notas cronológicas.
7. El caso se **cierra**.
8. Se **notifica al profesor** (si el caso vino de una incidencia) y el caso queda guardado en la **ficha del alumno**.

Notificaciones cruzadas:
- El **profesor** es notificado cuando cambia el estado de una incidencia que él reportó.
- El **psicólogo** es notificado cuando se registra una nueva incidencia que le corresponde atender.

### 4.2 Reunión con padres

- La **cita se agenda en SIANET** (sistema académico existente del colegio), no en esta plataforma.
- La plataforma registra el **acta de la reunión**, con:
  - Detalle/descripción de la reunión (contexto, motivo).
  - Observaciones del psicólogo.
  - Observaciones del padre de familia.
  - Acuerdos y compromisos del psicólogo.
  - Compromisos del padre de familia.
  - **Firma en pantalla** (trazo) del psicólogo y del padre/madre, con nombre y fecha/hora — sin necesidad de certificado digital.
- El acta firmada queda colgada en la **ficha del alumno**.

### 4.3 Ficha del alumno

- Contiene el historial completo del alumno: incidencias, casos y actas de reunión.
- **Organizado por año lectivo** (selector de año), ya que el historial se conserva año tras año.
- Un alumno no pertenece de forma fija a un grado: tiene un **historial de matrícula por año académico** (grado y sección pueden cambiar cada año, vía migración de grado).

## 5. Reglas de acceso por rol

| Regla | Detalle |
|---|---|
| Profesor | Solo ve el estado de las incidencias que **él mismo reportó**. Una vez enviada, la incidencia **queda fija** (no la puede editar ni comentar después). Sin acceso a la ficha del alumno ni a notas clínicas. |
| Psicólogo | Ve casos/incidencias asignados a él. Puede ver la **ficha de cualquier alumno de su nivel/grado**, tenga o no un caso abierto con él. |
| Jefe de psicólogos | Todo lo del psicólogo (atiende sus propios casos) + ve **todas** las incidencias/casos del colegio + puede **derivar/reasignar** un caso cuando el titular no está disponible. |
| Administrador | Gestión de datos, sin restricción por grado. Requiere `service_role` de Supabase (server-side), no expuesto al cliente. |

## 6. Modelo de datos

### 6.1 Estructura académica y usuarios

```
USUARIOS { uuid id PK, string nombre, string email, string rol, boolean activo }
ALUMNOS { uuid id PK, string nombres, string apellidos, string codigo }
ANIOS_ACADEMICOS { uuid id PK, int anio, boolean activo }
NIVELES { uuid id PK, string nombre }
GRADOS { uuid id PK, uuid nivel_id FK, string nombre }
SECCIONES { uuid id PK, uuid grado_id FK, string nombre }
MATRICULAS { uuid id PK, uuid alumno_id FK, uuid anio_academico_id FK, uuid grado_id FK, uuid seccion_id FK }
PSICOLOGO_GRADO { uuid id PK, uuid usuario_id FK, uuid grado_id FK }
```

Relaciones: `NIVELES 1—N GRADOS 1—N SECCIONES`; `GRADOS 1—N PSICOLOGO_GRADO N—1 USUARIOS`; `ALUMNOS 1—N MATRICULAS N—1 (ANIOS_ACADEMICOS, GRADOS, SECCIONES)`.

### 6.2 Incidencias, casos y citas

```
INCIDENCIAS { uuid id PK, uuid alumno_id FK, uuid profesor_id FK, string motivo, string prioridad,
              string descripcion, string acciones_tomadas, string involucrados, datetime fecha_hora, string estado }
EVIDENCIAS { uuid id PK, uuid incidencia_id FK, string archivo_url }
CASOS { uuid id PK, uuid alumno_id FK, uuid incidencia_id FK, uuid psicologo_id FK, uuid psicologo_original_id FK,
        string tipo, string estado, date fecha_apertura, date fecha_cierre }
NOTAS_SEGUIMIENTO { uuid id PK, uuid caso_id FK, uuid autor_id FK, datetime fecha, string contenido }
CITAS_PADRES { uuid id PK, uuid caso_id FK, uuid psicologo_id FK, date fecha, string hora, string detalle,
               string obs_psicologo, string obs_padre, string acuerdos_psicologo, string compromisos_padre }
FIRMAS { uuid id PK, uuid cita_id FK, string firmante_tipo, string firmante_nombre, datetime fecha_hora }
NOTIFICACIONES { uuid id PK, uuid usuario_id FK, string tipo, uuid referencia_id, boolean leido, datetime fecha }
```

Relaciones: `INCIDENCIAS —o| CASOS` (origina, opcional: el caso puede nacer directo); `CASOS 1—N NOTAS_SEGUIMIENTO`; `CASOS 1—N CITAS_PADRES 1—N FIRMAS`; `USUARIOS 1—N NOTIFICACIONES`.

Campo `tipo` en `CASOS`: distingue si nació de una incidencia (`caso_1`) o fue abierto directo por el psicólogo (`caso_2`).

### 6.3 Políticas RLS (Supabase / PostgreSQL)

```sql
-- Funciones auxiliares
create or replace function auth_rol() returns text as $$
  select rol from usuarios where id = auth.uid()
$$ language sql stable;

create or replace function auth_grados() returns setof uuid as $$
  select grado_id from psicologo_grado where usuario_id = auth.uid()
$$ language sql stable;

-- INCIDENCIAS
alter table incidencias enable row level security;

create policy "profesor ve sus incidencias" on incidencias
  for select using (auth_rol() = 'profesor' and profesor_id = auth.uid());

create policy "psicologo ve incidencias de su grado" on incidencias
  for select using (
    auth_rol() in ('psicologo','jefe_psicologia')
    and alumno_id in (
      select alumno_id from matriculas where grado_id in (select auth_grados())
    )
  );

create policy "jefe ve todas las incidencias" on incidencias
  for select using (auth_rol() = 'jefe_psicologia');

create policy "profesor crea incidencia" on incidencias
  for insert with check (auth_rol() = 'profesor' and profesor_id = auth.uid());
-- Sin policy de update para profesor: la incidencia queda fija tras enviarse.

-- CASOS
alter table casos enable row level security;

create policy "psicologo ve sus casos" on casos
  for select using (
    auth_rol() in ('psicologo','jefe_psicologia')
    and (psicologo_id = auth.uid() or auth_rol() = 'jefe_psicologia')
  );

create policy "psicologo abre o actualiza sus casos" on casos
  for all using (psicologo_id = auth.uid() or auth_rol() = 'jefe_psicologia')
  with check (psicologo_id = auth.uid() or auth_rol() = 'jefe_psicologia');

-- NOTAS DE SEGUIMIENTO
alter table notas_seguimiento enable row level security;

create policy "acceso a notas via caso" on notas_seguimiento
  for select using (
    caso_id in (
      select id from casos
      where psicologo_id = auth.uid() or auth_rol() = 'jefe_psicologia'
    )
  );

-- NOTIFICACIONES
alter table notificaciones enable row level security;

create policy "cada quien ve solo sus notificaciones" on notificaciones
  for select using (usuario_id = auth.uid());
```

Nota: el administrador opera con `service_role` key desde API routes server-side de Next.js, sin exponer ese acceso al cliente.

## 7. Pantallas por rol

### Profesor (5)
1. Login (Google)
2. Mis incidencias — lista con estado, filtro por fecha/alumno
3. Formulario: reportar incidencia
4. Detalle de incidencia (solo lectura)
5. Notificaciones

### Psicólogo (10)
1. Login (Google)
2. Dashboard — total de casos, en revisión, en atención, cerrados, gráfico por estado, tarjeta de últimos reportes
3. Mis casos e incidencias — filtrable por estado/prioridad
4. Detalle de caso
5. Formulario: nueva nota de seguimiento
6. Formulario: abrir caso directo (caso 2)
7. Alumnos de mi grado/nivel (con o sin caso abierto)
8. Ficha del alumno — historial por año lectivo
9. Formulario: registrar acta de reunión con padres + firma
10. Notificaciones

### Jefe de psicólogos (10 heredadas de psicólogo + 5 propias)
Hereda todas las de psicólogo (atiende sus propios casos), más:
11. Dashboard general del colegio (mismas métricas, agregando los 4 psicólogos)
12. Todas las incidencias y casos del colegio
13. Acción: derivar/reasignar caso
14. Reportes/estadísticas — carga por psicólogo, por grado, por mes, por prioridad

*(Nota: se descartó una pantalla de "disponibilidad del equipo" — no es necesaria.)*

### Administrador (8)
1. Login (Google)
2. Dashboard general — métricas del colegio
3. Gestión de usuarios — alta/edición/baja, asignación de roles
4. Gestión de alumnos — alta manual y masiva (Excel/CSV), edición
5. Gestión de años académicos — crear/cerrar año lectivo activo
6. Gestión de grados y secciones — estructura del colegio
7. Migración de grado — promoción masiva de alumnos al iniciar un año nuevo
8. Configuración psicólogo-por-grado y catálogos (motivos de incidencia, niveles de prioridad)

## 8. Detalle del formulario de incidencia

Campos: nivel → grado → sección → alumno (selección en cascada), motivo, **nivel de prioridad** (baja/media/alta), descripción, **acciones tomadas por el docente**, **personas involucradas** (opcional), **evidencia adjunta** (opcional, foto/documento). **Fecha y hora se registran automáticamente**, no las llena el profesor.

## 9. Detalle del acta de reunión con padres

Campos: fecha, hora, psicólogo, asistentes, detalle de la reunión, observaciones del psicólogo, observaciones del padre de familia, acuerdos y compromisos del psicólogo, compromisos del padre de familia, y **firmas** (trazo en pantalla) de psicólogo y padres con fecha/hora.

## 10. Siguientes pasos

1. Configurar proyecto Next.js + Supabase (Auth con Google, base de datos con el modelo de la sección 6).
2. Aplicar las políticas RLS.
3. Construir pantallas por rol, empezando por profesor (más simple) y avanzando a psicólogo y jefe.
4. Implementar el flujo de incidencias/casos con asignación automática y derivación.
5. Implementar citas y firma en pantalla.
6. Pruebas con datos reales del colegio antes de desplegar.
