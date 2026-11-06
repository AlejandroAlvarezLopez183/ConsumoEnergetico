#!/usr/bin/env python3
"""ETL: convierte los CSV crudos del recolector en el `data.json` que consume el panel.

Entrada : data/viviendas/*.csv  (una fila por ronda del recolector, formato ancho)
Salida  : data/data.json        (series horarias por vivienda, ver contrato)

El contrato está documentado en
`docs/data/CONTRATO_DATOS.md`. Opcionalmente sube el resultado a
Supabase (`--subir`) usando SUPABASE_URL y SUPABASE_SERVICE_KEY.

Todo dataset se valida contra las reglas del contrato (§8) antes de usarse: si no
las cumple, no se escribe ni se sube nada.

Uso:
  python3 scripts/build_dataset.py
  python3 scripts/build_dataset.py --entrada data/viviendas --salida data/data.json
  python3 scripts/build_dataset.py --dias 7 --dry-run
  python3 scripts/build_dataset.py --subir
  python3 scripts/build_dataset.py --validar data/data.json
"""
import argparse
import csv
import json
import math
import os
import urllib.error
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

LOCAL_TIMEZONE = ZoneInfo("America/Monterrey")

# Columnas propias de la fila de vivienda (no de un dispositivo).
BASE_COLUMNS = {
    "timestamp",
    "vivienda",
    "codigo_vivienda",
    "latitud",
    "longitud",
    "dispositivos_ok",
    "dispositivos_configurados",
    "total_power_w",
}

# Sufijos de columna por dispositivo que usa el ETL.
F_POWER = "power_sum_w"
F_VA = "phase_a_voltage_v"
F_VB = "phase_b_voltage_v"
F_FA = "phase_a_frequency_hz"
F_PFA = "phase_a_power_factor"
F_PFB = "phase_b_power_factor"
F_E_FWD = "forward_energy_total_kwh"
F_E_REV = "reverse_energy_total_kwh"

# Códigos de calidad (ver contrato §7).
CLS_OK = 0
CLS_CONGELADO = 1
CLS_HUECO = 2
CLS_CAIDA = 3

# Enumeraciones de estado (contrato §6).
ESTADOS_VIVIENDA = {"good", "warn", "crit"}
ESTADOS_SENSOR = {"OK", "INTERMITENTE", "SIN_VOLTAJE", "CONGELADO", "SIN_DATOS"}

# Rangos plausibles para la validación del contrato §8 (regla 5).
VA_MIN, VA_MAX = 90.0, 150.0  # V (nominal ~127 V, normal 114.3–139.7)
F_MIN, F_MAX = 55.0, 65.0  # Hz (nominal 60)
MAX_ERRORES = 50


def parse_timestamp(text):
    """Convierte un timestamp ISO (con o sin zona) a hora local de Monterrey."""

    dt = datetime.fromisoformat(text)
    if dt.tzinfo is not None:
        dt = dt.astimezone(LOCAL_TIMEZONE).replace(tzinfo=None)
    return dt


def to_float(value):
    """Convierte a float; devuelve None si está vacío o no es numérico."""

    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def fmt_ts(dt):
    """Formato del contrato para `inicio`, `datos_desde`, `datos_hasta`."""

    return dt.strftime("%Y-%m-%dT%H:%M")


def fmt_outage(dt):
    """Formato del contrato para los tramos de `caidas_sistema`."""

    return dt.strftime("%Y-%m-%d %H:%M")


def detect_devices(fieldnames):
    """Devuelve {codigo_dispositivo: set(campos)} a partir del encabezado."""

    devices = {}

    for column in fieldnames:

        if column in BASE_COLUMNS or "_" not in column:
            continue

        code, field = column.split("_", 1)

        devices.setdefault(code, set()).add(field)

    return devices


def read_viviendas(data_dir):
    """Lee todos los CSV y los agrupa por código de vivienda."""

    viviendas = {}

    for csv_path in sorted(Path(data_dir).glob("*.csv")):

        with csv_path.open("r", newline="", encoding="utf-8") as file:

            reader = csv.DictReader(file)
            devices = detect_devices(reader.fieldnames or [])
            rows = list(reader)

        if not rows:
            continue

        codigo = rows[0].get("codigo_vivienda") or csv_path.stem

        entry = viviendas.setdefault(
            codigo,
            {
                "nombre": rows[0].get("vivienda"),
                "lat": to_float(rows[0].get("latitud")),
                "lon": to_float(rows[0].get("longitud")),
                "devices": {},
                "rows": [],
            },
        )

        for code, fields in devices.items():
            entry["devices"].setdefault(code, set()).update(fields)

        for row in rows:
            try:
                ts = parse_timestamp(row["timestamp"])
            except (KeyError, ValueError):
                continue
            entry["rows"].append((ts, row))

    return viviendas


def voltage_reading(value):
    """Voltaje utilizable; 0 o fuera del rango plausible se trata como no medido."""

    return value if value is not None and VA_MIN <= value <= VA_MAX else None


def frequency_reading(value):
    """Frecuencia utilizable; 0 o fuera del rango plausible se trata como no medida."""

    return value if value is not None and F_MIN <= value <= F_MAX else None


def device_sample(row, device, fields):
    """Extrae los valores relevantes de un dispositivo en una fila."""

    def get(field):
        return to_float(row.get(f"{device}_{field}")) if field in fields else None

    return {
        "power_w": get(F_POWER),
        "va": voltage_reading(get(F_VA)),
        "vb": voltage_reading(get(F_VB)),
        "f": frequency_reading(get(F_FA)),
        "pfa": get(F_PFA),
        "pfb": get(F_PFB),
        "e_fwd": get(F_E_FWD),
        "e_rev": get(F_E_REV),
    }


def same_reading(a, b):
    """True si dos muestras comparten los mismos valores (sensor congelado)."""

    pairs = [
        (a[key], b[key])
        for key in ("power_w", "va", "vb", "f", "e_fwd", "e_rev")
        if a[key] is not None and b[key] is not None
    ]

    return bool(pairs) and all(x == y for x, y in pairs)


def build_device_series(samples_by_hour, horas, down_hours):
    """Calcula la serie `cls` y las estadísticas de un dispositivo."""

    cls = [None] * horas
    last_rep = None
    repeat_value = None

    for k in range(horas):

        samples = samples_by_hour.get(k)

        if not samples:
            cls[k] = CLS_CAIDA if k in down_hours else CLS_HUECO
            continue

        rep = samples[-1]

        if last_rep is not None and same_reading(rep, last_rep):
            cls[k] = CLS_CONGELADO
            if repeat_value is None:
                repeat_value = rep
        else:
            cls[k] = CLS_OK

        last_rep = rep

    return cls, repeat_value


def longest_run(cls, code):
    """Duración del tramo más largo con el código dado."""

    best = current = 0
    for value in cls:
        current = current + 1 if value == code else 0
        best = max(best, current)
    return best


def classify_sensor(cls, tiene_voltaje):
    """Estado del sensor según sus códigos de calidad (ver contrato §6)."""

    ok = cls.count(CLS_OK)
    frozen = cls.count(CLS_CONGELADO)
    gap = cls.count(CLS_HUECO)
    down = cls.count(CLS_CAIDA)

    if ok == 0 and frozen == 0:
        return "SIN_DATOS"

    if frozen > 0 and frozen >= ok:
        return "CONGELADO"

    if not tiene_voltaje:
        return "SIN_VOLTAJE"

    if frozen + gap + down > 0:
        return "INTERMITENTE"

    return "OK"


def sensor_record(codigo, vivienda, cls, repeat_value, tiene_voltaje):
    """Construye el objeto sensor del contrato."""

    horas = len(cls)
    frozen = cls.count(CLS_CONGELADO)
    no_confiable = sum(1 for c in cls if c != CLS_OK)

    repetido = None
    if frozen and repeat_value is not None:
        repetido = {
            "p_w": repeat_value.get("power_w"),
            "v": repeat_value.get("va"),
        }

    return {
        "codigo": codigo,
        "vivienda": vivienda,
        "estado": classify_sensor(cls, tiene_voltaje),
        "cls": cls,
        "pct_congelado": round(100 * frozen / horas, 1) if horas else 0.0,
        "tramo_congelado_max_h": longest_run(cls, CLS_CONGELADO),
        "huecos_sensor": cls.count(CLS_HUECO),
        "tiene_voltaje": tiene_voltaje,
        "pct_no_confiable": round(100 * no_confiable / horas, 1) if horas else 0.0,
        "repetido": repetido,
    }


def mean(values):
    """Promedio ignorando None; None si no hay valores."""

    clean = [v for v in values if v is not None]
    return sum(clean) / len(clean) if clean else None


def build_hour_values(samples, total_power):
    """Agrega los valores de una hora a nivel vivienda."""

    p_w = total_power if total_power is not None else sum(
        s["power_w"] for s in samples if s["power_w"] is not None
    )

    p = p_w / 1000
    pf = mean([v for s in samples for v in (s["pfa"], s["pfb"])])

    if pf:
        s_apparent = p / pf
        q = math.sqrt(max(s_apparent ** 2 - p ** 2, 0))
    else:
        s_apparent = q = None

    fwd = [s["e_fwd"] for s in samples if s["e_fwd"] is not None]
    rev = [s["e_rev"] for s in samples if s["e_rev"] is not None]

    e_delta = (max(fwd) - min(fwd)) if len(fwd) >= 2 else 0
    rev_delta = (max(rev) - min(rev)) if len(rev) >= 2 else 0

    return {
        "e": round(e_delta, 3) if e_delta > 0 else round(p, 3),
        "rev": round(max(rev_delta, 0), 3),
        "p": round(p, 3),
        "s": round(s_apparent, 3) if s_apparent is not None else None,
        "q": round(q, 3) if q is not None else None,
        "pf": round(pf, 3) if pf is not None else None,
        "va": round(mean([s["va"] for s in samples]), 1)
        if mean([s["va"] for s in samples]) is not None
        else None,
        "vb": round(mean([s["vb"] for s in samples]), 1)
        if mean([s["vb"] for s in samples]) is not None
        else None,
        "f": round(mean([s["f"] for s in samples]), 2)
        if mean([s["f"] for s in samples]) is not None
        else None,
    }


VALUE_FIELDS = ("e", "rev", "p", "s", "q", "pf", "va", "vb", "f")


def build_vivienda(entry, inicio, horas, down_hours):
    """Construye una vivienda completa (series + sensores) del contrato."""

    devices = sorted(entry["devices"])

    # Muestras por dispositivo y por hora.
    samples = {device: {} for device in devices}
    total_by_hour = {}

    for ts, row in entry["rows"]:

        k = int((ts - inicio).total_seconds() // 3600)
        if not 0 <= k < horas:
            continue

        for device in devices:
            sample = device_sample(row, device, entry["devices"][device])
            if any(sample[key] is not None for key in sample):
                samples[device].setdefault(k, []).append(sample)

        total = to_float(row.get("total_power_w"))
        if total is not None:
            total_by_hour.setdefault(k, []).append(total)

    # Series por dispositivo (para cls y estadísticas de sensores).
    device_cls = {}
    sensores = []

    for device in devices:

        cls, repeat_value = build_device_series(samples[device], horas, down_hours)
        device_cls[device] = cls

        tiene_voltaje = any(
            sample["va"] is not None
            for hour_samples in samples[device].values()
            for sample in hour_samples
        )

        sensores.append(
            sensor_record(device, entry["codigo"], cls, repeat_value, tiene_voltaje)
        )

    # Serie `cls` de la vivienda: buena si algún dispositivo tiene dato fresco.
    cls_vivienda = []
    series = {field: [] for field in VALUE_FIELDS}

    for k in range(horas):

        reporting = [d for d in devices if k in samples[d]]

        if not reporting:
            cls_vivienda.append(CLS_CAIDA if k in down_hours else CLS_HUECO)
            for field in VALUE_FIELDS:
                series[field].append(None)
            continue

        fresh = any(device_cls[d][k] == CLS_OK for d in reporting)
        cls_vivienda.append(CLS_OK if fresh else CLS_CONGELADO)

        if cls_vivienda[-1] != CLS_OK:
            for field in VALUE_FIELDS:
                series[field].append(None)
            continue

        flat = [s for d in reporting for s in samples[d][k]]
        total = mean(total_by_hour.get(k))
        values = build_hour_values(flat, total)

        for field in VALUE_FIELDS:
            series[field].append(values[field])

    reliable = cls_vivienda.count(CLS_OK)

    if reliable == 0:
        estado = "crit"
    elif reliable < horas:
        estado = "warn"
    else:
        estado = "good"

    vivienda = {
        "codigo": entry["codigo"],
        "lat": entry["lat"],
        "lon": entry["lon"],
        "estado": estado,
        **series,
        "cls": cls_vivienda,
    }

    return vivienda, sensores


def build_dataset(data_dir, dias):
    """Construye el objeto `data.json` completo."""

    viviendas_raw = read_viviendas(data_dir)

    if not viviendas_raw:
        raise SystemExit(f"No hay CSV en {data_dir}")

    # Ventana temporal: medianoche del primer día hasta el último día con datos.
    all_ts = [ts for entry in viviendas_raw.values() for ts, _ in entry["rows"]]

    first_day = min(all_ts).replace(hour=0, minute=0, second=0, microsecond=0)
    last_day = max(all_ts).replace(hour=0, minute=0, second=0, microsecond=0)

    if dias and dias > 0:
        earliest = last_day - timedelta(days=dias - 1)
        inicio = max(first_day, earliest)
    else:
        inicio = first_day

    total_days = (last_day - inicio).days + 1
    horas = total_days * 24

    # Horas sin ninguna lectura en toda la plataforma = caída del sistema.
    global_hours = set()
    for entry in viviendas_raw.values():
        for ts, _ in entry["rows"]:
            k = int((ts - inicio).total_seconds() // 3600)
            if 0 <= k < horas:
                global_hours.add(k)

    down_hours = {k for k in range(horas) if k not in global_hours}

    viviendas = []
    sensores = []

    for codigo in sorted(viviendas_raw):
        entry = viviendas_raw[codigo]
        entry["codigo"] = codigo
        vivienda, vivienda_sensores = build_vivienda(entry, inicio, horas, down_hours)
        viviendas.append(vivienda)
        sensores.extend(vivienda_sensores)

    # Tramos de caídas del sistema (horas consecutivas sin datos globales).
    caidas = []
    k = 0
    while k < horas:
        if k in down_hours:
            start = k
            while k + 1 < horas and (k + 1) in down_hours:
                k += 1
            caidas.append(
                [
                    fmt_outage(inicio + timedelta(hours=start)),
                    fmt_outage(inicio + timedelta(hours=k + 1)),
                ]
            )
        k += 1

    return {
        "inicio": fmt_ts(inicio),
        "horas": horas,
        "dias": total_days,
        "datos_desde": fmt_ts(min(all_ts)),
        "datos_hasta": fmt_ts(max(all_ts)),
        "caidas_sistema": caidas,
        "viviendas": viviendas,
        "sensores": sensores,
    }


def validate_dataset(dataset):
    """Valida el dataset contra las reglas del contrato §8 (SNRGY-07).

    Devuelve una lista de mensajes de error; vacía si el dataset es válido.
    """

    errors = []

    def add(message):
        if len(errors) < MAX_ERRORES:
            errors.append(message)
        elif len(errors) == MAX_ERRORES:
            errors.append("… (se omiten más errores)")

    if not isinstance(dataset, dict):
        return ["El dataset no es un objeto JSON."]

    horas = dataset.get("horas")
    dias = dataset.get("dias")

    if not isinstance(horas, int) or isinstance(horas, bool) or not isinstance(dias, int):
        add("meta inválida: `horas` y `dias` deben ser enteros.")
        horas = None
    elif horas != dias * 24:
        add(f"Regla 2: horas ({horas}) != dias x 24 ({dias * 24}).")

    viviendas = dataset.get("viviendas")
    sensores = dataset.get("sensores")

    if not isinstance(viviendas, list) or not isinstance(sensores, list):
        add("El dataset debe tener las listas `viviendas` y `sensores`.")
        return errors

    # Regla 7: sin campo `nombre` ni datos personales.
    if "nombre" in dataset:
        add("Regla 7: el dataset incluye el campo `nombre`.")
    for vivienda in viviendas:
        if isinstance(vivienda, dict) and "nombre" in vivienda:
            add(f"Regla 7: la vivienda {vivienda.get('codigo')} incluye `nombre`.")
    for sensor in sensores:
        if isinstance(sensor, dict) and "nombre" in sensor:
            add(f"Regla 7: el sensor {sensor.get('codigo')} incluye `nombre`.")

    # Regla 3: códigos únicos.
    codigos_vivienda = set()
    for vivienda in viviendas:
        codigo = vivienda.get("codigo") if isinstance(vivienda, dict) else None
        if codigo in codigos_vivienda:
            add(f"Regla 3: código de vivienda duplicado: {codigo}.")
        codigos_vivienda.add(codigo)

    codigos_sensor = set()
    for sensor in sensores:
        if not isinstance(sensor, dict):
            add("Sensor con formato inválido (no es objeto).")
            continue

        codigo = sensor.get("codigo")
        if codigo in codigos_sensor:
            add(f"Regla 3: código de sensor duplicado: {codigo}.")
        codigos_sensor.add(codigo)

        if sensor.get("vivienda") not in codigos_vivienda:
            add(
                "Regla 3: el sensor "
                f"{codigo} apunta a una vivienda inexistente: {sensor.get('vivienda')}."
            )

        if sensor.get("estado") not in ESTADOS_SENSOR:
            add(f"Regla 6: estado inválido en sensor {codigo}: {sensor.get('estado')!r}.")

        cls = sensor.get("cls")
        if not isinstance(cls, list):
            add(f"Regla 1: {codigo}.cls no es una lista.")
        elif horas is not None and len(cls) != horas:
            add(f"Regla 1: {codigo}.cls tiene {len(cls)} valores; se esperaban {horas}.")

    # Viviendas: reglas 1, 4, 5 y 6.
    for vivienda in viviendas:
        if not isinstance(vivienda, dict):
            add("Vivienda con formato inválido (no es objeto).")
            continue

        codigo = vivienda.get("codigo")

        if vivienda.get("estado") not in ESTADOS_VIVIENDA:
            add(f"Regla 6: estado inválido en vivienda {codigo}: {vivienda.get('estado')!r}.")

        cls = vivienda.get("cls")
        series = {field: vivienda.get(field) for field in VALUE_FIELDS}

        # Regla 1: todas las series miden `horas`.
        if horas is not None:
            for name, arr in [("cls", cls), *series.items()]:
                if not isinstance(arr, list):
                    add(f"Regla 1: {codigo}.{name} no es una lista.")
                elif len(arr) != horas:
                    add(
                        f"Regla 1: {codigo}.{name} tiene {len(arr)} valores; "
                        f"se esperaban {horas}."
                    )

        if not isinstance(cls, list):
            continue

        # Regla 4: cls[k] != 0 => series en k en null.
        for k, code in enumerate(cls):
            if code == CLS_OK or not isinstance(code, int):
                continue
            for field, arr in series.items():
                if isinstance(arr, list) and k < len(arr) and arr[k] is not None:
                    add(
                        f"Regla 4: {codigo}.{field}[{k}] debería ser null con cls={code}."
                    )

        # Regla 5: rangos plausibles.
        rangos = {
            "e": lambda v: v >= 0,
            "rev": lambda v: v >= 0,
            "pf": lambda v: 0 <= v <= 1,
            "va": lambda v: VA_MIN <= v <= VA_MAX,
            "vb": lambda v: VA_MIN <= v <= VA_MAX,
            "f": lambda v: F_MIN <= v <= F_MAX,
        }
        for field, en_rango in rangos.items():
            arr = series.get(field)
            if not isinstance(arr, list):
                continue
            for k, value in enumerate(arr):
                if value is None:
                    continue
                if isinstance(value, bool) or not isinstance(value, (int, float)):
                    add(f"Regla 5: {codigo}.{field}[{k}] no es numérico: {value!r}.")
                elif not en_rango(value):
                    add(f"Regla 5: {codigo}.{field}[{k}] fuera de rango: {value}.")

    return errors


def resumen_dataset(dataset):
    """Resumen legible de lo que contiene (y se cargaría) un dataset."""

    viviendas = dataset.get("viviendas", [])
    sensores = dataset.get("sensores", [])

    def contar(items, campo="estado"):
        conteo = {}
        for item in items:
            if isinstance(item, dict):
                conteo[item.get(campo)] = conteo.get(item.get(campo), 0) + 1
        return ", ".join(f"{clave}={valor}" for clave, valor in sorted(conteo.items(), key=str))

    return "\n".join(
        [
            f"  Periodo  : inicio {dataset.get('inicio')} · "
            f"{dataset.get('dias')} días · {dataset.get('horas')} h",
            f"  Lecturas : {dataset.get('datos_desde')} → {dataset.get('datos_hasta')}",
            f"  Viviendas: {len(viviendas)} [{contar(viviendas)}]",
            f"  Sensores : {len(sensores)} [{contar(sensores)}]",
            f"  Caídas   : {len(dataset.get('caidas_sistema', []))}",
        ]
    )


def upload_to_supabase(dataset):
    """Sube `meta` y `vivienda_datos` con la clave service_role (nunca en el navegador)."""

    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")

    if not url or not key:
        raise SystemExit(
            "Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY para --subir."
        )

    def upsert(table, rows):
        request = urllib.request.Request(
            f"{url}/rest/v1/{table}",
            method="POST",
            data=json.dumps(rows, ensure_ascii=False).encode(),
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
        )
        try:
            urllib.request.urlopen(request, timeout=60).read()
        except urllib.error.HTTPError as error:
            raise SystemExit(
                f"Error {error.code} en {table}: {error.read().decode()[:400]}"
            )

    meta = {
        key: dataset[key]
        for key in (
            "inicio",
            "horas",
            "dias",
            "datos_desde",
            "datos_hasta",
            "caidas_sistema",
        )
    }
    upsert("meta", [{"id": 1, "datos": meta}])

    filas = []
    for vivienda in dataset["viviendas"]:
        payload = dict(vivienda)
        payload["sensores_det"] = [
            s for s in dataset["sensores"] if s["vivienda"] == vivienda["codigo"]
        ]
        filas.append({"codigo": vivienda["codigo"], "datos": payload})

    for index in range(0, len(filas), 6):
        upsert("vivienda_datos", filas[index:index + 6])

    print(f"Subido a Supabase: meta + {len(filas)} viviendas.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--entrada", default="data/viviendas")
    parser.add_argument("--salida", default="data/data.json")
    parser.add_argument(
        "--dias",
        type=int,
        default=0,
        help="Limita a los últimos N días. 0 = todo el histórico.",
    )
    parser.add_argument("--subir", action="store_true", help="Sube a Supabase.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Construye y valida sin escribir el archivo ni subir a Supabase.",
    )
    parser.add_argument(
        "--validar",
        metavar="ARCHIVO",
        help="Solo valida un data.json existente contra el contrato y sale.",
    )
    args = parser.parse_args()

    # Modo solo-validación: no construye, solo revisa un archivo existente.
    if args.validar:
        dataset = json.loads(Path(args.validar).read_text(encoding="utf-8"))
        errors = validate_dataset(dataset)
        if errors:
            print(f"ERROR: {args.validar} NO cumple el contrato ({len(errors)} problema(s)):")
            for error in errors:
                print(f"  - {error}")
            raise SystemExit(1)
        print(f"OK: {args.validar} cumple el contrato (§8).")
        print(resumen_dataset(dataset))
        return

    dataset = build_dataset(args.entrada, args.dias)
    errors = validate_dataset(dataset)

    if errors:
        print(f"ERROR: el dataset generado NO cumple el contrato ({len(errors)} problema(s)):")
        for error in errors:
            print(f"  - {error}")
        print("No se escribió el archivo ni se subió nada.")
        raise SystemExit(1)

    print("OK: el dataset cumple el contrato (§8).")
    print(resumen_dataset(dataset))

    if args.dry_run:
        destino = "(dry-run) no se escribe el archivo ni se sube nada."
        if args.subir:
            destino = "(dry-run) se habría subido a Supabase; no se escribió ni subió nada."
        print(destino)
        return

    output = Path(args.salida)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(dataset, ensure_ascii=False), encoding="utf-8")
    print(f"data.json escrito en {output}.")

    if args.subir:
        upload_to_supabase(dataset)


if __name__ == "__main__":
    main()
