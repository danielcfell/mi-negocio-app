"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { centavos, dinero, mensajeError, numero } from "@/lib/format";
import type { VentaDetalle } from "@/lib/types";

export default function AccionesVenta({ venta }: { venta: VentaDetalle }) {
  const router = useRouter();
  const [abonando, setAbonando] = useState(false);
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function abonar() {
    const valor = centavos(numero(monto));
    if (!Number.isFinite(valor) || !(valor > 0)) return setError("Escribe un monto mayor a 0.");
    if (valor > centavos(venta.saldo)) {
      return setError(`El abono supera lo que debe (${dinero(venta.saldo)}).`);
    }

    setOcupado(true);
    setError(null);
    const { error } = await createClient()
      .from("ventas")
      .update({ abonado: centavos(Number(venta.abonado) + valor) })
      .eq("id", venta.id);
    setOcupado(false);
    if (error) return setError(mensajeError(error));
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
    if (error) return setError(mensajeError(error));
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2 border-t border-lila-100 pt-3">
      {abonando ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            abonar();
          }}
          className="flex gap-2"
        >
          <input
            aria-label="Monto del abono"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder={`Hasta ${dinero(venta.saldo)}`}
            className="campo py-2"
          />
          <button type="submit" disabled={ocupado} className="boton-suave shrink-0">
            Guardar
          </button>
          <button
            type="button"
            onClick={() => {
              setAbonando(false);
              setError(null);
            }}
            className="shrink-0 px-2 text-sm font-semibold text-lila-400"
          >
            Cancelar
          </button>
        </form>
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
