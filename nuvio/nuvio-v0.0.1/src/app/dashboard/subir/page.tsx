export default function SubirPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-medium tracking-[-0.02em] text-foreground">
          Subir estudio
        </h1>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
          Subí un documento médico para que Nuvio lo analice.
        </p>
      </div>

      <div className="rounded-xl border-2 border-dashed border-ink-700/20 bg-white p-12 shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <h3 className="text-[15px] font-medium text-foreground">
            Arrastrá tu archivo aquí
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            o hacé clic para seleccionar
          </p>
          <p className="mt-3 text-[12px] text-muted-foreground/70">
            PDF o imagen — máximo 10 MB
          </p>
        </div>
      </div>
    </div>
  );
}
