# Mejoras a implementar antes de diciembre

## Objetivo general

Pasar de un recolector basado en ejecuciones periódicas cada 10 minutos a un
servicio local capaz de recibir mediciones con mayor frecuencia y de operar de
forma estable en una Raspberry Pi 3 Model B+. El objetivo operativo inicial es
aproximarse a una muestra por segundo, sin asumir que cualquier integración
alcance exactamente 1 Hz.

## 1. Script de instalación

Crear un script único de instalación para Linux/Raspberry Pi OS que configure
el proyecto desde cero.

### Debe realizar

- Detectar arquitectura ARM y versión del sistema.
- Verificar Docker y Docker Compose; instalarlos si no están disponibles.
- Copiar los archivos `.env.example` y `config/*.example.json`.
- Solicitar de forma segura las variables de configuración y los secretos.
- Descargar o construir la imagen compatible con la Raspberry Pi.
- Crear los servicios y habilitar el arranque automático.
- Crear directorios persistentes para datos y registros.
- Mostrar el estado final y una prueba rápida de funcionamiento.
- Permitir desinstalar o actualizar sin borrar los datos.

### Criterio de aceptación

Una Raspberry Pi limpia puede quedar operativa ejecutando un único comando,
reiniciarse y continuar recolectando sin volver a ejecutar el instalador.

## 2. Adaptación del backend para Raspberry Pi 3 Model B+

Modificar el backend y su despliegue para que sean compatibles y eficientes
con hardware limitado.

### Cambios requeridos

- Mantener una imagen Docker compatible con ARM32/ARMv7.
- Reducir el consumo de memoria y definir límites razonables por contenedor.
- Separar la recolección de datos, el ETL y el almacenamiento persistente.
- Añadir un proceso supervisado que se reinicie ante fallos.
- Registrar errores, reinicios, latencia y hora de la última lectura.
- Persistir datos localmente y sincronizarlos con Supabase después.
- Tener una cola o almacenamiento temporal para lecturas perdidas por red.
- Evitar reinicios completos del sistema ante un fallo puntual.
- Documentar puertos, variables, volúmenes y comandos de actualización.

### Criterio de aceptación

El backend permanece activo al menos 24 horas en la Raspberry Pi y conserva
los datos ante reinicios, pérdida breve de red y reinicio del contenedor.

## 3. Investigación de frecuencia de muestreo

El objetivo de “prácticamente cada segundo” requiere probar primero qué canal
puede entregar esa frecuencia.

### Estado actual

El proyecto consulta la API de Tuya Cloud y usa un intervalo predeterminado de
600 segundos. El nuevo código debe dejar de considerar 10 minutos como el único
modo permitido y admitir intervalos configurables.

### Riesgo de los tokens y la API

Los tokens de acceso de Tuya son credenciales temporales; un token activo no
significa una cantidad ilimitada de consultas. Las llamadas al API pueden
agotar cuota, producir límites de velocidad o dejar de responder. Debe medirse
qué consume una ronda de 1 segundo y compararlo con el plan contratado antes
de operar de esa manera.

### Prueba obligatoria

Crear una prueba durante una ventana corta que mida:

- Lecturas recibidas por minuto.
- Tiempo real de respuesta de Tuya.
- Cambios de datos entre lecturas consecutivas.
- Errores HTTP y límites de velocidad.
- Uso de memoria y CPU en la Raspberry Pi.
- Consumo de cuota o llamadas durante la prueba.

### Criterio de aceptación

La frecuencia soportada queda documentada con una medición real. Si 1 Hz no es
posible mediante API, se implementa la mayor frecuencia estable disponible y
se registra esa limitación.

## 4. Evaluación de recepción directa del medidor

Determinar si el servidor puede recibir datos producidos por el medidor
“Monitor de Energía Inteligente WiFi AC100-240V, 80A”.

### Pasos

- Confirmar si el medidor expone localmente MQTT, UDP, HTTP, WebSocket o una
  API/rest.
- Identificar modelo exacto, firmware y chip WiFi.
- Comprobar si el protocolo es abierto o si depende de Tuya Cloud.
- Revisar si existe una integración local ya disponible y mantenida.
- Probar desde la red local sin desconectar el control de Tuya.
- Registrar las lecturas originales antes de normalizarlas.

### Resultado esperado

Una decisión documentada: integración local posible, integración local
bloqueada o dependencia obligatoria de Tuya Cloud.

No debe asumirse que tener un servidor activo hace que el medidor envíe datos:
el medidor debe tener un mecanismo activo de publicación o el servidor debe
acceder a un flujo/puerto disponible.

## 5. Puente con ESP32

Preparar la opción de usar una ESP32 como nodo cercano al medidor o a su red
eléctrica.

### Datos que puede recopilar

Evaluar, según el modelo y el protocolo disponible:

- Voltaje.
- Corriente.
- Potencia activa.
- Energía acumulada.
- Frecuencia.
- Estado de conexión.
- Marca de tiempo y contador de secuencia.

### Diseño propuesto

1. La ESP32 recibe datos del medidor o de su integración local.
2. Agrupa y valida las lecturas en intervalos de 1 segundo cuando el origen lo
   permite.
3. Envía lotes por MQTT o HTTPS a un endpoint autenticado del servidor.
4. La Raspberry Pi recibe, valida y almacena las muestras.
5. Supabase recibe datos consolidados o los lotes confirmados.
6. Ante caída de red, la ESP32 conserva temporalmente una cola en memoria o
   almacenamiento disponible.

### Seguridad

- Usar identificador único por dispositivo.
- Firmar o autenticar cada mensaje.
- No incluir secretos permanentes en el firmware público.
- Permitir revocación de credenciales.
- Validar tipos, rangos, timestamp y orden de las muestras.
- Mantener un canal separado para firmware y actualización.

### Criterio de aceptación

La ESP32 publica datos a la Raspberry Pi y la Raspberry Pi los persiste con
timestamp local, sin depender continuamente de una consulta a Tuya Cloud.

## 6. Servidor de recepción

El backend debe implementar un endpoint o broker para recepción cuando se
incorporen otras fuentes además de Tuya Cloud.

### Requisitos

- Healthcheck y estado operativo.
- Endpoint autenticado para lotes de mediciones.
- Validación de esquema y rechazo de datos inválidos.
- Idempotencia mediante ID o timestamp de lectura.
- Logs sin secretos ni datos innecesarios.
- Backpressure o limitación de solicitudes.
- Descubrimiento de lecturas atrasadas y duplicadas.

### Criterio de aceptación

El servidor registra una muestra proveniente de ESP32 o otro receptor una sola
vez y expone su hora de recepción y su hora de origen.

## 7. Estrategia sugerida

La implementación se debe dividir en pruebas progresivas:

1. Finalizar el script de instalación.
2. Adaptar y medir el backend en Raspberry Pi.
3. Probar el intervalo configurable con Tuya Cloud.
4. Medir límites y consumo de cuota.
5. Investigar el protocolo local del medidor.
6. Construir un prototipo ESP32 si la vía local no está disponible.
7. Integrar ESP32 o receptor directo al backend.
8. Ejecutar una prueba completa de persistencia y recuperación.

La primera arquitectura que se publique no debe depender de una frecuencia
del 100 % hasta haber demostrado capacidad real. Lo recomendable es mantener
Tuya como respaldo mientras se valida una lectura local.

## 8. Definición de terminado

Antes de considerar completas las mejoras:

- Existe una instalación reproducible.
- El sistema arranca automáticamente en Raspberry Pi.
- Se conoce y documenta la frecuencia real conseguida.
- Se valida el consumo de cuota de Tuya.
- Existe una decisión técnica sobre integración directa o ESP32.
- Hay persistencia local y recuperación ante fallos.
- El flujo está documentado y puede ser probado por otra persona.
- No se incluyen credenciales ni secretos en el repositorio.
