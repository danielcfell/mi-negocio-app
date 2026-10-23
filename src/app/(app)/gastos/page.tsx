import { createClient } from "@/lib/supabase/server";
import { dinero, fechaCorta } from "@/lib/format";
import type { Gasto, Retiro } from "@/lib/types";
import BorrarBoton from "./BorrarBoton";
import FormGasto from "./FormGasto";

export default async function Gastos() {
  const supabase = await createClient();

  const [gastosRes, retirosRes] = await Promise.all([
    supabase.from("gastos").select("*").order("fecha", { ascending: false }).limit(30),
    supabase.from("retiros").select("*").order("fecha", { ascending: false }).limit(30),
  ]);

  const gastos = (gastosRes.data ?? []) as Gasto[];
  const retiros = (retirosRes.data ?? []) as Retiro[];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-lila-800">Gastos y retiros</h1>
        <div className="detalle-dorado mt-2" />
      </header>

      <FormGasto />

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-lila-800">Gastos del negocio</h2>
        {gastos.length === 0 && <p className="text-sm text-lila-400">Todavía no hay gastos.</p>}
        <ul className="space-y-2">
          {gastos.map((g) => (
            <li key={g.id} className="tarjeta flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-lila-800">{g.concepto}</p>
                <p className="text-xs text-lila-400">{fechaCorta(g.fecha)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-deuda">− {dinero(g.monto)}</span>
                <BorrarBoton tabla="gastos" id={g.id} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-lila-800">Lo que saqué para mí</h2>
        {retiros.length === 0 && <p className="text-sm text-lila-400">Todavía no hay retiros.</p>}
        <ul className="space-y-2">
          {retiros.map((r) => (
            <li key={r.id} className="tarjeta flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-lila-800">{r.nota ?? "Retiro personal"}</p>
                <p className="text-xs text-lila-400">{fechaCorta(r.fecha)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-lila-700">− {dinero(r.monto)}</span>
                <BorrarBoton tabla="retiros" id={r.id} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
