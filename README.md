# Energy Platform TEC — SNRGY

Plataforma para monitorear el consumo eléctrico de viviendas en Monterrey, identificar patrones de uso y entregar recomendaciones de ahorro. Proyecto del **Laboratorio de Sustainable Energy del Tecnológico de Monterrey**.

## Estructura del repositorio

```text
Energy_Plataform_TEC/
├── backend/            # Colector de datos Tuya Cloud (Python 3.12)
├── frontend/           # Sitio SNRGY (HTML/CSS/JS) y lógica de Supabase
├── docs/               # Documentación centralizada
│   ├── management/     # Charter, roadmap, backlog, acuerdos de trabajo
│   ├── data/           # Contrato de datos, pendientes del ETL, comparativas
│   └── reviews/        # Auditorías y revisiones técnicas
├── docker-compose.yml  # Orquestación: backend, etl, frontend
└── .env.example        # Plantilla de configuración global
```

## Flujo de datos

1. **Recolección** — el servicio `backend` consulta la API de Tuya cada `COLLECT_INTERVAL_SECONDS` y guarda CSVs en el volumen `snrgy-data`.
2. **Transformación (ETL)** — el servicio `etl` convierte los CSV crudos en `data.json`, validándolo contra el [contrato de datos](docs/data/CONTRATO_DATOS.md) antes de escribirlo.
3. **Persistencia** — los datos se cargan a **Supabase** (PostgreSQL + RLS).
4. **Visualización** — el `frontend` (Watty) muestra la información a habitantes y administradores.

## Inicio rápido

```bash
# 1. Credenciales de Tuya
cp backend/.env.example backend/.env   # y rellenar TUYA_CLIENT_ID / TUYA_CLIENT_SECRET

# 2. Configuración de dispositivos y viviendas
cp backend/config/devices.example.json   backend/config/devices.json
cp backend/config/viviendas.example.json backend/config/viviendas.json

# 3. Variables globales (opcional)
cp .env.example .env

# 4. Levantar la plataforma
docker compose up -d --build
```

El frontend queda disponible en `http://localhost:8080` (configurable con `FRONTEND_PORT`).

## Despliegue (sin servidor 24/7)

- **Frontend** → Vercel, sitio estático. Root Directory: `frontend`.
- **Recolector + ETL** → Cron Job en Render cada 10 min. Root Directory: `backend`
  (`render.yaml` ya lo declara). Los CSV se archivan en Supabase Storage.
  Guía: [backend/README.md](backend/README.md#despliegue-en-render-recolector--etl).

Para más detalle sobre arquitectura, seguridad y calidad de datos, consulta la carpeta [docs/](docs/).
