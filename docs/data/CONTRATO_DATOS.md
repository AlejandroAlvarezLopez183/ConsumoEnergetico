# Contrato de datos — SNRGY

Define el formato exacto que el frontend espera consumir. Cualquier generador de
datos (ETL desde los CSV del recolector, exportaciones manuales o el fixture
sintético) **debe** cumplir este contrato para que `mi-vivienda.html` y
`admin.html` funcionen sin cambios.

- Consumidor: [`js/core.js`](../../frontend/js/core.js) (`loadMeta`, `loadHouse`, `loadAll`),
  [`js/vivienda.js`](../../frontend/js/vivienda.js), [`admin.html`](../../frontend/admin.html).
- Productor real (ETL): [`scripts/build_dataset.py`](../../backend/scripts/build_dataset.py)
  → convierte los CSV crudos del recolector en `data.json`.
- Productor de ejemplo: [`supabase/generar_fixture.py`](../../frontend/supabase/generar_fixture.py)
  → `data_ejemplo.json` (sintético, sin datos reales).
- Cargador a producción: [`supabase/cargar_datos.py`](../../frontend/supabase/cargar_datos.py)
  (o el propio ETL con `--subir`).

Referencia de backlog: **SNRGY-06 — Documentar contrato del archivo de datos de entrada**.

---

## 1. Cómo se almacena y se consume

El archivo completo (`data.json`) tiene **dos partes**: un objeto `meta` (general)
y una lista de **viviendas** y **sensores**. Al subirlo a Supabase se divide así:

| Origen (`data.json`)        | Destino Supabase (`supabase/schema.sql`)              |
| --------------------------- | ----------------------------------------------------- |
| `inicio, horas, dias, datos_desde, datos_hasta, caidas_sistema` | tabla `meta`, columna `datos` (fila única `id = 1`)   |
| `viviendas[]`               | tabla `vivienda_datos`, una fila por vivienda (`codigo`, `datos`) |
| `sensores[]`                | Se **reparte** dentro de cada vivienda como `sensores_det` (el cargador lo inyecta; no es una tabla aparte) |

En el navegador, [`core.js`](../../js/core.js) hace lo inverso:

- `loadMeta()` → devuelve `meta.datos`.
- `loadHouse(codigo)` → devuelve `data.datos` (una vivienda con sus `sensores_det`).
- `loadAll()` → vuelve a unir `meta` + todas las viviendas, y **saca** `sensores_det`
  de cada vivienda para dejarlos en un arreglo plano `sensores[]`.

> En modo demo (`config.js` sin `SUPABASE_URL`), el frontend lee
> `window.DEMO_DATA`, que es exactamente el mismo objeto `data_ejemplo.json`.
> El fixture sirve como contrato ejecutable: si el fixture carga, el frontend
> acepta el formato.

---

## 2. Convenciones de tiempo

- **Zona horaria:** hora local del laboratorio (Monterrey, UTC−6, sin horario de
  verano). Los timestamps son **texto local sin zona** (`"2026-09-08T00:00"`),
  NO ISO-8601 con offset. `admin.html` interpreta `datos_hasta` añadiendo
  `':00-06:00'` para calcular la antigüedad de los datos.
- **Formato:** `"YYYY-MM-DDTHH:MM"` (minutos siempre `:00`, resolución horaria).
- **Series horarias:** todos los arreglos de valores tienen longitud `horas` e
  índice `k` = hora `inicio + k horas`. `horas = dias × 24`.
- **Fecha de inicio:** el panel admin asume por defecto `2026-09-08`
  (`new Date(2026,8,8+d)` y `DATAMONTH='2026-09'`). El ETL debe respetar o
  actualizar esas constantes de forma coordinada.

---

## 3. Objeto `meta` (nivel raíz)

| Campo             | Tipo              | Unidad / formato        | Descripción |
| ----------------- | ----------------- | ----------------------- | ----------- |
| `inicio`          | string            | `YYYY-MM-DDTHH:MM`      | Primera hora (índice `k = 0`) de las series. |
| `horas`           | entero            | —                       | Número total de horas de cada serie. |
| `dias`            | entero            | —                       | Número de días cubiertos (`horas / 24`). |
| `datos_desde`     | string            | `YYYY-MM-DDTHH:MM`      | Primera lectura disponible. |
| `datos_hasta`     | string            | `YYYY-MM-DDTHH:MM`      | Última lectura disponible. |
| `caidas_sistema`  | arreglo de pares  | `[["YYYY-MM-DD HH:MM","YYYY-MM-DD HH:MM"], ...]` | Tramos donde la plataforma entera dejó de recibir datos (código `cls = 3`). Ojo: aquí el separador es **espacio**, no `T`, y `fin` es el inicio de la hora en que volvieron los datos (el admin calcula la duración como `fin − ini`). |

---

## 4. Objeto vivienda (`viviendas[]` / `vivienda_datos.datos`)

| Campo            | Tipo    | Descripción |
| ---------------- | ------- | ----------- |
| `codigo`         | string  | Identificador único. Formato `Vivienda-NNN` (p. ej. `Vivienda-004`). Clave primaria en Supabase. |
| `lat`, `lon`     | número  | Coordenadas WGS84 para el mapa. |
| `estado`         | string  | Estado consolidado: `good` \| `warn` \| `crit` (ver §6). |
| `sensores_det`   | arreglo | Solo al subir a Supabase: los sensores de esa vivienda (el navegador los extrae a `sensores[]`). |
| `e` … `f`, `cls` | arreglos de longitud `horas` | Series horarias (ver §5). |

> Nunca se incluye `nombre` ni ningún dato personal; `cargar_datos.py` lo elimina
> explícitamente antes de subir.

### 4.1 Series horarias (vivienda)

Todas tienen exactamente `horas` posiciones. Un valor `null` significa
**sin lectura utilizable en esa hora** (no cero).

| Campo | Unidad      | Descripción |
| ----- | ----------- | ----------- |
| `e`   | kWh         | Energía consumida en esa hora. |
| `rev` | kWh         | Energía exportada (reversa). Normalmente `0` en consumo residencial. |
| `p`   | kW          | Potencia activa promedio de la hora. |
| `s`   | kVA         | Potencia aparente. |
| `q`   | kVAR        | Potencia reactiva. |
| `pf`  | 0–1         | Factor de potencia (1 = ideal). |
| `va`  | V           | Voltaje fase A (rango normal 114.3–139.7 V). |
| `vb`  | V           | Voltaje fase B. |
| `f`   | Hz          | Frecuencia (nominal 60 Hz). |
| `cls` | entero 0–3  | **Calidad de la hora** (ver §7). Es el campo que decide si el valor de `e`, `p`, etc. es confiable. |

---

## 5. Objeto sensor (`sensores[]` / `sensores_det`)

| Campo                   | Tipo     | Descripción |
| ----------------------- | -------- | ----------- |
| `codigo`                | string   | Identificador del medidor (p. ej. `EM-001`). |
| `vivienda`              | string   | `codigo` de la vivienda a la que pertenece. |
| `estado`                | string   | Estado del sensor: `OK` \| `INTERMITENTE` \| `SIN_VOLTAJE` \| `CONGELADO` \| `SIN_DATOS` (ver §6). |
| `cls`                   | arreglo  | Códigos de calidad por hora, longitud `horas` (§7). |
| `pct_congelado`         | número   | % de horas con `cls = 1`. |
| `tramo_congelado_max_h` | entero   | Duración (h) del tramo congelado continuo más largo. |
| `huecos_sensor`         | entero   | Número de horas con `cls = 2`. |
| `tiene_voltaje`         | booleano | `false` si el medidor no reporta voltaje/frecuencia. |
| `pct_no_confiable`      | número   | % de horas con `cls ≠ 0`. |
| `repetido`              | objeto \| null | `{ "p_w": <W>, "v": <V> }` con el valor repetido detectado, o `null` si no aplica. |

---

## 6. Enumeraciones de estado

### Vivienda `estado` → etiqueta en la interfaz

| Valor  | Etiqueta (admin)    | Significado |
| ------ | ------------------- | ----------- |
| `good` | Datos completos     | Todas las horas confiables. |
| `warn` | Datos parciales     | Hay horas no confiables, pero hay lecturas válidas. |
| `crit` | Sin lecturas válidas| Ninguna hora confiable en el periodo. |

### Sensor `estado` → severidad

| Valor         | Severidad (`CODE_SEV`) | Significado |
| ------------- | ---------------------- | ----------- |
| `OK`          | `good`                 | Sin problemas. |
| `INTERMITENTE`| `warn`                 | Reporta de forma irregular. |
| `SIN_VOLTAJE` | `warn`                 | No reporta voltaje ni frecuencia. |
| `CONGELADO`   | `crit`                 | Repite el mismo valor (lectura congelada). |
| `SIN_DATOS`   | `crit`                 | No envía datos. |

---

## 7. Códigos de calidad `cls`

`cls[k]` describe la hora `k` y aplica a **toda** la fila (vivienda y sensor):

| `cls` | Etiqueta (`CLS_LAB`) | Significado | Valor de las series |
| ----- | -------------------- | ----------- | ------------------- |
| `0`   | (confiable)          | Lectura válida. | Número real. |
| `1`   | sensor congelado     | El medidor repitió el mismo valor. | `null` en `e, rev, p, s, q, pf, va, vb, f`. |
| `2`   | hueco del sensor     | Faltó la lectura. | `null`. |
| `3`   | caída del sistema    | La plataforma no recibió nada. | `null`. |

**Regla clave:** si `cls[k] ≠ 0`, los valores de esa hora **deben** ir en `null`.
El frontend descarta esas horas y calcula métricas solo con `cls = 0`, pero
necesita el `null` para no contar ceros falsos.

**Excepción:** cuando `tiene_voltaje = false` (sensor `SIN_VOLTAJE`), `va, vb, f,
pf, s, q` pueden ser `null` **aunque `cls = 0`**, porque el medidor
sencillamente no mide esas magnitudes.

---

## 8. Reglas de validación (SNRGY-07)

Un generador de datos es válido solo si cumple TODO lo siguiente:

1. `longitud(e) == longitud(cls) == … == horas` en cada vivienda y sensor.
2. `horas == dias × 24`.
3. `codigo` de vivienda y `codigo` de sensor son únicos; todo `sensor.vivienda`
   existe en `viviendas[]`.
4. `cls[k] ≠ 0` ⇒ el resto de series en `k` son `null`.
5. `e ≥ 0`, `rev ≥ 0`, `0 ≤ pf ≤ 1`, `va`/`vb` en rango plausible, `f ≈ 60`.
6. `estado` de vivienda/sensor ∈ las enumeraciones de §6.
7. No hay campo `nombre` ni datos personales.

---

## 9. Salida CSV del panel (referencia)

Para exportar lecturas (`admin.html`), el orden de columnas es:

```
vivienda, hora, e, rev, cls, p, s, q, pf, va, vb, f
```

donde `hora` se formatea como `YYYY-MM-DD HH:00` y `cls` se traduce a
`confiable | sensor congelado | hueco del sensor | caída del sistema`.

---

## 10. Generar y validar el fixture

```bash
cd frontend/supabase
python3 generar_fixture.py                        # data_ejemplo.json, 5 días, semilla fija
python3 generar_fixture.py salida.json --dias 7 --seed 42
```

El fixture es **determinista** (semilla `20260908` por defecto) y crea 4
viviendas sintéticas con estados `good`, `warn` y `crit`, incluida una con
voltaje congelado y otra que no reporta voltaje. No contiene datos reales.
