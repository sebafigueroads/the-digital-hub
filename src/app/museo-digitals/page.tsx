import type { Metadata } from "next";
import V3Experience from "@/components/v3/V3Experience";
import "./museo.css";

// Destino público: es una de las dos vistas del portafolio, enlazada desde
// la bifurcación de / y desde el menú de digitals.cl.
export const metadata: Metadata = {
  title: "Museo Digitals",
  description:
    "Museo Showcase Digitals: una galería inmersiva de casos reales — cada sala, una marca: sus piezas, sus cifras, su placa.",
};

export default function MuseoDigitalsPage() {
  return <V3Experience />;
}
