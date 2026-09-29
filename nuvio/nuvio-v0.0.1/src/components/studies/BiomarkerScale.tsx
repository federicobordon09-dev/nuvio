interface BiomarkerScaleProps {
  /** Nombre real de la medición (payload `Measurement.name`). */
  name: string;
  /** Valor crudo del payload (`Measurement.value`). */
  value: string;
  /** Unidad cruda del payload (`Measurement.unit`). */
  unit?: string | null;
  /** Rango de referencia crudo del payload (`Measurement.reference_range`). */
  referenceRange: string;
}

type Bounds = { min: number | null; max: number | null };

type Geometry = {
  /** Zona segura (sage) dentro de la barra, en %. */
  zoneLeft: number;
  zoneWidth: number;
  /** Posición del marcador plum, en %. */
  markerPct: number;
  /** Anclaje del chip de valor: 0 (izq), 50 (centro), 100 (der). */
  chipAnchor: number;
};

const PAD_RATIO = 0.15;

function toNumber(raw: string): number {
  const n = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : Number.NaN;
}

/**
 * Interpreta un rango de referencia escrito en texto libre.
 * Soporta: "70-110", "70 - 110", "0.7-1.3", "<100", ">50", "≤ 200".
 * Devuelve null cuando no hay dos límites interpretables — en ese caso
 * NO se dibuja ninguna escala (nunca se inventa un rango).
 */
function parseBounds(raw: string): Bounds | null {
  const text = raw.trim();
  if (!text) return null;

  const numbers = text.match(/\d+(?:[.,]\d+)?/g);
  if (!numbers || numbers.length === 0) return null;

  if (numbers.length === 1) {
    const only = toNumber(numbers[0]);
    if (Number.isNaN(only)) return null;
    if (/^\s*[<≤]/.test(text)) return { min: null, max: only };
    if (/^\s*[>≥]/.test(text)) return { min: only, max: null };
    // Un número suelto sin operador no es un rango.
    return null;
  }

  const first = toNumber(numbers[0]);
  const second = toNumber(numbers[1]);
  if (Number.isNaN(first) || Number.isNaN(second)) return null;

  const min = Math.min(first, second);
  const max = Math.max(first, second);
  if (!(max > min)) return null;
  return { min, max };
}

/** Primer número del valor crudo, o null si no es numérico. */
function parseValue(raw: string): number | null {
  const match = raw.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const n = toNumber(match[0]);
  return Number.isNaN(n) ? null : n;
}

/**
 * Convierte rango + valor en geometría de la barra.
 * El dominio se deriva SOLO de esos dos datos reales (con un respiro
 * proporcional para que el marcador no quede pegado al borde).
 */
function buildGeometry(bounds: Bounds, value: number): Geometry | null {
  const { min, max } = bounds;

  let domainMin: number;
  let domainMax: number;

  if (min !== null && max !== null) {
    domainMin = Math.min(min, value);
    domainMax = Math.max(max, value);
  } else if (max !== null) {
    // Límite superior únicamente (p. ej. "<100").
    domainMin = Math.min(value, max);
    domainMax = max;
  } else if (min !== null) {
    // Límite inferior únicamente (p. ej. ">50").
    domainMin = min;
    domainMax = Math.max(value, min);
  } else {
    return null;
  }

  if (!(domainMax > domainMin)) return null;

  const span = domainMax - domainMin;
  const pad = span * PAD_RATIO;
  domainMin -= pad;
  domainMax += pad;
  const full = domainMax - domainMin;
  if (!(full > 0)) return null;

  const pct = (n: number) => ((n - domainMin) / full) * 100;

  let zoneLeft = 0;
  let zoneWidth = 100;
  if (min !== null && max !== null) {
    zoneLeft = pct(min);
    zoneWidth = pct(max) - pct(min);
  } else if (max !== null) {
    zoneWidth = pct(max);
  } else if (min !== null) {
    zoneLeft = pct(min);
    zoneWidth = 100 - zoneLeft;
  }

  if (!(zoneWidth > 0)) return null;
  zoneLeft = Math.min(Math.max(zoneLeft, 0), 100);
  zoneWidth = Math.min(zoneWidth, 100 - zoneLeft);

  const markerPct = Math.min(Math.max(pct(value), 0), 100);
  const chipAnchor = markerPct < 18 ? 0 : markerPct > 82 ? 100 : 50;

  return { zoneLeft, zoneWidth, markerPct, chipAnchor };
}

/**
 * Biomarker Reference Scale (DESIGN.md → componente especializado).
 *
 * Barra horizontal: track neutro (tinte lila), zona segura sage y marcador
 * plum de 14px con chip integrado que muestra el valor y la unidad.
 *
 * Todos los números visibles salen del payload (`value`, `unit`,
 * `reference_range`). Si el rango o el valor no son interpretables no se
 * dibuja ninguna escala: queda solo el texto del rango, nunca un rango
 * inventado.
 */
export function BiomarkerScale({
  name,
  value,
  unit,
  referenceRange,
}: BiomarkerScaleProps) {
  const bounds = parseBounds(referenceRange);
  const numericValue = parseValue(value);

  const geometry =
    bounds && numericValue !== null
      ? buildGeometry(bounds, numericValue)
      : null;

  if (!geometry) {
    // Sin escala dibujable: al menos el rango real, tal como viene.
    return (
      <p className="text-caption text-muted-foreground">
        Rango indicado:{" "}
        <span className="font-medium tabular-nums text-foreground">
          {referenceRange}
        </span>
      </p>
    );
  }

  const { zoneLeft, zoneWidth, markerPct, chipAnchor } = geometry;
  const chip = unit ? `${value} ${unit}` : value;
  const ariaLabel =
    `Escala de referencia de ${name}: valor ${chip}. ` +
    `Rango de referencia ${referenceRange}. ` +
    "La franja sage marca el tramo dentro del rango de referencia.";

  return (
    <div role="img" aria-label={ariaLabel} className="mt-3">
      {/* Chip del valor (tooltip integrado del marcador) */}
      <div className="relative mb-1 h-5">
        <span
          className="absolute bottom-0 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold leading-4 tracking-[0.04em] tabular-nums text-primary-foreground shadow-sm"
          style={{
            left: `${markerPct}%`,
            transform: `translateX(-${chipAnchor}%)`,
          }}
        >
          {chip}
        </span>
      </div>

      {/* Track neutro + zona segura + marcador plum de 14px */}
      <div className="relative h-1.5 rounded-full bg-primary-muted">
        <div
          className="absolute inset-y-0 rounded-full bg-success-tint"
          style={{ left: `${zoneLeft}%`, width: `${zoneWidth}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-surface shadow-sm"
          style={{ left: `${markerPct}%` }}
        />
      </div>

      {/* Leyenda + rango real (sin números inventados) */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-caption">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span
            aria-hidden="true"
            className="h-2 w-4 rounded-full bg-success-tint ring-1 ring-border"
          />
          Dentro del rango de referencia
        </span>
        <span className="text-muted-foreground">
          Rango indicado:{" "}
          <span className="font-medium tabular-nums text-foreground">
            {referenceRange}
          </span>
        </span>
      </div>
    </div>
  );
}
