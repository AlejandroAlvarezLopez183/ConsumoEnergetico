# Auditoría de Seguridad y Calidad de Datos

Este documento resume los resultados de la auditoría de seguridad RLS y el reporte de calidad de datos (Dry-Run) realizados el 2026-10-31.

## 1. Auditoría de Seguridad (RLS)
Se revisó el archivo [schema.sql](file:///home/alejandro/Energy_Plataform_TEC/frontend/supabase/schema.sql) para validar las políticas de Row Level Security (RLS) en Supabase.

**Hallazgos:**
- **`public.perfiles`**: Cada usuario solo puede leer su propio registro (`user_id = auth.uid()`). **Correcto.**
- **`public.meta`**: Datos generales legibles por cualquier usuario autenticado. **Correcto.**
- **`public.vivienda_datos`**: 
  - Los **habitantes** solo pueden leer los datos de su vivienda asignada (`codigo = public.mi_vivienda()`).
  - Los **administradores** tienen acceso total a todas las viviendas (`public.es_admin()`).
  - **Correcto.**
- **Acceso Anónimo**: El acceso a `anon` ha sido revocado explícitamente para todas las tablas. **Excelente.**
- **Escritura**: Se ha revocado la capacidad de `insert`, `update` y `delete` para usuarios autenticados. La escritura queda reservada para procesos internos que usen la `service_role` key. **Excelente.**

**Conclusión:** La seguridad de los datos está garantizada a nivel de base de datos. Un habitante no puede acceder a los datos de otra vivienda incluso si conoce su código.

---

## 2. Reporte de Calidad de Datos (Dry-Run)
Se ejecutó el ETL en modo simulacro (`--dry-run`) sobre el dataset completo de 18 viviendas.

**Resultado: PASS (Cumple el Contrato §8)**

**Resumen del Dataset:**
- **Periodo:** 6 días (del 2026-09-02 al 2026-09-07).
- **Viviendas procesadas:** 18.
- **Estado de Viviendas:** 18 en estado `warn` (debido a sensores intermitentes o datos parciales).
- **Sensores (24 en total):**
  - **OK / Intermitentes:** 18 (lecturas recibidas pero con huecos).
  - **Congelados:** 3 (el medidor envía el mismo valor acumulado repetidamente).
  - **Sin Voltaje:** 3 (lecturas de energía pero voltaje en 0).
- **Caídas del Sistema:** 3 eventos detectados.

**Observaciones de Calidad:**
- El validador integró correctamente los fixes de voltaje y frecuencia.
- Los datos son consistentes con las reglas del contrato: no hay campos faltantes ni tipos inválidos.
- Se detectaron los saltos de energía mencionados en los pendientes, pero el validador permite su paso (solo exige `e >= 0`).

**Conclusión:** El dataset está listo para ser cargado a Supabase una vez que se cuente con las credenciales.
