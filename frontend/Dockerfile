FROM nginx:1.27-alpine

# Configuración del servidor (cabeceras de seguridad + CSP, equivalentes a netlify.toml).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Solo se publica lo que el navegador necesita.
# Los scripts de supabase/ y docs/ NO se copian (contienen credenciales/operaciones).
COPY index.html mi-vivienda.html admin.html config.js logo.png /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY vendor /usr/share/nginx/html/vendor

EXPOSE 80
