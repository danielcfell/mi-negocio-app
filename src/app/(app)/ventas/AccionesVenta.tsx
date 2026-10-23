"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { VentaDetalle } from "@/lib/types";

export default function AccionesVenta({ venta }: { venta: VentaDetalle }) {
  const router = useRouter();
  const [abonando, setAbonando] = useState(false);
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function abonar() {
    const valor = parseFloat(monto);
    if (!(valor > 0)) return setError("Escribe un monto mayor a 0.");
    if (valor > venta.saldo + 0.001) return setError("El abono supera lo que debe.");

    setOcupado(true);
    setError(null);
    const { error } = await createClient()
      .from("ventas")
      .update({ abonado: Number((venta.abonado + valor).toFixed(2)) })
      .eq("id", venta.id);
    setOcupado(false);
    if (error) return setError(error.message);
    setAbonando(false);
    setMonto("");
    router.refresh();
  }

  async function anular() {
    if (!window.confirm("¿Anular esta venta? El producto volverá al stock.")) return;
    setOcupado(true);
    const { error } = await createClient()
      .from("ventas")
      .update({ anulada: true })
      .eq("id", venta.id);
    setOcupado(false);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2 border-t border-lila-100 pt-3">
      {abonando ? (
        <div className="flex gap-2">
          <input
            aria-label="Monto del abono"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder={`Hasta ${venta.saldo.toFixed(2)}`}
            className="campo py-2"
          />
          <button onClick={abonar} disabled={ocupado} className="boton-suave shrink-0">
            Guardar
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          {venta.saldo > 0 && (
            <button onClick={() => setAbonando(true)} className="boton-suave flex-1">
              Registrar abono
            </button>
          )}
          <button
            onClick={anular}
            disabled={ocupado}
            className="rounded-2xl px-4 py-2.5 text-sm font-bold text-rosa-500 ring-1 ring-rosa-200"
          >
            Anular
          </button>
        </div>
      )}
      {error && <p className="text-xs text-deuda">{error}</p>}
    </div>
  );
}
