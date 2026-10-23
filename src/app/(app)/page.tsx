import Link from "next/link";
import { Flower2, Wallet, Boxes, TrendingUp, HandCoins, PackagePlus } from "lucide-react";
import SalirButton from "@/components/SalirButton";
import { createClient } from "@/lib/supabase/server";
import { dinero, hoy, nombreDelMes, rangoDelMes } from "@/lib/format";
import type { Resumen } from "@/lib/types";

export default async function Inicio() {
  const supabase = await createClient();
  const { desde, hasta } = rangoDelMes();

  const { data, error } = await supabase.rpc("resumen", { p_desde: desde, p_hasta: hasta });
  const r = (data?.[0] ?? null) as Resumen | null;

  const tarjetas = [
    {
      titulo: "Dinero disponible",
      valor: r?.dinero_disponible,
      nota: "Cobrado y lo que pusiste, menos compras, gastos y retiros",
      Icono: Wallet,
      color: (r?.dinero_disponible ?? 0) < 0 ? "text-deuda" : "text-lila-700",
    },
    {
      titulo: "Mercadería en stock",
      valor: r?.valor_stock,
      nota: "Al costo real",
      Icono: Boxes,
      color: "text-lila-700",
    },
    {
      titulo: "Ganancia del mes",
      valor: r?.ganancia_periodo,
      nota: "Ventas − costo − gastos",
      Icono: TrendingUp,
      color: "text-ganancia",
    },
    {
      titulo: "Me deben",
      valor: r?.me_deben,
      nota: "Saldos pendientes",
      Icono: HandCoins,
      color: "text-deuda",
    },
  ];

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-lila-100">
            <Flower2 className="h-6 w-6 text-lila-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight text-lila-800">Mi Negocio</h1>
            <p className="text-sm text-lila-500">{nombreDelMes(hoy())}</p>
          </div>
        </div>
        <SalirButton />
      </header>

      <div className="detalle-dorado" />

      {error && (
        <p className="rounded-2xl bg-rosa-50 px-4 py-3 text-sm text-deuda">
          No se pudo cargar el resumen. ¿Ya ejecutaste el esquema SQL en Supabase?
        </p>
      )}

      {r && r.dinero_disponible < 0 && (
        <Link
          href="/gastos"
          className="block rounded-2xl bg-dorado-100/70 px-4 py-3 text-sm text-lila-800 ring-1 ring-dorado-300"
        >
          Tu dinero disponible sale negativo porque compraste con dinero tuyo. Regístralo en{" "}
          <strong>Dinero → Puse dinero</strong> para que cuadre.
        </Link>
      )}

      <section className="grid grid-cols-2 gap-3">
        {tarjetas.map(({ titulo, valor, nota, Icono, color }) => (
          <div key={titulo} className="tarjeta">
            <Icono className="mb-2 h-5 w-5 text-dorado-500" />
            <p className="text-sm font-semibold text-lila-600">{titulo}</p>
            <p className={`text-[clamp(1.05rem,5.2vw,1.5rem)] font-extrabold tracking-tight tabular-nums ${color}`}>
              {dinero(valor)}
            </p>
            <p className="mt-1 text-xs leading-snug text-lila-400">{nota}</p>
          </div>
        ))}
      </section>

      <section className="tarjeta">
        <h2 className="mb-3 text-lg font-bold text-lila-800">Este mes</h2>
        <dl className="space-y-2 text-sm">
          <Fila etiqueta="Ventas" valor={dinero(r?.ventas_periodo)} />
          <Fila etiqueta="Costo de lo vendido" valor={`− ${dinero(r?.costo_vendido)}`} />
          <Fila etiqueta="Gastos del negocio" valor={`− ${dinero(r?.gastos_periodo)}`} />
          <div className="border-t border-dorado-300/60 pt-2">
            <Fila etiqueta="Ganancia" valor={dinero(r?.ganancia_periodo)} fuerte />
          </div>
        </dl>
        <p className="mt-3 text-xs text-lila-400">
          Lo que sacas para ti no baja la ganancia: solo baja el dinero disponible.
        </p>
      </section>

      <Link href="/compras/nueva" className="boton">
        <PackagePlus className="h-5 w-5" />
        Registrar una compra
      </Link>
    </div>
  );
}

function Fila({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={fuerte ? "font-bold text-lila-800" : "text-lila-600"}>{etiqueta}</dt>
      <dd className={fuerte ? "text-lg font-extrabold text-ganancia" : "font-semibold text-lila-800"}>
        {valor}
      </dd>
    </div>
  );
}
