# Viviendas · SNRGY — sitio con inicio de sesión

```
index.html        Inicio: descripción del proyecto + login
mi-vivienda.html  Panel del habitante (sus gráficas y recomendaciones)
admin.html        Mapa y panel de administración (solo rol admin)
config.js         URL y clave pública de Supabase  ← lo único que editas
js/ css/ vendor/  Código compartido (supabase-js incluido, sin CDN)
(demo-data.js ya no se incluye: el sitio está conectado a Supabase)
supabase/         schema.sql, cargar_datos.py, crear_usuarios.py
```

## Cómo funciona
- Entras en `index.html` con usuario y contraseña.
- Si tu cuenta es **admin** → `admin.html` (mapa). Si es **habitante** → `mi-vivienda.html`.
- Las páginas **no traen datos dentro**: los piden a Supabase después de iniciar sesión, y la base
  de datos (políticas RLS) solo entrega a cada habitante **su** vivienda; el admin recibe todas.
  Por eso aunque alguien abra el código de la página no encuentra datos de nadie.

## Modo demo (solo si vacías SUPABASE_URL y restauras demo-data.js)
Mientras `config.js` tenga `SUPABASE_URL` vacío, el sitio usa cuentas de ejemplo:
`admin / admin123`, `casa004 / demo123`, `casa009 / demo123`, `casa002 / demo123` (esta no tiene lecturas válidas).
⚠️ En demo los datos viajan en `demo-data.js` y cualquiera puede verlos: no lo publiques así con datos reales.

## Pasar a producción (≈ 20 min)
1. **Supabase** (supabase.com, plan gratis) → *New project*. Guarda la contraseña de la base.
2. *SQL Editor* → pega `supabase/schema.sql` → *Run*.
3. *Authentication → Providers → Email*: **desactiva "Enable sign ups"** (las cuentas las creas tú).
   (Opcional: desactiva "Confirm email".)
4. *Project Settings → API*: copia **Project URL** y la clave **anon public** a `config.js`.
   La clave **service_role** es secreta: solo se usa en tu computadora para los scripts.
5. En tu computadora:
   ```
   export SUPABASE_URL="https://xxxx.supabase.co"
   export SUPABASE_SERVICE_KEY="<service_role>"
   python3 supabase/cargar_datos.py ../data.json        # sube meta + 18 viviendas (sin nombres)
   python3 supabase/crear_usuarios.py usuarios.csv      # crea cuentas; escribe usuarios_con_claves.csv
   ```
   `usuarios.csv`: `usuario,rol,vivienda,password` (ver `usuarios_ejemplo.csv`). Si dejas la contraseña vacía se genera una.
   El usuario puede ser un nombre simple (`casa004`) o un correo real.
6. Publica el sitio estático en **Vercel** (recomendado) o Netlify:
   - Vercel → *Add New Project* → repo `ConsumoEnergetico` → Root Directory: `frontend` → Framework Preset: **Other**.
   - Sin build command. El directorio de publicación es la raíz del repo.
   - `vercel.json` ya copia las cabeceras de seguridad (CSP, etc.).
   - No subas `supabase/` ni scripts: están en `.vercelignore`.
7. Entra con `admin.lab` y con `casa004` para comprobar que cada uno ve lo suyo.

## Mantenimiento
- Restablecer una contraseña: vuelve a correr `crear_usuarios.py` con esa fila (la actualiza).
- Datos nuevos: vuelve a correr `cargar_datos.py` con el `data.json` nuevo (reemplaza lo anterior).
- Siguiente paso natural: que el colector de Tuya escriba directo en `vivienda_datos`/`meta` y el
  sitio muestre datos en vivo sin pasos manuales.

## Privacidad
- No se suben nombres de personas: las viviendas se identifican solo por código.
- `usuarios_con_claves.csv` contiene contraseñas: entrégalas y bórralo (ya está en `.gitignore`).
- Las sesiones se guardan en el navegador; "Cerrar sesión" las elimina.


## Gestión del desarrollo

El trabajo debe gestionarse mediante GitHub Issues y GitHub Projects. Consulta:

- `docs/management/PROJECT_CHARTER.md`: propósito, alcance y límites del producto.
- `docs/management/TECHNICAL_BASELINE.md`: línea base técnica revisada.
- `docs/management/ROADMAP.md`: fases y prioridades.
- `docs/management/WORKING_AGREEMENT.md`: reglas del equipo y desarrollo con IA.
- `docs/management/DEFINITION_OF_DONE.md`: criterio para aceptar una tarea.
- `docs/management/DAILY_CHECKIN.md`: plantilla de seguimiento diario.
- `docs/management/WEEKLY_REVIEW.md`: agenda semanal.
- `docs/management/INITIAL_BACKLOG.md`: primeras tareas recomendadas.
- `CONTRIBUTING.md`: proceso de contribución y Pull Requests.

Para revisar sintaxis JavaScript localmente, ejecuta `python3 scripts/check_js_syntax.py` (requiere Node.js). Es un chequeo inicial; no sustituye pruebas funcionales ni pruebas de las políticas RLS.
