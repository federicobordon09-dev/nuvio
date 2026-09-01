export default function ChatPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-medium tracking-[-0.02em] text-foreground">
          Chat IA
        </h1>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
          Hacé preguntas sobre tus estudios médicos.
        </p>
      </div>

      <div className="rounded-xl border border-ink-700/10 bg-white p-8 shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <h3 className="text-[15px] font-medium text-foreground">
            Próximamente
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-sm">
            El chat con IA estará disponible cuando se implemente el procesamiento de estudios.
          </p>
        </div>
      </div>
    </div>
  );
}
