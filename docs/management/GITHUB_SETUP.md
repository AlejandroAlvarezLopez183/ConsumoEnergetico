# Configuración recomendada de GitHub

## Proyecto (GitHub Projects)

Crea un Project llamado `SNRGY — Desarrollo` con estas columnas/estados:

1. `Backlog`
2. `Ready`
3. `In Progress`
4. `In Review`
5. `Blocked`
6. `Done`

Limita `In Progress` a una tarea por colaborador. No arrastrar tareas a `Done` hasta cumplir la Definition of Done.

## Etiquetas

Crea como mínimo:

- Prioridad: `P0`, `P1`, `P2`.
- Tipo: `type: bug`, `type: task`, `type: feature`, `type: security`, `type: documentation`.
- Área: `area: frontend`, `area: auth`, `area: data`, `area: security`, `area: devex`, `area: ops`.

No uses etiquetas para representar todo el estado si el Project ya tiene una columna de status.

## Milestones

- `M0 — Control y línea base`
- `M1 — Seguridad y flujos esenciales`
- `M2 — Calidad de datos`
- `M3 — Operación de datos recurrentes`
- `M4 — Mantenibilidad`

## Ramas y PR

- `feat/<issue>-<slug>` para funcionalidades.
- `fix/<issue>-<slug>` para defectos.
- `docs/<issue>-<slug>` para documentación.
- `chore/<issue>-<slug>` para herramientas y mantenimiento.

Cada PR debe enlazar a un issue, describir los cambios, adjuntar pruebas y declarar riesgos. Proteger `main` para exigir PR aprobado y chequeos de CI cuando GitHub permita esa configuración.

## Tamaño de PR

Preferir un solo propósito y cambios pequeños. Como guía, evitar PR de muchos archivos o cientos de líneas sin necesidad clara. El HTML del panel admin es grande y antiguo: no es motivo para hacer una reescritura completa en un solo PR.
