import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { ProductoStock } from "@/lib/types";
import EditarProducto from "./EditarProducto";

export default async function CorregirProducto({ params }: PageProps<"/productos/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("productos_stock").select("*").eq("id", id).maybeSingle();
  const producto = data as ProductoStock | null;

  return (
    <div className="space-y-5">
      <header>
        <Link href="/productos" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-lila-500">
          <ArrowLeft className="h-4 w-4" />
          Mis productos
        </Link>
        <h1 className="text-2xl font-bold text-lila-800">Corregir producto</h1>
        <div className="detalle-dorado mt-2" />
      </header>

      {producto ? (
        <EditarProducto producto={producto} />
      ) : (
        <div className="tarjeta py-10 text-center">
          <p className="font-semibold text-lila-700">No se encontró este producto.</p>
        </div>
      )}
    </div>
  );
}
