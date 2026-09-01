export default function CompararPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-medium tracking-[-0.02em] text-foreground">
          Comparar
        </h1>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
          Compará valores entre diferentes estudios.
        </p>
      </div>

      <div className="rounded-xl border border-ink-700/10 bg-white p-8 shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <h3 className="text-[15px] font-medium text-foreground">
            Próximamente
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-sm">
            La comparación de estudios estará disponible cuando se implemente el procesamiento de datos.
          </p>
        </div>
      </div>
    </div>
  );
}
