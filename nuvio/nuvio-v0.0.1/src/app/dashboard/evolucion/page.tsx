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
import { Button } from "@/components/ui/Button";
import { Warning, SearchX, DocumentSlash, Split } from "@/components/ui/icons";

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

// ── CTA compartido ───────────────────────────────────────────────────────

function BackToStudiesLink() {
  return (
    <Link href="/dashboard/estudios">
      <Button>Ir a mis estudios</Button>
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
          icon={<Warning className="h-6 w-6" />}
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
          icon={<SearchX className="h-6 w-6" />}
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
          icon={<Warning className="h-6 w-6" />}
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
          icon={<DocumentSlash className="h-6 w-6" />}
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
            <Split className="h-6 w-6" />
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

  // ── Estado: serie válida sin parámetros compartidos ──
  if (result.parameters.length === 0) {
    return (
      <div>
        {header}
        <EmptyState
          icon={<DocumentSlash className="h-6 w-6" />}
          title="Sin parámetros para comparar"
          description="Los estudios de esta serie no comparten ningún parámetro que podamos mostrar. Probá armar la evolución con otros estudios del mismo tipo."
          action={<BackToStudiesLink />}
        />
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