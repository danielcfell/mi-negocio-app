const ZONA = "America/Guayaquil";

/**
 * Convierte lo que se escribe en un campo de dinero a número.
 * Acepta coma o punto decimal ("3,50" o "3.50"); devuelve NaN si no es válido.
 */
export function numero(texto: string): number {
  const limpio = texto.trim().replace(/\s/g, "").replace(",", ".");
  if (limpio === "" || !/^\d*\.?\d*$/.test(limpio)) return NaN;
  return Number(limpio);
}

/** Redondea a centavos, igual que la base de datos. */
export function centavos(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/** Traduce errores de la base de datos a mensajes entendibles. */
export function mensajeError(error: { message?: string } | null | undefined): string {
  const texto = error?.message ?? "";
  if (texto.includes("No hay stock suficiente") || texto.includes("Ya vendiste") || texto.includes("Producto no encontrado")) {
    return texto;
  }
  if (texto.includes("abono_no_supera_total")) return "El abono no puede ser mayor que el total de la venta.";
  if (texto.includes("violates foreign key") && texto.includes("ventas")) {
    return "Este producto ya tiene ventas registradas; no se puede borrar.";
  }
  if (texto.includes("violates check constraint")) return "Revisa los valores: hay un número que no es válido.";
  if (texto.toLowerCase().includes("jwt") || texto.toLowerCase().includes("session")) {
    return "Tu sesión expiró. Vuelve a entrar.";
  }
  if (texto.toLowerCase().includes("failed to fetch") || texto.toLowerCase().includes("network")) {
    return "No hay conexión a internet. Intenta de nuevo.";
  }
  return texto || "Ocurrió un error. Intenta de nuevo.";
}

/** Igual que numero(), pero devuelve 0 cuando el campo está vacío o es inválido. */
export function numeroO0(texto: string): number {
  const n = numero(texto);
  return Number.isFinite(n) ? n : 0;
}

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
