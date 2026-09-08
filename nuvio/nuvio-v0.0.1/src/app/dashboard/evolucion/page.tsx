import Link from "next/link";
import { parseEvolutionIds } from "@/lib/evolution/parse-ids";
import {
  validateEvolutionSeries,
  orderEvolutionStudiesAsc,
  type SeriesInvalidReason,
} from "@/lib/evolution/selection";
import {
  buildEvolutionSeries,
  type EvolutionStudy as EngineStudy,
} from "@/lib/evolution/build-series";
import type { StudyType } from "@/lib/studies-utils";
import {
  getSeriesIncompatibilityMessage,
  getStudyTypeLabelNullable,
  type EvolutionContextStudy,
} from "@/lib/evolution/presentation";
import type { StudyAnalysis } from "@/lib/analysis/schema";
import { parseStoredAnalysis } from "@/lib/analysis/stored";
import { getStudy, getStudyAnalysis } from "@/lib/actions/studies";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { EvolutionSeriesContext } from "@/components/evolution/EvolutionSeriesContext";
import { EvolutionOverview } from "@/components/evolution/EvolutionOverview";
import { EvolutionParameterTable } from "@/components/evolution/EvolutionParameterTable";
import { EvolutionDisclaimer } from "@/components/evolution/EvolutionDisclaimer";

/**
 * Fase 10.5 — Página de evolución longitudinal de estudios.
 *
 * Ruta: `/dashboard/evolucion?ids=ID_A,ID_B,...` (2 a 10 estudios).
 *
 * Pipeline server-side:
 * 1. parseEvolutionIds valida la forma de la URL (rango, vacíos, duplicados).
 * 2. getStudy por cada ID verifica ownership (filtra por user_id).
 * 3. validateEvolutionSeries valida la serie resuelta (min/máx, tipo, ready).
 * 4. Se ordena por created_at ASC (semántica temporal de la evolución).
 * 5. getStudyAnalysis + parseStoredAnalysis leen los análisis almacenados.
 * 6. buildEvolutionSeries (Fase 10.4) construye los tracks de parámetros.
 *
 * Sin charts, sin IA en runtime, sin conversión de unidades y sin
 * interpretación clínica. Los errores son accesibles y no exponen
 * detalles internos del motor.
 */

/** Fila mínima de estudio que necesita la página para validar y mostrar. */
type StudyRow = {
  id: string;
  file_name: string;
  study_type: StudyType | null;
  status: string;
  analysis_status: string;
  created_at: string;
};

// ── Mensajes de validación de serie (análogos a los del motor) ──────────

const SERIES_VALIDATION_MESSAGES: Record<SeriesInvalidReason, string> = {
  not_enough_studies:
    "Se necesitan al menos dos estudios para ver una evolución.",
  too_many_studies:
    "La serie supera el máximo de estudios permitidos (10).",
  missing_study_type:
    "Uno de los estudios no tiene un tipo identificado.",
  mixed_study_type:
    "Los estudios seleccionados son de tipos diferentes y no pueden agruparse como una sola evolución.",
  not_ready:
    "Uno de los estudios todavía no está listo para evolucionar. Procesá y analizá todos los estudios de la serie primero.",
};

// ── Íconos inline (mismo estilo que el resto del dashboard) ─────────────

function WarningIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function SearchXIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM13.5 10.5l-3 3m0-3 3 3" />
    </svg>
  );
}

function DocumentSlashIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function SplitIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}

// ── CTA compartido ───────────────────────────────────────────────────────

function BackToStudiesLink() {
  return (
    <Link
      href="/dashboard/estudios"
      className="rounded-lg bg-violet px-4 py-2 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
    >
      Ir a mis estudios
    </Link>
  );
}

// ── Página ───────────────────────────────────────────────────────────────

export default async function EvolucionPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const parsed = parseEvolutionIds(ids);

  const header = (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mis estudios", href: "/dashboard/estudios" },
          { label: "Evolución" },
        ]}
      />
      <PageHeader
        title="Evolución de estudios"
        description="Recorré cómo se movieron tus valores entre estudios del mismo tipo."
      />
    </>
  );

  // ── Estado: IDs de URL inválidos ──────────────────────────
  if (!parsed.ok) {
    return (
      <div>
        {header}
        <EmptyState
          icon={<WarningIcon />}
          title="Evolución no disponible"
          description={parsed.message}
          action={<BackToStudiesLink />}
        />
      </div>
    );
  }

  // ── Carga de estudios (ownership verificado server-side) ──
  const fetched = await Promise.all(
    parsed.ids.map(async (id): Promise<StudyRow | null> => {
      try {
        const row = await getStudy(id);
        return {
          id: row.id,
          file_name: row.file_name,
          study_type: row.study_type as StudyType | null,
          status: row.status,
          analysis_status: row.analysis_status,
          created_at: row.created_at,
        };
      } catch {
        return null;
      }
    }),
  );

  if (fetched.some((row) => row === null)) {
    return (
      <div>
        {header}
        <EmptyState
          icon={<SearchXIcon />}
          title="Estudio no encontrado"
          description="No pudimos encontrar uno de los estudios de la serie o no tenés acceso a él. Verificá los IDs en la URL."
          action={<BackToStudiesLink />}
        />
      </div>
    );
  }

  const rows = fetched as StudyRow[];

  // ── Validación de la serie resuelta (min/máx, tipo, ready) ──
  const validation = validateEvolutionSeries(rows);
  if (!validation.valid && validation.reason) {
    return (
      <div>
        {header}
        <EmptyState
          icon={<WarningIcon />}
          title="No podemos armar la evolución"
          description={SERIES_VALIDATION_MESSAGES[validation.reason]}
          action={<BackToStudiesLink />}
        />
      </div>
    );
  }

  // ── Orden cronológico ASC (semántica temporal de la evolución) ──
  const ordered = orderEvolutionStudiesAsc(rows);

  // ── Carga y parseo de análisis almacenados ────────────────
  const parsedAnalyses = await Promise.all(
    ordered.map(async (row: StudyRow) => {
      try {
        const analysisRow = await getStudyAnalysis(row.id);
        return analysisRow?.analysis
          ? parseStoredAnalysis(analysisRow.analysis)
          : null;
      } catch {
        return null;
      }
    }),
  );

  if (parsedAnalyses.some((analysis): analysis is null => analysis === null)) {
    return (
      <div>
        {header}
        <EmptyState
          icon={<DocumentSlashIcon />}
          title="Análisis no disponible"
          description="Uno de los estudios todavía no tiene un análisis completo que podamos leer. Procesá y analizá todos los estudios de la serie antes de ver la evolución."
          action={<BackToStudiesLink />}
        />
      </div>
    );
  }

  // ── Ejecutar el motor de evolución (Fase 10.4) ──────────
  const engineInput: EngineStudy[] = ordered.map((row: StudyRow, i: number) => ({
    ...(parsedAnalyses[i] as StudyAnalysis),
    id: row.id,
    created_at: row.created_at,
  }));
  const result = buildEvolutionSeries({ studies: engineInput });

  // ── Estado defensivo: el motor no encontró serie comparable ──
  if (!result.comparable) {
    return (
      <div>
        {header}
        <div className="rounded-xl border border-warning/30 bg-warning-tint p-5">
          <div className="mb-2 flex items-center gap-2">
            <SplitIcon />
            <h2 className="text-[15px] font-medium text-foreground">
              No podemos armar la evolución
            </h2>
          </div>
          <p className="text-[14px] leading-[1.6] text-foreground/80">
            {getSeriesIncompatibilityMessage(result.incompatibility.kind)}
          </p>
          <div className="mt-4">
            <BackToStudiesLink />
          </div>
        </div>
      </div>
    );
  }

  const contextStudies: EvolutionContextStudy[] = ordered.map((row) => ({
    id: row.id,
    file_name: row.file_name,
    created_at: row.created_at,
    study_type: row.study_type,
  }));

  const typeLabel = getStudyTypeLabelNullable(
    result.studyType as StudyType | null,
  );

  return (
    <div>
      {header}
      <div className="space-y-6">
        <EvolutionSeriesContext
          studies={contextStudies}
          typeLabel={typeLabel}
        />

        <EvolutionOverview overall={result.overall} />

        <section aria-labelledby="evolution-parameters-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="evolution-parameters-heading"
              className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Evolución por parámetro
            </h2>
            <span className="text-[12px] text-muted-foreground">
              {result.parameters.length} parámetros
            </span>
          </div>
          <EvolutionParameterTable
            parameters={result.parameters}
            studies={contextStudies}
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            La letra de cada columna corresponde a la tarjeta del estudio en
            la serie (orden cronológico).
          </p>
        </section>

        <EvolutionDisclaimer />
      </div>
    </div>
  );
}