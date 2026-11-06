# Backlog inicial recomendado

Crear estas tareas como GitHub Issues. Las estimaciones son orientativas para dividir el trabajo; no son compromisos hasta que el equipo confirme dependencias.

## Sprint 0 — Conocer, proteger y estabilizar

### SNRGY-01 — Confirmar repositorio y flujo de colaboración
**Prioridad:** P0 · **Área:** DevEx · **Tamaño:** S

- [ ] Establecer GitHub como repositorio remoto único.
- [ ] Definir `main`, ramas de trabajo y Pull Requests.
- [ ] Crear tablero, etiquetas y milestone `M0 — Estabilización`.
- [ ] Confirmar quién es responsable de producto e integrador técnico.

**Aceptación:** todos saben dónde crear tareas, dónde trabajar y cómo solicitar revisión.

### SNRGY-02 — Revisar archivos sensibles y `.gitignore`
**Prioridad:** P0 · **Área:** Seguridad · **Tamaño:** S

- [ ] Revisar el repositorio y el historial para detectar credenciales administrativas, CSV con contraseñas y datos reales.
- [ ] Añadir exclusiones para `.env`, `__pycache__/`, `.venv/`, `.DS_Store`, datos de trabajo y CSV de credenciales.
- [ ] Confirmar que `SUPABASE_SERVICE_KEY` no se encuentra en ningún archivo frontend ni en commits.
- [ ] Confirmar que la clave del navegador es solo publicable y que RLS está activado.

**Aceptación:** revisión documentada; no se suben secretos ni datos reales. Si hubo una clave administrativa expuesta, revocarla/rotarla siguiendo el procedimiento del proveedor.

### SNRGY-03 — Crear matriz de pruebas de roles y RLS
**Prioridad:** P0 · **Área:** Seguridad/Auth · **Tamaño:** M

- [ ] Probar sin sesión, habitante A, habitante B y admin.
- [ ] Intentar leer una vivienda ajena mediante rutas y consultas directas autorizadas para la cuenta.
- [ ] Probar perfil inexistente y logout.
- [ ] Guardar pasos, resultado esperado, resultado observado y evidencia sin datos personales.

**Aceptación:** ningún habitante puede leer datos de otra vivienda; admin solo puede leer lo permitido; usuarios anónimos no leen datos privados.

### SNRGY-04 — Documentar flujos actuales sin refactorizar
**Prioridad:** P0 · **Área:** Documentación · **Tamaño:** S

- [ ] Documentar login, redirección por rol, panel de habitante, panel admin y logout.
- [ ] Identificar de dónde llegan los datos y cómo se cargan.
- [ ] Registrar defectos visibles como issues separados.

**Aceptación:** alguien nuevo puede explicar el flujo sin adivinar y hay checklist de prueba manual.

### SNRGY-05 — Agregar chequeo JavaScript a GitHub Actions
**Prioridad:** P1 · **Área:** Calidad/CI · **Tamaño:** S

- [ ] El workflow comprueba archivos `.js` y scripts inline HTML con `node --check`.
- [ ] La ejecución falla si hay error sintáctico.
- [ ] Abrir un PR pequeño para comprobar que el workflow se ejecuta.

**Aceptación:** GitHub muestra el chequeo en cada Pull Request. Esto valida sintaxis, no sustituye las pruebas funcionales.

## Sprint 1 — Calidad de datos y experiencia fiable

### SNRGY-06 — Documentar contrato del archivo de datos de entrada
**Prioridad:** P1 · **Área:** Datos · **Tamaño:** S

- [ ] Documentar campos requeridos, unidades, rango de fechas, zona horaria y significado de valores nulos.
- [ ] Definir cómo se identifica cada vivienda/sensor.
- [ ] Usar fixture sintético; no usar exportación real con datos personales para pruebas.

**Aceptación:** existe un ejemplo sintético y validado que cualquiera del equipo puede usar.

### SNRGY-07 — Validar datos antes de importar
**Prioridad:** P1 · **Área:** Datos · **Tamaño:** M

- [ ] Detectar vivienda/código duplicado.
- [ ] Detectar campos obligatorios faltantes y tipos inválidos.
- [ ] Validar timestamps/rangos y consistencia de series.
- [ ] Reportar qué se cargaría antes de hacer cambios (modo dry-run).

**Aceptación:** datos inválidos se rechazan con mensajes claros y el modo dry-run no escribe en Supabase.

### SNRGY-08 — Revisar estados de datos en el frontend
**Prioridad:** P1 · **Área:** Frontend · **Tamaño:** M

- [ ] Comprobar carga, error, ausencia de datos y datos antiguos.
- [ ] Diferenciar explícitamente una lectura no confiable/obsoleta de un consumo igual a cero.
- [ ] Revisar mensajes en español e inglés.

**Aceptación:** la interfaz no presenta datos faltantes como cero ni asegura que el medidor está en línea sin evidencia.

### SNRGY-09 — Revisar rango de fechas del panel administrativo
**Prioridad:** P1 · **Área:** Frontend/Datos · **Tamaño:** S

- [ ] Localizar años, meses o mensajes fijos en la interfaz.
- [ ] Comparar con `datos_desde`, `datos_hasta` y el periodo real del dataset.
- [ ] Actualizar el rango con el cambio mínimo, sin reformatear todo `admin.html`.

**Aceptación:** los periodos presentados corresponden a datos disponibles y los vacíos se explican claramente.

## Sprint 2 — Preparar actualización recurrente

### SNRGY-10 — Decidir arquitectura de ingesta de datos
**Prioridad:** P1 · **Área:** Arquitectura/Datos · **Tamaño:** S

- [ ] Documentar fuente actual y frecuencia de actualización.
- [ ] Comparar carga manual, tarea programada y webhook/API disponible.
- [ ] Evaluar cómo se insertan lecturas sin pisar historial ni duplicar datos.
- [ ] Registrar la decisión en un ADR antes de programar.

**Aceptación:** existe una decisión aprobada, con alternativa descartada, riesgos, costo operativo y estrategia de recuperación.

### SNRGY-11 — Añadir prueba de regresión para importación
**Prioridad:** P1 · **Área:** Datos/Calidad · **Tamaño:** M

- [ ] Preparar entrada sintética.
- [ ] Verificar cantidad de viviendas/sensores esperada.
- [ ] Verificar que el proceso sea repetible y no duplique registros.
- [ ] Probar error sin credenciales, sin escribir en producción.

**Aceptación:** la prueba puede repetirse en un entorno de desarrollo.

## Orden

No iniciar SNRGY-10 como implementación de ingesta automática hasta completar SNRGY-03 y SNRGY-06. No iniciar refactorización grande del panel admin antes de tener flujos de regresión documentados.
