"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mensajeError } from "@/lib/format";
import type { ProductoStock } from "@/lib/types";

/** Borra la foto guardada en Storage a partir de su URL pública. */
export async function borrarFoto(url: string | null) {
  if (!url) return;
  const marca = "/storage/v1/object/public/productos/";
  const i = url.indexOf(marca);
  if (i >= 0) {
    await createClient().storage.from("productos").remove([url.slice(i + marca.length)]);
  }
}

/**
 * Elimina un producto. Si ya tiene ventas se oculta (sus ventas se conservan);
 * si no, se borra del todo junto con su foto y su compra si queda vacía.
 */
export async function eliminarProducto(producto: ProductoStock): Promise<string | null> {
  const supabase = createClient();

  if (producto.num_ventas > 0) {
    const { error } = await supabase.from("productos").update({ eliminado: true }).eq("id", producto.id);
    return error ? mensajeError(error) : null;
  }

  const { error } = await supabase.from("productos").delete().eq("id", producto.id);
  if (error) return mensajeError(error);

  await borrarFoto(producto.foto_url);

  const { count } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("compra_id", producto.compra_id);
  if (count === 0) await supabase.from("compras").delete().eq("id", producto.compra_id);
  return null;
}

export function avisoEliminar(p: ProductoStock): string {
  if (p.num_ventas > 0) {
    return (
      `¿Eliminar “${p.nombre}”? Desaparecerá de tus productos y ya no podrás venderlo. ` +
      `Sus ventas quedan registradas y tu ganancia no cambia.` +
      (p.stock > 0 ? ` Las ${p.stock} unidades que quedan dejarán de contar como mercadería.` : "")
    );
  }
  return `¿Eliminar “${p.nombre}”? Esto no se puede deshacer.`;
}

/** Botón pequeño de basurero para la lista de productos. */
export default function EliminarProducto({ producto }: { producto: ProductoStock }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  async function borrar() {
    if (!window.confirm(avisoEliminar(producto))) return;
    setOcupado(true);
    const error = await eliminarProducto(producto);
    setOcupado(false);
    if (error) return window.alert(error);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={borrar}
      disabled={ocupado}
      aria-label={`Eliminar ${producto.nombre}`}
      className="grid h-8 w-8 place-items-center rounded-full text-rosa-500 ring-1 ring-rosa-200 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
