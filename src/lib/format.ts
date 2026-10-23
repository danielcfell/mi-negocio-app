const ZONA = "America/Guayaquil";

export function dinero(valor: number | null | undefined): string {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(
    Number(valor ?? 0),
  );
}

/** Fecha de hoy como AAAA-MM-DD en hora de Ecuador. */
export function hoy(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: ZONA });
}

/** Primer y último día del mes de una fecha AAAA-MM-DD. */
export function rangoDelMes(fecha: string = hoy()): { desde: string; hasta: string } {
  const [anio, mes] = fecha.split("-").map(Number);
  const ultimo = new Date(anio, mes, 0).getDate();
  const m = String(mes).padStart(2, "0");
  return { desde: `${anio}-${m}-01`, hasta: `${anio}-${m}-${String(ultimo).padStart(2, "0")}` };
}

export function nombreDelMes(fecha: string = hoy()): string {
  const [anio, mes] = fecha.split("-").map(Number);
  const nombre = new Date(anio, mes - 1, 1).toLocaleDateString("es-EC", { month: "long" });
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`;
}

export function fechaCorta(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "short",
  });
}
