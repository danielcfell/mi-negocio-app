import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dinero, fechaCorta } from "@/lib/format";
import type { VentaDetalle } from "@/lib/types";
import AccionesVenta from "./AccionesVenta";

export default async function Ventas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ventas_detalle")
    .select("*")
    .eq("oculta", false)
    .order("fecha", { ascending: false })
    .order("creada", { ascending: false })
    .limit(100);

  const ventas = (data ?? []) as VentaDetalle[];
  const validas = ventas.filter((v) => !v.anulada);
  const meDeben = validas.reduce((s, v) => s + v.saldo, 0);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-lila-800">Mis ventas</h1>
          <div className="detalle-dorado mt-2" />
        </div>
        <Link href="/ventas/nueva" className="boton-suave">
          Nueva venta
        </Link>
      </header>

      {meDeben > 0 && (
        <div className="tarjeta flex items-center justify-between bg-rosa-50/80">
          <span className="font-semibold text-lila-700">Me deben en total</span>
          <span className="text-xl font-extrabold text-deuda">{dinero(meDeben)}</span>
        </div>
      )}

      {error && (
        <p className="rounded-2xl bg-rosa-50 px-4 py-3 text-sm text-deuda">
          No se pudieron cargar las ventas.
        </p>
      )}

      {!error && ventas.length === 0 && (
        <div className="tarjeta py-10 text-center">
          <p className="font-semibold text-lila-700">Aún no registras ventas</p>
        </div>
      )}

      <ul className="space-y-3">
        {ventas.map((v) => (
          <li key={v.id} className={`tarjeta ${v.anulada ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-bold text-lila-800">
                  {v.cantidad} × {v.producto}
                </h3>
                <p className="text-xs text-lila-400">
                  {fechaCorta(v.fecha)}
                  {v.cliente ? ` · ${v.cliente}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-lila-800">{dinero(v.total)}</p>
                {v.anulada ? (
                  <span className="text-xs font-bold text-lila-400">Anulada</span>
                ) : v.saldo > 0 ? (
                  <span className="text-xs font-bold text-deuda">Debe {dinero(v.saldo)}</span>
                ) : (
                  <span className="text-xs font-bold text-ganancia">Pagada</span>
                )}
              </div>
            </div>
            {!v.anulada && (
              <p className="mt-1 text-xs text-lila-500">Ganancia {dinero(v.ganancia)}</p>
            )}
            <AccionesVenta venta={v} />
          </li>
        ))}
      </ul>
    </div>
  );
}
