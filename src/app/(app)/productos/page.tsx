import Link from "next/link";
import { ImageIcon, PackagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { dinero, fechaCorta } from "@/lib/format";
import type { ProductoStock } from "@/lib/types";

export default async function Productos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("productos_stock")
    .select("*")
    .eq("eliminado", false)
    .order("fecha_compra", { ascending: false })
    .order("creado", { ascending: false })
    .order("nombre");

  const productos = (data ?? []) as ProductoStock[];
  const conStock = productos.filter((p) => p.stock > 0);
  const agotados = productos.filter((p) => p.stock <= 0);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-lila-800">Mis productos</h1>
          <div className="detalle-dorado mt-2" />
        </div>
        <Link href="/compras/nueva" className="boton-suave">
          <PackagePlus className="h-4 w-4" />
          Nueva compra
        </Link>
      </header>

      {error && (
        <p className="rounded-2xl bg-rosa-50 px-4 py-3 text-sm text-deuda">
          No se pudieron cargar los productos.
        </p>
      )}

      {!error && productos.length === 0 && (
        <div className="tarjeta py-10 text-center">
          <p className="font-semibold text-lila-700">Aún no tienes productos</p>
          <p className="mt-1 text-sm text-lila-400">Registra tu primera compra para empezar.</p>
        </div>
      )}

      <ul className="space-y-3">
        {conStock.map((p) => (
          <TarjetaProducto key={p.id} p={p} />
        ))}
      </ul>

      {agotados.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-lila-600">Agotados</h2>
          <ul className="space-y-3 opacity-70">
            {agotados.map((p) => (
              <TarjetaProducto key={p.id} p={p} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TarjetaProducto({ p }: { p: ProductoStock }) {
  const agotado = p.stock <= 0;
  return (
    <li className="tarjeta flex gap-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-lila-50">
        {p.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.foto_url} alt={p.nombre} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-lila-200">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-bold text-lila-800">{p.nombre}</h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              agotado ? "bg-rosa-100 text-deuda" : "bg-lila-100 text-lila-700"
            }`}
          >
            {agotado ? "Agotado" : `${p.stock} en stock`}
          </span>
        </div>
        <p className="text-xs text-lila-400">
          Comprado el {fechaCorta(p.fecha_compra)} · {p.vendido} de {p.comprado} vendidos
        </p>
        <p className="mt-1 text-sm text-lila-700">
          Costo {dinero(p.costo_real)} → vendo a <strong>{dinero(p.precio_venta)}</strong>
        </p>
        <p
          className={`text-sm font-extrabold ${
            p.ganancia_unidad >= 0 ? "text-ganancia" : "text-deuda"
          }`}
        >
          Gano {dinero(p.ganancia_unidad)} c/u
        </p>
        <div className="mt-2 flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Link
              href={`/productos/${p.id}`}
              className="rounded-full px-3 py-1.5 text-xs font-bold text-lila-500 ring-1 ring-lila-200"
            >
              Corregir
            </Link>
            {!agotado && (
              <Link
                href={`/ventas/nueva?producto=${p.id}`}
                className="rounded-full bg-gradient-to-r from-lila-500 to-rosa-400 px-4 py-1.5 text-xs font-bold text-white"
              >
                Vender
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
