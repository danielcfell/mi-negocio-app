import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ProductoStock } from "@/lib/types";
import FormVenta from "./FormVenta";

export default async function NuevaVenta({
  searchParams,
}: {
  searchParams: Promise<{ producto?: string }>;
}) {
  const { producto } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("productos_stock")
    .select("*")
    .eq("eliminado", false)
    .gt("stock", 0)
    .order("nombre");

  const productos = (data ?? []) as ProductoStock[];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-lila-800">Nueva venta</h1>
        <div className="detalle-dorado mt-2" />
      </header>

      {productos.length === 0 ? (
        <div className="tarjeta py-10 text-center">
          <p className="font-semibold text-lila-700">No tienes productos con stock</p>
          <Link href="/compras/nueva" className="boton-suave mt-3">
            Registrar una compra
          </Link>
        </div>
      ) : (
        <FormVenta productos={productos} inicial={producto} />
      )}
    </div>
  );
}
