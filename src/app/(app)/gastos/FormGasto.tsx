"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hoy } from "@/lib/format";

export default function FormGasto() {
  const router = useRouter();
  const [tipo, setTipo] = useState<"gasto" | "retiro">("gasto");
  const [monto, setMonto] = useState("");
  const [texto, setTexto] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const valor = parseFloat(monto);
    if (!(valor > 0)) return setError("Escribe un monto mayor a 0.");
    if (tipo === "gasto" && !texto.trim()) return setError("Anota en qué fue el gasto.");

    setGuardando(true);
    const supabase = createClient();
    const { error } =
      tipo === "gasto"
        ? await supabase.from("gastos").insert({ fecha, concepto: texto.trim(), monto: valor })
        : await supabase.from("retiros").insert({ fecha, nota: texto.trim() || null, monto: valor });
    setGuardando(false);

    if (error) return setError(error.message);
    setMonto("");
    setTexto("");
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="tarjeta space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["gasto", "Gasto del negocio"],
            ["retiro", "Saqué para mí"],
          ] as const
        ).map(([valor, nombre]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setTipo(valor)}
            className={`rounded-2xl px-2 py-2.5 text-sm font-bold transition ${
              tipo === valor
                ? "bg-gradient-to-r from-lila-500 to-rosa-400 text-white shadow"
                : "bg-lila-50 text-lila-600"
            }`}
          >
            {nombre}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="etiqueta" htmlFor="monto">
            Monto ($)
          </label>
          <input
            id="monto"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="campo"
            placeholder="0.00"
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
          placeholder={tipo === "gasto" ? "Empaques, publicidad, internet…" : "Para qué lo usaste"}
        />
      </div>

      {tipo === "retiro" && (
        <p className="rounded-xl bg-dorado-100/60 px-3 py-2 text-xs text-lila-700">
          Lo que sacas para ti baja tu dinero disponible, pero no cuenta como gasto ni reduce la
          ganancia.
        </p>
      )}

      {error && <p className="rounded-2xl bg-rosa-50 px-4 py-3 text-sm text-deuda">{error}</p>}

      <button type="submit" disabled={guardando} className="boton">
        {guardando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
