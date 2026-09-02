import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default function CompararPage() {
  return (
    <div>
      <PageHeader
        title="Comparar"
        description="Compará valores entre diferentes estudios."
      />
      <EmptyState
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        }
        title="Próximamente"
        description="La comparación de estudios estará disponible cuando se implemente el procesamiento de datos."
      />
    </div>
  );
}
