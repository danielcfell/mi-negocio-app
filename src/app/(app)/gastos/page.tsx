import { createClient } from "@/lib/supabase/server";
import { dinero, fechaCorta } from "@/lib/format";
import type { Gasto, Retiro } from "@/lib/types";
import BorrarBoton from "./BorrarBoton";
import FormGasto from "./FormGasto";

export default async function Gastos() {
  const supabase = await createClient();

  const [gastosRes, retirosRes] = await Promise.all([
    supabase
      .from("gastos")
      .select("*")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("retiros")
      .select("*")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const gastos = (gastosRes.data ?? []) as Gasto[];
  const movimientos = (retirosRes.data ?? []) as Retiro[];
  const hayError = gastosRes.error || retirosRes.error;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-lila-800">Gastos y mi dinero</h1>
        <div className="detalle-dorado mt-2" />
      </header>

      <FormGasto />

      {hayError && (
        <p className="rounded-2xl bg-rosa-50 px-4 py-3 text-sm text-deuda">
          No se pudieron cargar los registros.
        </p>
      )}

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
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-extrabold text-deuda">− {dinero(g.monto)}</span>
                <BorrarBoton tabla="gastos" id={g.id} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-lila-800">Mi dinero</h2>
        {movimientos.length === 0 && (
          <p className="text-sm text-lila-400">
            Aún no registras dinero que pusiste ni que sacaste.
          </p>
        )}
        <ul className="space-y-2">
          {movimientos.map((m) => {
            const aporte = m.tipo === "aporte";
            return (
              <li key={m.id} className="tarjeta flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-lila-800">
                    {m.nota ?? (aporte ? "Dinero que puse" : "Retiro personal")}
                  </p>
                  <p className="text-xs text-lila-400">
                    {aporte ? "Puse dinero" : "Saqué para mí"} · {fechaCorta(m.fecha)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`font-extrabold ${aporte ? "text-ganancia" : "text-lila-700"}`}>
                    {aporte ? "+" : "−"} {dinero(m.monto)}
                  </span>
                  <BorrarBoton tabla="retiros" id={m.id} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
