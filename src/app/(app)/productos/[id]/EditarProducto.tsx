"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { centavos, dinero, mensajeError, numero } from "@/lib/format";
import type { ProductoStock } from "@/lib/types";

export default function EditarProducto({ producto }: { producto: ProductoStock }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(producto.nombre);
  const [cantidad, setCantidad] = useState(String(producto.comprado));
  const [costo, setCosto] = useState(String(producto.costo_unitario));
  const [precio, setPrecio] = useState(String(producto.precio_venta));
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const vendido = producto.vendido;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cant = parseInt(cantidad);
    const costoNum = centavos(numero(costo));
    const precioNum = centavos(numero(precio));

    if (!nombre.trim()) return setError("El nombre no puede quedar vacío.");
    if (!(cant > 0)) return setError("La cantidad debe ser al menos 1.");
    if (cant < vendido) return setError(`Ya vendiste ${vendido}; la cantidad no puede ser menor.`);
    if (!Number.isFinite(costoNum) || !Number.isFinite(precioNum)) {
      return setError("Revisa el costo y el precio: deben ser números, por ejemplo 3 o 3,50.");
    }

    setOcupado(true);
    const { error } = await createClient()
      .from("productos")
      .update({
        nombre: nombre.trim(),
        cantidad: cant,
        costo_unitario: costoNum,
        precio_venta: precioNum,
      })
      .eq("id", producto.id);
    setOcupado(false);
    if (error) return setError(mensajeError(error));
    router.replace("/productos");
    router.refresh();
  }

  async function eliminar() {
    const tieneVentas = producto.num_ventas > 0;
    const aviso = tieneVentas
      ? `¿Eliminar “${producto.nombre}”? Desaparecerá de tus productos y ya no podrás venderlo. ` +
        `Sus ventas quedan registradas y tu ganancia no cambia.` +
        (producto.stock > 0
          ? ` Las ${producto.stock} unidades que quedan dejarán de contar como mercadería.`
          : "")
      : `¿Eliminar “${producto.nombre}”? Esto no se puede deshacer.`;
    if (!window.confirm(aviso)) return;
    setOcupado(true);
    setError(null);
    const supabase = createClient();

    if (tieneVentas) {
      // Se oculta, pero sigue existiendo para que sus ventas conserven su costo.
      const { error } = await supabase
        .from("productos")
        .update({ eliminado: true })
        .eq("id", producto.id);
      if (error) {
        setOcupado(false);
        return setError(mensajeError(error));
      }
      router.replace("/productos");
      router.refresh();
      return;
    }

    const { error } = await supabase.from("productos").delete().eq("id", producto.id);
    if (error) {
      setOcupado(false);
      return setError(mensajeError(error));
    }

    // Borrar la foto guardada, si tenía
    if (producto.foto_url) {
      const marca = "/storage/v1/object/public/productos/";
      const i = producto.foto_url.indexOf(marca);
      if (i >= 0) {
        await supabase.storage.from("productos").remove([producto.foto_url.slice(i + marca.length)]);
      }
    }

    // Si la compra quedó sin productos, también se borra (y con ella su transporte)
    const { count } = await supabase
      .from("productos")
      .select("id", { count: "exact", head: true })
      .eq("compra_id", producto.compra_id);
    if (count === 0) await supabase.from("compras").delete().eq("id", producto.compra_id);

    router.replace("/productos");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={guardar} noValidate className="tarjeta space-y-3">
        <div>
          <label className="etiqueta" htmlFor="nombre">
            Nombre
          </label>
          <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="campo" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="etiqueta" htmlFor="cantidad">
              Compré
            </label>
            <input
              id="cantidad"
              type="number"
              inputMode="numeric"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="campo px-3"
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="costo">
              Costo c/u
            </label>
            <input
              id="costo"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              className="campo px-3"
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="precio">
              Vender a
            </label>
            <input
              id="precio"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="campo px-3"
            />
          </div>
        </div>

        <p className="text-xs text-lila-400">
          Vendidos: {vendido}. Costo real actual {dinero(producto.costo_real)} (incluye su parte del
          transporte).
        </p>

        {error && <p className="rounded-2xl bg-rosa-50 px-4 py-3 text-sm text-deuda">{error}</p>}

        <button type="submit" disabled={ocupado} className="boton">
          {ocupado ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      <button
        onClick={eliminar}
        disabled={ocupado}
        className="w-full rounded-2xl px-4 py-3 text-sm font-bold text-rosa-500 ring-1 ring-rosa-200"
      >
        Eliminar producto
      </button>
      {producto.num_ventas > 0 && (
        <p className="text-center text-xs text-lila-400">
          Tiene ventas registradas: al eliminarlo, esas ventas se conservan y tu ganancia no cambia.
        </p>
      )}
    </div>
  );
}
