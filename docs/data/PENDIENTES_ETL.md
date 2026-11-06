# Pendientes del ETL

Cosas detectadas durante la construcción del ETL que **no** se implementaron todavía
y quedan anotadas para después. Cada una incluye evidencia y criterios de aceptación.

---

## P-01 — Regla de plausibilidad para la energía horaria (`e` / `rev`)

**Estado:** pendiente · **Prioridad:** media · **Área:** Datos / ETL
**Decidido en:** revisión del ETL con datos reales (comparativa `docs/data/comparativa.html`).

### Problema

En horas donde el contador acumulado del medidor
(`forward_energy_total_kwh` / `reverse_energy_total_kwh`) salta mucho entre dos
lecturas que caen en la misma hora, el delta horario sale desproporcionado y el
consumo (`e`) queda inflado.

Las lecturas **no** están congeladas —el valor del contador cambia—, así que la
detección de congelamiento (`cls=1`) no lo detecta y la hora se marca como
confiable (`cls=0`).

### Evidencia (CSV reales, 2026-09-02 → 2026-09-07)

Ejemplos de `e` por vivienda y hora, imposibles a 120 V / 8 A:

| Vivienda | Hora (índice) | `e` publicado (kWh) |
|---|---|---|
| Vivienda-002 | 14 y 131 | 2278.8 |
| Vivienda-004 | 131 | 2138.8 |
| Vivienda-007 | 131 | 1058.3 |
| Vivienda-010 | 131 | 1123.4 |

Efecto agregado: el **consumo total** del ETL (~18 897 kWh en 144 h) resulta
mayor que un dataset completo equivalente, pese a que solo ~2 % de las horas
tiene lectura confiable.

### Propuesta

Añadir al ETL una comprobación de plausibilidad sobre el delta de energía
por hora, antes de publicar `e` / `rev`:

1. Calcular la potencia implícita del delta: `p_impl = e_delta / 1 h`.
2. Si `p_impl` supera un umbral imposible para la instalación (p. ej. varias
   veces `power_sum_w` de esa hora, o un máximo absoluto acordado), descartar el
   delta y marcar la hora como no confiable.
3. Decidir explícitamente qué código usar en ese caso (`cls=1` congelado no
   aplica; se propone un código/serie nueva o reutilizar el hueco).

### Criterios de aceptación

- [ ] Una hora con delta de energía imposible **no** se publica como `cls=0`
      ni infla `e` / `rev`.
- [ ] El umbral queda documentado en `CONTRATO_DATOS.md`.
- [ ] El total del periodo deja de inflarse con los CSV reales de referencia.
- [ ] Se añade un caso al fixture/regresión que cubra un contador que salta.

### Referencias

- [`CONTRATO_DATOS.md`](CONTRATO_DATOS.md) — definición de `e`, `rev` y códigos `cls`.
- `backend/scripts/build_dataset.py` — `build_hour_values()`.
- [`comparativa.html`](comparativa.html) — cómo se ve el efecto agregado.
