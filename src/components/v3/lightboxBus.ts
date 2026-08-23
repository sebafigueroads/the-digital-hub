// Bus del lightbox + registro de recursos compartidos del túnel.
// Mismo patrón que store.ts / videoBus.ts: estado mutable de módulo
// leído por useFrame sin re-renders, con pub/sub mínimo para el DOM.

export type LightboxItem = {
  kind: "video" | "image" | "plate";
  src?: string;
  poster?: string;
  brand: string;
  title: string;
  sub?: string;
  vertical?: boolean;
  /** cifras estructuradas (placas): [0] héroe, resto filas */
  stats?: { v: string; l: string }[];
  chip?: string;
};

type Listener = (item: LightboxItem | null) => void;
const listeners = new Set<Listener>();

export const lightboxBus = {
  item: null as LightboxItem | null,
  open(item: LightboxItem) {
    this.item = item;
    listeners.forEach((l) => l(item));
  },
  close() {
    this.item = null;
    listeners.forEach((l) => l(null));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

/* Presupuesto duro de decodificación: máximo 4 <video> montados a la vez
   en el túnel (los demás cuadros muestran su poster jpg). */
export const videoSlots = { used: 0, max: 4 };

/* Handle al contenedor de scroll de drei <ScrollControls> para poder
   bloquearlo (lightbox) y navegar a un hall (menú "Casos" / ticks). */
export const scrollBus = { el: null as HTMLElement | null };
