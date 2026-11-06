# Definition of Done — cuándo una tarea está terminada

Una tarea no está terminada por tener código escrito. Debe cumplir los puntos que aplican:

## Funcionalidad
- [ ] Cumple todos los criterios de aceptación del issue.
- [ ] Se probó el flujo afectado, incluidos al menos un caso normal y un caso de error/ausencia de datos.
- [ ] No se rompieron los flujos existentes relacionados.
- [ ] Se revisó el comportamiento en una pantalla estrecha si afecta al frontend.

## Código
- [ ] El cambio está limitado al alcance de la tarea.
- [ ] No hay secretos, usuarios/contraseñas ni datos reales añadidos al diff.
- [ ] Se eliminaron logs temporales y código de depuración.
- [ ] Los errores relevantes se manejan y no se silencian.
- [ ] El autor puede explicar lo que cambió y sus riesgos.

## Datos y seguridad (cuando aplica)
- [ ] La autorización se aplica en Supabase/RLS, no solo ocultando botones o redirigiendo páginas.
- [ ] Se verificó el acceso con roles y usuarios de prueba adecuados.
- [ ] SQL/migraciones están versionados, son repetibles en el entorno indicado y cuentan con rollback o recuperación documentada.
- [ ] Los datos importados usan las unidades, fechas y códigos esperados; no se filtraron datos personales.

## Revisión y entrega
- [ ] El chequeo automático pasa.
- [ ] Pull Request enlaza el issue y contiene resumen, pruebas y riesgos.
- [ ] Para cambios UI se adjunta captura o una demo.
- [ ] El integrador revisó y aprobó el cambio.
- [ ] El responsable de producto acepta el resultado observable.
- [ ] Documentación actualizada si cambió el comportamiento, el esquema o el procedimiento de operación.

Si un punto no aplica, indicar brevemente por qué en el Pull Request. No marcar una prueba como realizada si no se ejecutó.
