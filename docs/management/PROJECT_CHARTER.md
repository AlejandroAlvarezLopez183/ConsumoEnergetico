# Project Charter — SNRGY Viviendas

## Propósito

Mantener una plataforma web para que cada habitante consulte los datos energéticos de su propia vivienda y para que personal autorizado supervise el conjunto de viviendas, la calidad de las lecturas y las tendencias de consumo.

## Resultado principal

Una persona puede iniciar sesión y ver datos correctos y actualizados únicamente para los que tiene autorización. El administrador puede consultar las viviendas autorizadas y detectar dónde hay datos faltantes, antiguos o poco confiables.

## Usuarios y necesidades

### Habitante
- Iniciar/cerrar sesión.
- Consultar su vivienda asignada.
- Entender consumo, tendencias y calidad/actualidad de lecturas.
- Recibir explicaciones claras cuando faltan datos.

### Administrador
- Iniciar sesión con rol administrativo.
- Consultar el conjunto de viviendas permitido.
- Explorar mapa, tendencias, estado de sensores y calidad de datos.
- Identificar problemas de datos y dar seguimiento.

## Alcance del MVP actual

- Sitio web estático con páginas separadas para acceso, habitante y administración.
- Supabase Auth para identidad/sesión.
- Supabase PostgreSQL y Row Level Security (RLS) para acceso a datos.
- Carga inicial mediante scripts Python controlados.
- Despliegue web estático en Netlify.
- Pruebas verificables de inicio de sesión, separación de roles, lectura de datos y errores.

## Fuera del alcance inmediato

- Reescribir todo el sitio en React/Vue u otro framework.
- Añadir un servidor backend propio sin una necesidad demostrada.
- Sustituir Supabase o Netlify por moda o preferencia personal.
- Desarrollar IA avanzada o predicción sin datos confiables y una hipótesis validada.
- Automatizar el control eléctrico o enviar comandos a equipos.
- Rediseñar todas las tablas a la vez.
- Agregar funcionalidades no acordadas en el roadmap.

## Principios de producto

1. Privacidad y separación de viviendas antes que funciones nuevas.
2. Exactitud, trazabilidad y actualidad de los datos antes que nuevos gráficos.
3. Cambios pequeños, reversibles y verificables.
4. No mostrar como real un dato simulado o una estimación no validada.
5. No ampliar el alcance de una tarea sin autorización del responsable de producto.

## Criterios de éxito del MVP

- El habitante A no puede leer información de la vivienda B, ni manipulando URL, HTML o consultas del navegador.
- El administrador puede acceder a la información que le corresponde.
- Los usuarios sin sesión no pueden consultar datos privados.
- Errores de red, falta de datos y lecturas obsoletas tienen una respuesta comprensible.
- Se puede repetir el proceso de carga sin duplicar viviendas ni corromper el estado.
- Existe evidencia de pruebas para cada release.

## Decisiones de arquitectura vigentes

- Frontend: HTML, CSS y JavaScript existentes.
- Backend administrado: Supabase Auth + PostgreSQL + RLS.
- Hosting estático: Netlify.
- Scripts operativos: Python.

Cambiar cualquiera de estas decisiones requiere una propuesta escrita con problema, alternativas, costo, riesgo y plan de migración. No es una decisión unilateral de quien implementa una tarea.
