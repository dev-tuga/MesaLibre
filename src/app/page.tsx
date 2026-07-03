import { QrCode, ReceiptText, Star } from "lucide-react";

const steps = [
  {
    icon: QrCode,
    title: "Escanea el QR de tu mesa",
    description: "Sin descargar apps: la carta se abre directo en tu navegador.",
  },
  {
    icon: ReceiptText,
    title: "Pide y paga desde tu celular",
    description: "Agrega ítems, mira la cuenta en tiempo real y divide el pago entre amigos.",
  },
  {
    icon: Star,
    title: "Califica tu experiencia",
    description: "Deja tu opinión al restaurante apenas cierras la cuenta.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-12 px-6 py-16 text-center">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
          MesaLibre
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Tu cuenta, tu carta y tu propina en un solo QR
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-lg">
          Plataforma de pago en mesa para restaurantes: menú digital, cuenta compartida y pago
          dividido, sin esperar al garzón.
        </p>
      </div>

      <div className="grid w-full gap-6 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="bg-card rounded-xl border p-6 text-left shadow-sm">
            <step.icon className="text-primary mb-4 size-6" aria-hidden />
            <h2 className="mb-1 font-semibold">{step.title}</h2>
            <p className="text-muted-foreground text-sm">{step.description}</p>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground text-sm">
        ¿Tienes un restaurante? Escríbenos para sumarte al piloto.
      </p>
    </main>
  );
}
