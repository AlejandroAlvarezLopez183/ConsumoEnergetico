# 🔍 Revisión completa del proyecto Energy Platform TEC

> Revisión de los dos sub-proyectos: **energy-plataform** (backend Python / Tuya API) y **watty** (frontend HTML/JS / Supabase).

---

## Tabla de contenido
1. [🚨 Seguridad — Urgente](#1--seguridad--urgente)
2. [🏗️ Arquitectura y estructura del proyecto](#2-️-arquitectura-y-estructura-del-proyecto)
3. [🐍 Backend Python — Calidad de código](#3--backend-python--calidad-de-código)
4. [🌐 Frontend Watty — Código y UX](#4--frontend-watty--código-y-ux)
5. [🗄️ Base de datos (Supabase)](#5-️-base-de-datos-supabase)
6. [🧪 Testing](#6--testing)
7. [⚙️ DevOps y despliegue](#7-️-devops-y-despliegue)
8. [📋 Plan de acción priorizado](#8--plan-de-acción-priorizado)

---

## 1. 🚨 Seguridad — Urgente

> [!CAUTION]
> Hay **credenciales reales expuestas** en el repositorio. Esto es lo más urgente de corregir.

### 1.1 Credenciales de Tuya en `.env` (ya comiteadas)

El archivo [.env](file:///home/alejandro/Energy_Plataform_TEC/energy-plataform/energy-plataform/.env) contiene:

```
TUYA_CLIENT_ID=tu_client_id_aqui
TUYA_CLIENT_SECRET=tu_client_secret_aqui
TUYA_DEVICE_ID=tu_device_id_aqui
```

**Problema**: Aunque `.env` está en `.gitignore`, el archivo ya está en el directorio (y posiblemente en el historial de git). Si alguna vez se hizo push, las credenciales están comprometidas.

**Acción**:
1. Rotar las credenciales de Tuya inmediatamente en [iot.tuya.com](https://iot.tuya.com)
2. Verificar con `git log -- .env` si fue comiteado; si es así, usar `git filter-branch` o BFG para eliminarlo del historial
3. Asegurar que `.env` esté en `.gitignore` (ya lo está ✅)

### 1.2 Clave Supabase en `config.js`

El archivo [config.js](file:///home/alejandro/Energy_Plataform_TEC/watty/watty/config.js) contiene la `SUPABASE_ANON_KEY`. Esto es **aceptable por diseño** (la clave anon es pública y la seguridad viene de las políticas RLS), pero verifica:

- [x] RLS está habilitado en todas las tablas
- [x] No hay políticas INSERT/UPDATE/DELETE para el rol `authenticated`
- [ ] **Falta**: Content Security Policy (CSP) en los headers de Netlify

### 1.3 Falta CSP (Content Security Policy) en Netlify

El [netlify.toml](file:///home/alejandro/Energy_Plataform_TEC/watty/watty/netlify.toml) tiene headers básicos, pero **falta CSP**:

```diff
 [[headers]]
   for = "/*"
   [headers.values]
     X-Frame-Options = "DENY"
     X-Content-Type-Options = "nosniff"
     Referrer-Policy = "strict-origin-when-cross-origin"
+    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co; img-src 'self' data: https://*.tile.openstreetmap.org"
```

### 1.4 Archivo `usuarios_con_claves.csv` sin protección explícita en watty `.gitignore`

El [.gitignore de watty](file:///home/alejandro/Energy_Plataform_TEC/watty/watty/.gitignore) **no excluye** `usuarios_con_claves.csv`. El README lo menciona como ya excluido, pero no está en las reglas.

```diff
+ # Claves generadas
+ usuarios_con_claves.csv
```

---

## 2. 🏗️ Arquitectura y estructura del proyecto

### 2.1 Estructura de carpetas confusa (doble anidación)

```
Energy_Plataform_TEC/
├── energy-plataform/
│   ├── __MACOSX/         ← Basura de descompresión
│   └── energy-plataform/ ← Proyecto real
├── watty/
│   ├── __MACOSX/         ← Basura de descompresión
│   └── watty/            ← Proyecto real
```

**Problemas**:
- Carpetas `__MACOSX` son residuos de descomprimir ZIPs en macOS. **Deben eliminarse**.
- El doble anidamiento (`watty/watty/`) dificulta la navegación. Idealmente debería ser:

```
Energy_Plataform_TEC/
├── backend/    (ex energy-plataform)
├── frontend/   (ex watty)
└── README.md   (raíz del proyecto)
```

### 2.2 Falta un monorepo o enlace entre los dos sub-proyectos

No hay un `README.md` en la raíz que explique la relación entre `energy-plataform` (colector de datos) y `watty` (visualización web). El flujo de datos de extremo a extremo no está documentado en un solo lugar.

### 2.3 Los dos proyectos duplican lógica de viviendas

- [viviendas.py](file:///home/alejandro/Energy_Plataform_TEC/energy-plataform/energy-plataform/src/viviendas.py) en el backend parsea `viviendas.json`
- [monitor_viviendas.py](file:///home/alejandro/Energy_Plataform_TEC/energy-plataform/energy-plataform/scripts/monitor_viviendas.py#L30-L58) tiene su propia función `load_viviendas()` que **no usa** la clase `ViviendaConfig` del módulo `src/viviendas.py`

**El módulo `src/viviendas.py` no se usa en ningún script.** El monitor lo reimplementa de forma más simple (sin validaciones). Esto es código muerto o una inconsistencia que debe resolverse.

---

## 3. 🐍 Backend Python — Calidad de código

### 3.1 `monitor_sensor.py` referencia `settings.tuya_device_id` que no existe

En [monitor_sensor.py:91](file:///home/alejandro/Energy_Plataform_TEC/energy-plataform/energy-plataform/scripts/monitor_sensor.py#L91-L92):
```python
reading = collect_reading(
    client=client,
    device_id=settings.tuya_device_id,  # ← AttributeError!
)
```

Pero la clase [Settings](file:///home/alejandro/Energy_Plataform_TEC/energy-plataform/energy-plataform/src/config.py#L10-L14) solo tiene `tuya_client_id`, `tuya_client_secret` y `tuya_base_url`. **Falta el campo `tuya_device_id`** — este script se romperá en runtime.

### 3.2 `monitor_sensor.py` hardcodea `"dual_meter"` como sensor_type

En [monitor_sensor.py:26](file:///home/alejandro/Energy_Plataform_TEC/energy-plataform/energy-plataform/scripts/monitor_sensor.py#L25-L28):
```python
measurements = normalize_by_type(
    "dual_meter",
    properties,
)
```

Esto debería venir de la configuración, no estar hardcodeado.

### 3.3 Posibles `ZeroDivisionError` en el normalizer

En [dual_meter.py](file:///home/alejandro/Energy_Plataform_TEC/energy-plataform/energy-plataform/src/normalizers/dual_meter.py), si alguna propiedad es `None` en vez de `0`, habrá `TypeError`:
```python
power_a_w = properties.get("power_a", 0) / 10  # Si "power_a" es None → TypeError
```

**Sugerencia**: usar una función helper que convierta a número con fallback seguro:
```python
def safe_num(val, default=0):
    try:
        return float(val) if val is not None else default
    except (TypeError, ValueError):
        return default
```

### 3.4 Typos en nombres de propiedades de Tuya

En [dual_meter.py](file:///home/alejandro/Energy_Plataform_TEC/energy-plataform/energy-plataform/src/normalizers/dual_meter.py#L11-L21):
- `energy_forword_a` → probablemente Tuya tiene el typo, pero vale documentarlo
- `energy_reserse_b` → ¿es `reverse`? Verificar con la API real

### 3.5 Sin logging estructurado

Todo el proyecto usa `print()` para logs. Deberían usar el módulo `logging` de Python:

```python
import logging
logger = logging.getLogger(__name__)
logger.info("Lectura guardada %s", timestamp)
logger.error("Error Tuya | %s | %s", vivienda_name, error)
```

Beneficios: niveles de severidad, rotación de archivos, timestamps automáticos.

### 3.6 Hardcoded timezone

La timezone `America/Monterrey` está hardcodeada en [monitor_viviendas.py:24](file:///home/alejandro/Energy_Plataform_TEC/energy-plataform/energy-plataform/scripts/monitor_viviendas.py#L24) y [monitor_sensor.py:15](file:///home/alejandro/Energy_Plataform_TEC/energy-plataform/energy-plataform/scripts/monitor_sensor.py#L15). Debería ser configurable vía `.env`:

```
LOCAL_TIMEZONE=America/Monterrey
```

### 3.7 CSV headers inconsistentes

En [storage.py:53-59](file:///home/alejandro/Energy_Plataform_TEC/energy-plataform/energy-plataform/src/storage.py#L53-L59), `append_csv_reading()` usa las keys del diccionario como fieldnames. Si un día un reading tiene más/menos campos que el primero, el CSV se rompe o pierde columnas. Deberían definirse fieldnames fijos o usar `restval=''` y `extrasaction='ignore'`.

### 3.8 Falta rate limiting para la API de Tuya

Al consultar múltiples dispositivos, no hay pausas entre peticiones. Tuya podría devolver errores 429 (rate limit). Agregar un `time.sleep(0.5)` entre dispositivos en `collect_vivienda_reading()`.

### 3.9 No se versiona `requirements.txt` con hashes

Para ambientes de producción, usar:
```
pip freeze > requirements.txt
```
O mejor, migrar a `pyproject.toml` con `pip-tools` o `poetry`.

---

## 4. 🌐 Frontend Watty — Código y UX

### 4.1 `admin.html` es un archivo monolítico de 255 KB

El archivo [admin.html](file:///home/alejandro/Energy_Plataform_TEC/watty/watty/admin.html) tiene **1912 líneas** con todo el CSS de Leaflet inline, lógica JavaScript extensa, y estilos de la app mezclados. Esto hace que sea casi imposible de mantener.

**Sugerencia**: Separar en archivos:
- `css/leaflet.css` (o cargar desde CDN/vendor)
- `css/admin.css`
- `js/admin.js` (extraer la lógica del `<script>` inline)

### 4.2 Código JavaScript muy minificado/comprimido manualmente

Los archivos [vivienda.js](file:///home/alejandro/Energy_Plataform_TEC/watty/watty/js/vivienda.js) y [core.js](file:///home/alejandro/Energy_Plataform_TEC/watty/watty/js/core.js) usan nombres de variables de 1-2 caracteres (`S`, `$`, `H`, `ND`, `NH`) y líneas extremadamente largas. Esto no es minificación automática — es código escrito así.

**Problemas**:
- Imposible de debuggear
- Imposible para otro desarrollador contribuir
- Los comentarios son mínimos

**Sugerencia**: Reescribir con nombres descriptivos y usar un minificador automático (Terser/ESBuild) para producción.

### 4.3 No hay dark mode

El CSS tiene `color-scheme: light` hardcodeado. Los valores de colores del [snrgy.css](file:///home/alejandro/Energy_Plataform_TEC/watty/watty/css/snrgy.css) no tienen versión dark. Para un proyecto de energía, dark mode sería muy apropiado y reduciría el consumo en pantallas OLED.

### 4.4 Gráficos SVG manuales vs librería

Las funciones `chartDaily()`, `chartHourly()`, `chartPower()`, `chartVolt()` en [vivienda.js](file:///home/alejandro/Energy_Plataform_TEC/watty/watty/js/vivienda.js#L137-L176) construyen SVG a mano con concatenación de strings. Es impresionante pero:

- Difícil de mantener
- Sin interactividad (solo tooltips `<title>`)
- Sin animaciones de entrada
- No responsive más allá del `viewBox`

**Alternativas**: Usar Chart.js (liviano), Apache ECharts, o D3.js si se quiere control total. Si el objetivo es cero dependencias, al menos documentar bien las funciones de gráficos.

### 4.5 innerHTML con datos de usuario (XSS potencial)

En [vivienda.js:217](file:///home/alejandro/Energy_Plataform_TEC/watty/watty/js/vivienda.js#L217), se usa `innerHTML` para inyectar contenido. Aunque se aplica `esc()` en varios lugares, hay riesgo si algún dato de Supabase no se escapa. Revisar que **todo** dato dinámico pase por `esc()`.

### 4.6 Falta lazy loading y skeleton screens

Cuando `mi-vivienda.html` carga, muestra "Cargando tus datos…" como texto plano. Un skeleton loader daría mejor percepción de velocidad.

### 4.7 Google Fonts solo se carga en admin.html

Solo [admin.html](file:///home/alejandro/Energy_Plataform_TEC/watty/watty/admin.html#L9) importa Inter desde Google Fonts. Las otras páginas dependen de que el navegador tenga Inter instalado (poco probable). Agregar el `<link>` de Google Fonts en `index.html` y `mi-vivienda.html` también, o servir la fuente localmente.

### 4.8 Accesibilidad (a11y)

- ✅ Tiene `aria-label`, `aria-pressed`, `role="status"` — buen inicio
- ❌ Falta `lang="en"` cuando se cambia a inglés (el HTML root se actualiza pero no se verifica)
- ❌ Los gráficos SVG tienen `role="img"` pero no tienen `aria-describedby` con detalles
- ❌ El contraste de color de `--muted: #6e6e73` sobre `--bg: #f5f5f7` no pasa WCAG AA (ratio ~3.5:1, necesita 4.5:1)
- ❌ Los controles de rango (7/14/20 días) no son `<fieldset>` semántico

---

## 5. 🗄️ Base de datos (Supabase)

### 5.1 Datos JSONB grandes en una sola columna

La tabla `vivienda_datos` guarda **todos los datos de una vivienda** (series horarias, sensores, etc.) en una sola columna JSONB. Esto:
- Hace imposible hacer queries por fecha/hora
- No se puede indexar de forma granular
- Cada lectura reemplaza todo el JSON

**Para el futuro**: Considerar una tabla normalizada:
```sql
CREATE TABLE lecturas (
  id BIGSERIAL PRIMARY KEY,
  vivienda TEXT NOT NULL,
  sensor TEXT NOT NULL,
  hora TIMESTAMPTZ NOT NULL,
  energia_kwh FLOAT,
  potencia_w FLOAT,
  voltaje_v FLOAT,
  factor_potencia FLOAT
);
CREATE INDEX idx_lecturas_viv ON lecturas(vivienda, hora);
```

### 5.2 Sin backups automatizados

No hay mención de backups de Supabase. En plan gratuito, Supabase hace backups diarios pero solo se retienen 7 días. Para un proyecto académico de un año, considerar exportar los datos periódicamente.

### 5.3 Script `cargar_datos.py` usa `"now()"` como string

En [cargar_datos.py:33](file:///home/alejandro/Energy_Plataform_TEC/watty/watty/supabase/cargar_datos.py#L33):
```python
upsert("meta", [{"id": 1, "datos": meta, "actualizado": "now()"}])
```

Esto funciona porque PostgREST interpreta `"now()"` como la función SQL, pero es frágil. Usar ISO timestamp o dejar que el DEFAULT del campo se aplique.

---

## 6. 🧪 Testing

> [!WARNING]
> **No hay tests en ninguno de los dos sub-proyectos.** Esto es un riesgo alto para un proyecto que maneja datos reales.

### 6.1 Tests prioritarios para el backend

| Módulo | Tipo de test | Qué validar |
|--------|-------------|-------------|
| `normalizers/dual_meter.py` | Unitario | Conversiones correctas, manejo de `None` |
| `tuya_client.py` | Unitario + mock | Firma HMAC, manejo de errores HTTP |
| `viviendas.py` | Unitario | Parsing de JSON, validaciones |
| `storage.py` | Integración | Creación de CSV, append correcto |
| `monitor_viviendas.py` | End-to-end | Una ronda completa con datos mock |

### 6.2 Tests para el frontend

- **Verificar sintaxis JS**: Ya existe [check_js_syntax.py](file:///home/alejandro/Energy_Plataform_TEC/watty/watty/scripts/check_js_syntax.py) ✅
- **Falta**: Tests de las funciones `stats()` y `recs()` que calculan recomendaciones
- **Falta**: Tests de las políticas RLS de Supabase con datos de prueba

---

## 7. ⚙️ DevOps y despliegue

### 7.1 Falta CI/CD

No hay GitHub Actions, ni pipeline de ningún tipo. Sugerencias mínimas:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: '3.12'}
      - run: pip install ruff
      - run: ruff check energy-plataform/

  lint-js:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npx --yes acorn --ecma2020 watty/js/*.js
```

### 7.2 Falta `pyproject.toml`

El proyecto Python no tiene `pyproject.toml`. Migrar desde `requirements.txt`:
- Define el proyecto como paquete instalable
- Permite usar `python -m scripts.monitor_viviendas` sin path hacks
- Añade metadata (versión, autores, licencia)

### 7.3 El monitor no tiene supervisión (systemd/Docker)

Los scripts `monitor_*.py` corren en bucle infinito pero no tienen:
- Reinicio automático ante crasheo
- Healthchecks
- Notificaciones de errores

**Sugerencia**: Crear un `Dockerfile` o un archivo `systemd` unit para producción.

### 7.4 Sin linter ni formatter configurados

No hay configuración de `ruff`, `black`, `flake8`, `eslint`, o `prettier`. El código es bastante limpio, pero configurar al menos `ruff` evitaría regresiones:

```toml
# ruff.toml
line-length = 79
target-version = "py312"
```

---

## 8. 📋 Plan de acción priorizado

### 🔴 Crítico (hacer esta semana)

| # | Tarea | Esfuerzo |
|---|-------|----------|
| 1 | Rotar credenciales de Tuya y limpiar historial de git | 30 min |
| 2 | Agregar `usuarios_con_claves.csv` al `.gitignore` de watty | 1 min |
| 3 | Corregir `Settings` para incluir `tuya_device_id` (o refactorizar `monitor_sensor.py`) | 15 min |
| 4 | Agregar CSP a `netlify.toml` | 10 min |

### 🟡 Importante (próximas 2 semanas)

| # | Tarea | Esfuerzo |
|---|-------|----------|
| 5 | Eliminar carpetas `__MACOSX` y los `.zip` del workspace | 5 min |
| 6 | Refactorizar `monitor_viviendas.py` para usar `src/viviendas.py` | 1-2 h |
| 7 | Agregar manejo seguro de `None` en `dual_meter.py` | 30 min |
| 8 | Agregar Google Fonts a `index.html` y `mi-vivienda.html` | 5 min |
| 9 | Migrar `print()` a `logging` | 1-2 h |
| 10 | Añadir tests unitarios para normalizers y storage | 2-3 h |

### 🟢 Mejora continua (próximo mes)

| # | Tarea | Esfuerzo |
|---|-------|----------|
| 11 | Separar `admin.html` en archivos CSS + JS independientes | 3-4 h |
| 12 | Renombrar variables en `vivienda.js` y `core.js` por claridad | 4-5 h |
| 13 | Agregar CI con GitHub Actions | 1 h |
| 14 | Crear `pyproject.toml` | 30 min |
| 15 | Agregar dark mode al CSS | 2-3 h |
| 16 | Dockerizar el monitor | 1-2 h |
| 17 | Normalizar el esquema de BD (tabla de lecturas) | 4-6 h |
| 18 | Añadir rate limiting en peticiones a Tuya | 30 min |

---

## Resumen general

| Aspecto | Calificación | Notas |
|---------|:------------:|-------|
| **Seguridad** | ⚠️ | Credenciales expuestas, falta CSP |
| **Arquitectura** | 🟡 | Bien separado pero con código muerto y duplicación |
| **Código Python** | 🟢 | Limpio, bien estructurado, buen uso de dataclasses y typing |
| **Código JS** | 🟡 | Funcional pero difícil de mantener por nombrado corto |
| **Frontend UX** | 🟢 | Diseño profesional, i18n, accesibilidad básica |
| **Base de datos** | 🟢 | RLS bien configurado, schema coherente |
| **Testing** | 🔴 | Sin tests |
| **DevOps** | 🔴 | Sin CI/CD, sin supervisión de procesos |
| **Documentación** | 🟢 | READMEs detallados y claros |

> [!TIP]
> El proyecto tiene una base sólida con buenas decisiones de diseño (RLS, separation of concerns, i18n, dataclasses). Las mejoras más impactantes son las de seguridad y las de testing — ambas protegen el trabajo ya hecho.
