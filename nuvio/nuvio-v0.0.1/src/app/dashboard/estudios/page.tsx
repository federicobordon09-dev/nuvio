export default function EstudiosPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-medium tracking-[-0.02em] text-foreground">
          Mis estudios
        </h1>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
          Todos tus estudios médicos en un solo lugar.
        </p>
      </div>

      <div className="rounded-xl border border-ink-700/10 bg-white p-8 shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h3 className="text-[15px] font-medium text-foreground">
            No tenés estudios todavía
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-sm">
            Subí tu primer estudio médico para que Nuvio lo analice y te explique los resultados de forma clara.
          </p>
        </div>
      </div>
    </div>
  );
}
