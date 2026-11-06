# Acuerdo de trabajo — equipo con desarrollo asistido por IA

## Roles

### Responsable de producto (propietario)
- Define objetivo, orden de prioridades y alcance del MVP.
- Resuelve decisiones de producto y acepta/rechaza el resultado funcional.
- No tiene que revisar cada línea, pero sí los resultados, demos y criterios de aceptación.

### Integrador técnico / responsable de release
- Mantiene la arquitectura y el flujo de integración.
- Revisa los Pull Requests y evita conflictos entre ramas.
- Coordina las pruebas y la entrega a staging/producción.
- Si nadie puede revisar cambios de seguridad/RLS, se requiere una revisión técnica externa antes de desplegarlos.

### Colaborador/desarrollador
- Es responsable de una tarea pequeña, de sus pruebas y de explicar lo que cambió.
- No amplía el alcance por cuenta propia.
- No despliega cambios a producción ni manipula claves administrativas sin autorización.

Puede haber una persona en más de un rol, pero cada entrega debe tener un responsable claro.

## Reglas obligatorias para usar IA

1. Antes de programar, copiar en el issue el objetivo y los criterios de aceptación.
2. Pedir a la IA un plan breve y la lista de archivos que pretende cambiar antes de generar una refactorización amplia.
3. Limitar el cambio a los archivos necesarios para el issue.
4. No cambiar el framework, las librerías principales, la arquitectura, el esquema SQL, las reglas RLS o el sistema de autenticación sin aprobación previa.
5. No instalar dependencias nuevas sin justificar mantenimiento, seguridad y alternativas.
6. No pegar contraseñas, tokens, service role keys, datos reales de personas ni bases de datos en prompts de IA.
7. Revisar manualmente el diff. La IA puede inventar APIs, omitir validaciones o romper comportamientos existentes.
8. Ejecutar los chequeos indicados y adjuntar evidencia real; no afirmar que se probó algo que no se ejecutó.
9. El responsable de la tarea debe poder explicar: qué cambió, por qué, qué podría romperse y cómo revertirlo.
10. Si la IA sugiere una mejora no relacionada, anotarla como issue separado; no incluirla en el PR actual.

## Tamaño de tareas

- Una tarea debe tener un resultado observable y un solo responsable.
- Objetivo de duración: 2–6 horas; máximo normal de 1 día de trabajo.
- Si supera un día, partirla en tareas más pequeñas que puedan revisarse por separado.
- Una sola tarea activa por persona, salvo autorización del integrador.
- Bloqueo mayor a medio día: reportarlo, no seguir improvisando.

## Git y Pull Requests

- Nunca hacer push directo a `main`.
- Rama: `feat/123-descripcion-corta`, `fix/124-descripcion-corta` o `docs/125-descripcion-corta`.
- Un issue por Pull Request siempre que sea posible.
- No mezclar una feature con refactorizaciones cosméticas.
- No hacer merge de cambios en Auth, RLS, schema SQL, imports o secretos sin revisión específica.
- Toda modificación de base de datos debe tener migración versionada, instrucciones de ejecución y plan de rollback; nunca depender solo de una consulta manual no guardada.

## Comunicación

Cada persona actualiza el check-in diario por escrito antes de la hora acordada. La sesión semanal sirve para ver software funcionando, aceptar entregas, resolver bloqueos y escoger prioridades; no para leer reportes en voz alta.

## Gestión del alcance

Solo el responsable de producto puede cambiar prioridades del roadmap. Cualquier cambio urgente debe registrarse como issue, con la tarea actual puesta en pausa explícitamente si corresponde.
