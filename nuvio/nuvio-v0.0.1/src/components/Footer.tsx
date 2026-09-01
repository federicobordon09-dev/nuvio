import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:h-16 sm:flex-row sm:py-0 lg:px-8">
        <Image
          src="/nuvio_logo.png"
          alt="Nuvio"
          width={100}
          height={24}
          className="h-6 w-auto"
        />
        <p className="text-[12px] text-ink-600">
          Información médica compleja. Explicada de forma clara.
        </p>
        <p className="text-[12px] text-ink-600/60">
          &copy; {new Date().getFullYear()} Nuvio
        </p>
      </div>
    </footer>
  );
}
