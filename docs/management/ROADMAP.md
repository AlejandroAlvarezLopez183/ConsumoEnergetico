# Roadmap de entrega

El roadmap se organiza por resultados verificables, no por cantidad de código. Cambiar el orden requiere explicar qué riesgo o hipótesis justifica el cambio.

## M0 — Control y línea base

**Resultado:** el equipo puede trabajar sin perder cambios y puede demostrar qué funciona hoy.

- Repositorio GitHub, rama `main` protegida y Pull Requests.
- Tablero de trabajo, etiquetas y responsables.
- Documentar flujos existentes y criterios de aceptación.
- Auditar secretos, archivos privados y configuración de entornos.
- Agregar chequeo automatizado de sintaxis JavaScript.

**Salida:** instrucciones claras para ejecutar/revisar el sitio y checklist de smoke tests.

## M1 — Seguridad y flujos esenciales

**Resultado:** login, roles y privacidad comprobados con evidencia.

- Probar acceso sin sesión, habitante A, habitante B y administrador.
- Confirmar que la vivienda se resuelve desde el perfil autorizado y no desde parámetros manipulables por el usuario.
- Verificar RLS en tablas relevantes, incluidos casos de lectura directa por API.
- Probar logout, expiración/ausencia de sesión, perfil faltante y errores de conexión.
- Verificar que no se incluyan datos reales ni contraseñas en el repositorio.

**Salida:** matriz de pruebas aprobada y lista de riesgos conocidos.

## M2 — Calidad de datos y experiencia fiable

**Resultado:** las gráficas y estados no inducen a error.

- Especificar el formato y las unidades de `data.json`.
- Validar códigos de vivienda únicos, timestamps, longitud de series, campos requeridos y valores inválidos.
- Asegurar que el importador falle claramente ante datos inválidos y reporte qué cargó.
- Diferenciar sin datos, datos antiguos, datos parciales y error de consulta.
- Revisar fechas/periodos fijos y hacerlos coherentes con los datos disponibles.

**Salida:** conjunto de datos sintético reproducible, validación de importación y pruebas de estados vacíos/error.

## M3 — Operación de datos recurrentes

**Resultado:** actualizar los datos no depende de pasos manuales frágiles.

- Documentar la fuente y el proceso actual de extracción.
- Diseñar un contrato versionado entre fuente de datos y tabla Supabase.
- Definir idempotencia, reintentos, logs, detección de lecturas tardías y recuperación ante fallos.
- Elegir cómo entra la información de Tuya u otra fuente; registrar decisión antes de implementarla.
- Programar la ingesta solo después de que los casos de calidad estén definidos.

**Salida:** un flujo automatizado monitorizado con una forma probada de repetir/corregir una ejecución.

## M4 — Mantenibilidad

**Resultado:** los cambios pueden hacerse en pequeñas partes sin romper el sitio.

- Extraer gradualmente lógica de `admin.html` a archivos separados, con pruebas de regresión.
- Agregar pruebas específicas para cálculos/transformaciones críticas.
- Versionar cambios SQL mediante migraciones numeradas; no editar producción sin un cambio rastreable.
- Mejorar logging operativo y documentación de recuperación.

**Salida:** cambios pequeños, probables de revisar y con rollback documentado.

## M5 — Evolución del producto

Se prioriza únicamente tras confirmar los hitos previos:

- Comparaciones temporales y entre viviendas con contexto suficiente.
- Diagnósticos de calidad de sensores.
- Recomendaciones con límites, metodología y trazabilidad.
- Integración automática y monitoreada con la fuente de telemetría.

No se considera parte del MVP actual: IA avanzada, reescritura completa del frontend, app móvil nativa o control remoto de cargas.

## Regla para admitir nuevas ideas

Cada propuesta nueva debe incluir: usuario afectado, problema, beneficio esperado, coste aproximado, riesgo y qué prioridad desplaza. Si no cabe, se registra en Backlog; no se interrumpe la tarea en curso.
