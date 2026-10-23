"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { centavos, hoy, mensajeError, numero } from "@/lib/format";

type Tipo = "gasto" | "retiro" | "aporte";

const opciones: { valor: Tipo; nombre: string }[] = [
  { valor: "gasto", nombre: "Gasto del negocio" },
  { valor: "retiro", nombre: "Saqué para mí" },
  { valor: "aporte", nombre: "Puse dinero" },
];

const ayudas: Record<Tipo, string> = {
  gasto: "Empaques, publicidad, envíos, internet… Baja tu ganancia.",
  retiro: "Dinero del negocio que usas para ti. Baja tu dinero disponible, pero no es un gasto ni reduce la ganancia.",
  aporte: "Dinero tuyo que pones en el negocio, por ejemplo para comprar mercadería. Sube tu dinero disponible.",
};

export default function FormGasto() {
  const router = useRouter();
  const [tipo, setTipo] = useState<Tipo>("gasto");
  const [monto, setMonto] = useState("");
  const [texto, setTexto] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setListo(null);
    const valor = centavos(numero(monto));
    if (!Number.isFinite(valor) || !(valor > 0)) return setError("Escribe un monto mayor a 0.");
    if (tipo === "gasto" && !texto.trim()) return setError("Anota en qué fue el gasto.");

    setGuardando(true);
    const supabase = createClient();
    const { error } =
      tipo === "gasto"
        ? await supabase.from("gastos").insert({ fecha, concepto: texto.trim(), monto: valor })
        : await supabase
            .from("retiros")
            .insert({ fecha, tipo, nota: texto.trim() || null, monto: valor });
    setGuardando(false);

    if (error) return setError(mensajeError(error));
    setMonto("");
    setTexto("");
    setListo("Guardado.");
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="tarjeta space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {opciones.map(({ valor, nombre }) => (
          <button
            key={valor}
            type="button"
            onClick={() => {
              setTipo(valor);
              setError(null);
              setListo(null);
            }}
            className={`rounded-2xl px-1.5 py-2.5 text-xs font-bold leading-tight transition ${
              tipo === valor
                ? "bg-gradient-to-r from-lila-500 to-rosa-400 text-white shadow"
                : "bg-lila-50 text-lila-600"
            }`}
          >
            {nombre}
          </button>
        ))}
      </div>

      <p className="rounded-xl bg-dorado-100/60 px-3 py-2 text-xs text-lila-700">{ayudas[tipo]}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="etiqueta" htmlFor="monto">
            Monto ($)
          </label>
          <input
            id="monto"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="campo"
            placeholder="0,00"
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="fecha">
            Fecha
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="campo"
          />
        </div>
      </div>

      <div>
        <label className="etiqueta" htmlFor="texto">
          {tipo === "gasto" ? "¿En qué fue?" : "Nota (opcional)"}
        </label>
        <input
          id="texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="campo"
          placeholder={
            tipo === "gasto"
              ? "Empaques, publicidad, internet…"
              : tipo === "retiro"
                ? "Para qué lo usaste"
                : "Ej. capital para la primera compra"
          }
        />
      </div>

      {error && <p className="rounded-2xl bg-rosa-50 px-4 py-3 text-sm text-deuda">{error}</p>}
      {listo && <p className="text-center text-sm font-semibold text-ganancia">{listo}</p>}

      <button type="submit" disabled={guardando} className="boton">
        {guardando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
