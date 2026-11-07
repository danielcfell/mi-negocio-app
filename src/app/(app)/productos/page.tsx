import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { ProductoStock } from "@/lib/types";
import ListaProductos from "./ListaProductos";

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

      <ListaProductos productos={productos} />
    </div>
  );
}
