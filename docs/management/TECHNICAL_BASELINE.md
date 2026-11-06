# Línea base técnica — revisión del ZIP `sitio-viviendas`

## Lo observado

- `index.html`: página de entrada y login.
- `mi-vivienda.html`: tablero individual del habitante.
- `admin.html`: panel administrativo con mapa, métricas y gráficas; concentra mucho código en un único HTML e incluye código de mapa.
- `js/core.js`: idioma, autenticación, chequeo de rol y carga de datos.
- `js/vivienda.js`: renderizado del panel individual.
- `js/admin-boot.js`: protege la entrada al panel administrativo y carga datos.
- `css/snrgy.css`: estilos compartidos.
- `config.js`: URL pública de Supabase, clave publicable y dominio usado para construir el usuario.
- `supabase/schema.sql`: tablas `perfiles`, `meta` y `vivienda_datos`, funciones de ayuda y políticas RLS.
- `supabase/cargar_datos.py`: carga `meta` y datos de vivienda con la clave administrativa.
- `supabase/crear_usuarios.py`: crea/actualiza cuentas y perfiles; produce un CSV con contraseñas.
- `vendor/supabase.js`: biblioteca cliente vendorizada.
- `netlify.toml`: directorio de publicación y algunas cabeceras HTTP.

## Arquitectura actual

```text
Navegador
  ├── index.html
  ├── mi-vivienda.html
  └── admin.html
          ↓
  js/core.js + cliente Supabase
          ↓
  Supabase Auth + PostgreSQL + RLS

Carga/administración de datos: scripts Python ejecutados manualmente
Hosting del frontend: Netlify
```

No se observa un backend HTTP propio: Supabase cumple la función de backend administrado. No agregar otro backend hasta que exista un requisito concreto.

## Observaciones y riesgos a gestionar

1. **No hay pruebas automatizadas ni flujo CI en el ZIP.** El código JavaScript revisado pasa un chequeo sintáctico básico, pero eso no demuestra que los flujos funcionen ni que RLS esté bien configurado en el proyecto desplegado.
2. **Los permisos son críticos.** Hay políticas RLS en el SQL, pero se deben probar con usuarios reales de roles distintos y cuentas sin sesión.
3. **Datos en JSONB.** `vivienda_datos.datos` almacena un objeto JSON por vivienda. Puede ser suficiente para el conjunto/importación actual; no migrar a un modelo temporal normalizado sin medir y registrar la necesidad.
4. **Panel administrativo grande.** `admin.html` mezcla presentación, lógica y código de mapa. No dividirlo como limpieza inicial; primero establecer pruebas de regresión y extraer partes en cambios acotados.
5. **Datos sensibles.** Ubicaciones de vivienda, consumos y archivos que contienen contraseñas deben considerarse sensibles incluso si no incluyen nombres.
6. **Clave administrativa.** Los scripts de Python necesitan `SUPABASE_SERVICE_KEY`. Esa clave debe permanecer fuera del navegador, del repositorio y de los prompts de IA.
7. **Clave publicable.** La clave publishable/anon que se utiliza en el navegador no es equivalente a la `service_role`; su seguridad depende de RLS y de no haber permisos de escritura indebidos.
8. **`.gitignore` minimalista.** Ampliarlo para ignorar archivos de entorno, cachés Python, entornos virtuales, archivos locales de datos y archivos de salida sensibles.
9. **Importaciones de datos.** Documentar el contrato de `data.json`, las unidades, el rango temporal y cómo se detectan datos inválidos, códigos repetidos y datos personales antes de cargarlos.
10. **Configuración de dominio.** Verificar que `USER_DOMAIN` en `config.js` coincida con el dominio utilizado por el script de creación de usuarios y por el entorno desplegado.
11. **Periodos y fechas.** Revisar los periodos/fechas fijos del panel administrador y establecer que los periodos disponibles se deriven de los datos reales cuando corresponda.
12. **Contenido del ZIP.** Excluir carpetas `__MACOSX` y archivos de sistema al sincronizar con GitHub.

## No confundir

- Revisión estática del ZIP ≠ prueba de producción.
- Clave publicable ≠ clave administrativa.
- Un usuario oculto/redirigido por JavaScript ≠ autorización; la autorización real debe aplicarse con RLS.
- Una gráfica renderizada ≠ datos correctos.
- Importación que termina sin excepción ≠ datos validados.

## Baseline mínimo antes de añadir funciones

- Confirmar cuál es el entorno Supabase correcto (desarrollo/producción).
- Probar los flujos con cuentas ficticias: sin sesión, habitante A, habitante B y admin.
- Guardar una muestra sintética que se pueda usar para repetir pruebas.
- Registrar pasos de despliegue y rollback.
