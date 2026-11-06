# Tuya Energy API

Consultar sensores eléctricos conectados a Tuya Cloud

##Objetivo inicial 

- Obtener un access token de Tuya.
- Consultar los detalles de un dispositivo.
- Consultar su estado actual.
- Identificar los Data Points eléctricos.
- Normalizar las mediciones.

Flujo de monitor_sensor.py
                    ┌──────────────────┐
                    │ Cargar settings  │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Cargar sensores  │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Filtrar enabled  │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Conectar a Tuya  │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Consultar sensor │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Extraer datos    │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Normalizar datos │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Guardar en CSV   │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Esperar 10 min   │
                    └────────┬─────────┘
                             │
                             └──────→ repetir

## Despliegue en Render (recolector + ETL)

Render corre `scripts/run_pipeline.py` cada 10 minutos como **Cron Job**.
No hay disco persistente: los CSV se restauran y archivan en un bucket
privado de Supabase Storage (`snrgy-csv`).

### 1. Sembrar el histórico (una vez, en tu máquina)

Con `backend/.env` ya relleno (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`)
y los CSV locales en `data/viviendas/`:

```bash
cd backend
python scripts/csv_archive.py upload
```

### 2. Publicar el repo del backend en GitHub

El monorepo es `ConsumoEnergetico`. En Render usa Root Directory `backend`
(ya está en `/render.yaml` como `rootDir`).

### 3. Crear el Cron Job

Opción A — Blueprint: en Render → *New* → *Blueprint* → selecciona el repo
y el archivo `render.yaml`. Completa las variables que aparecen como secretos.

Opción B — a mano: *New* → *Cron Job* → repo `energy-plataform`:

- Runtime: Python 3.12
- Build: `pip install -r requirements.txt`
- Command: `python scripts/run_pipeline.py`
- Schedule: `*/10 * * * *` (UTC; el intervalo es cada 10 min)

### 4. Variables de entorno

| Variable | Notas |
|---|---|
| `TUYA_CLIENT_ID` | secreto |
| `TUYA_CLIENT_SECRET` | secreto |
| `TUYA_BASE_URL` | `https://openapi.tuyaus.com` |
| `SUPABASE_URL` | URL del proyecto |
| `SUPABASE_SERVICE_KEY` | **service_role**, nunca en el frontend |
| `SUPABASE_CSV_BUCKET` | `snrgy-csv` |
| `PYTHONPATH` | `.` |
| `TZ` | `America/Monterrey` |

### 5. Secret Files (obligatorios)

`devices.json` y `viviendas.json` no van en Git. En Render → *Environment* →
*Secret Files*, súbelos con esos nombres exactos. El pipeline los copia a
`config/` al arrancar.

También puedes pegar el JSON en `DEVICES_JSON` y `VIVIENDAS_JSON`.

El plan Starter del Cron se cobra solo mientras corre (unos minutos cada
10 min), no un servidor 24/7.
