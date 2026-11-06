# Resumen de Cambios — Energy Platform TEC (SNRGY)

Este documento detalla la transformación técnica del proyecto, desde la limpieza estructural hasta la automatización del flujo de datos y el blindaje de seguridad.

## 1. Reorganización de Arquitectura (Monorepo)
Se eliminó la redundancia de carpetas y se estandarizó la estructura para facilitar el mantenimiento y despliegue.

- **Estructura anterior:** Carpetas doblemente anidadas (`energy-plataform/energy-plataform`, `watty/watty`).
- **Estructura actual:**
    - `backend/`: Colector de datos Tuya (Python).
    - `frontend/`: Interfaz web y lógica de Supabase (HTML/JS).
    - `docs/`: Documentación centralizada (Gestión, Datos, Auditorías).
- **Limpieza:** Se eliminaron archivos basura (`.zip`, `__MACOSX`) y se centralizó la documentación dispersa.

## 2. Pipeline de Datos (ETL Automático)
Se implementó un proceso robusto de Transformación y Carga (ETL) que garantiza la calidad de la información.

- **Script `build_dataset.py`:** Convierte CSVs crudos del colector en un dataset horario (`data.json`).
- **Validación del Contrato (§8):** El sistema rechaza automáticamente cualquier dato que no cumpla con las 7 reglas de integridad (rangos de voltaje, frecuencia, unicidad de códigos, etc.).
- **Automatización:** Se creó el servicio `etl` en Docker que procesa y sube datos a Supabase automáticamente cada hora (o el intervalo configurado).
- **Limpieza de Privacidad:** El ETL elimina automáticamente campos sensibles como `nombre` antes de la subida.

## 3. Integración con Supabase y Seguridad
Se migró la persistencia a Supabase y se blindó el acceso a los datos.

- **Esquema de Base de Datos:** Implementación de tablas `perfiles`, `meta` y `vivienda_datos`.
- **Row Level Security (RLS):** 
    - Se auditaron y activaron políticas que garantizan que un habitante **solo** pueda ver los datos de su propia casa.
    - Se revocó el acceso de escritura desde el navegador; solo los scripts del servidor pueden modificar datos.
- **Gestión de Secretos:** Se implementó un sistema de variables de entorno (`.env`) protegido por `.gitignore` para separar la `service_role` key (privada) de la `anon` key (pública).

## 4. Mejoras en el Frontend (Visualización)
Se resolvieron errores críticos de visualización y se mejoró la experiencia de usuario.

- **Corrección de Mapas:** Se ajustó la política de seguridad (CSP) y se eliminaron efectos CSS que hacían los mapas invisibles.
- **Robustez de Estadísticas:** Se corrigió el error de **NaN** mediante la implementación de "escudos" en el código JS, permitiendo que el panel funcione correctamente incluso con pocos días de datos o información incompleta.
- **Fechas Dinámicas:** Se eliminó el "hardcode" de fechas; ahora el panel detecta automáticamente el inicio y fin de los datos reales para mostrar el calendario correcto.

## 5. Orquestación con Docker
Se simplificó el despliegue a un solo comando.

- **Docker Compose:** Orquestación de tres servicios independientes:
    1. `snrgy-backend`: Recolección 24/7 de Tuya.
    2. `snrgy-etl`: Procesamiento y subida automática.
    3. `snrgy-frontend`: Servidor web Nginx optimizado.
- **Volúmenes Persistentes:** Los datos crudos (CSVs) se mantienen seguros en un volumen nombrado (`snrgy-data`), permitiendo actualizar el código sin perder el histórico.

---
**Estado del Proyecto:** Operativo, automatizado y seguro.
**Próximos Pasos sugeridos:** Implementación de alertas por correo y optimización de reglas de plausibilidad de energía.
