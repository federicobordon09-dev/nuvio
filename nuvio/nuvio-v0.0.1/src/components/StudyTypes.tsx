import {
  CheckBadge,
  CheckCircle,
  Clock,
  Document,
  InfoCircle,
  Search,
} from "@/components/ui/icons";

const STUDY_TYPES = [
  {
    icon: <Document className="h-6 w-6" />,
    title: "Análisis de sangre y orina",
    description:
      "Hemogramas, glucemia, perfil lipídico, hepatograma y estudios de orina.",
  },
  {
    icon: <Search className="h-6 w-6" />,
    title: "Resonancias y tomografías",
    description:
      "Los informes en PDF de resonancias magnéticas (RM) y tomografías (TAC).",
  },
  {
    icon: <InfoCircle className="h-6 w-6" />,
    title: "Ecografías y radiografías",
    description:
      "Informes de ecografías abdominales, tiroides, mamas y radiografías.",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Electrocardiogramas y cardiología",
    description:
      "ECG, ecocardiogramas y los informes de tus controles cardiológicos.",
  },
  {
    icon: <CheckBadge className="h-6 w-6" />,
    title: "Epicrisis y altas de internación",
    description:
      "Resúmenes de internación, indicaciones y planes de seguimiento.",
  },
  {
    icon: <CheckCircle className="h-6 w-6" />,
    title: "Biopsias y anatomía patológica",
    description:
      "Informes de biopsia, citologías y estudios complementarios en informe.",
  },
];

export default function StudyTypes() {
  return (
    <section
      id="estudios"
      className="bg-surface"
      aria-labelledby="estudios-heading"
    >
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-medium uppercase tracking-caption text-violet">
            Versatilidad diagnóstica
          </p>
          <h2
            id="estudios-heading"
            className="mt-3 text-title-lg text-primary"
          >
            ¿Qué tipo de estudios comprende Nuvio?
          </h2>
          <p className="mt-3 text-body leading-body text-muted-foreground">
            Nuvio trabaja con archivos PDF e imágenes: subí el estudio tal como
            lo recibiste del laboratorio o la clínica.
          </p>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STUDY_TYPES.map(({ icon, title, description }) => (
            <li
              key={title}
              className="flex items-start gap-4 rounded-xl bg-background p-6 transition-colors duration-200 hover:bg-surface-container-low"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
                {icon}
              </span>
              <div>
                <h3 className="text-subheading text-primary">{title}</h3>
                <p className="mt-1.5 text-caption leading-body text-muted-foreground">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
