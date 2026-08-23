import type { Metadata } from "next";
import V3Experience from "@/components/v3/V3Experience";
import "./museo.css";

// Página OCULTA: sin links desde la home ni el nav, noindex. Es el
// Museo Showcase Digitals (galería 3D de casos por cliente) en preview
// online antes de decidir su promoción a home.
export const metadata: Metadata = {
  title: "Museo Digitals",
  description:
    "Museo Showcase Digitals: una galería inmersiva de casos reales — cada sala, una marca: sus piezas, sus cifras, su placa.",
  robots: { index: false, follow: false },
};

export default function MuseoDigitalsPage() {
  return <V3Experience />;
}
