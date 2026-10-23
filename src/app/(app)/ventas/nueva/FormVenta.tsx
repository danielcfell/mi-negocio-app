"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dinero, hoy } from "@/lib/format";
import type { ProductoStock } from "@/lib/types";

export default function FormVenta({
  productos,
  inicial,
}: {
  productos: ProductoStock[];
  inicial?: string;
}) {
  const router = useRouter();
  const elegido = productos.find((p) => p.id === inicial) ?? productos[0];

  const [productoId, setProductoId] = useState(elegido?.id ?? "");
  const [cantidad, setCantidad] = useState("1");
  const [precio, setPrecio] = useState(elegido ? String(elegido.precio_venta) : "");
  const [cliente, setCliente] = useState("");
  const [pago, setPago] = useState<"completo" | "abono" | "nada">("completo");
  const [abono, setAbono] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const producto = productos.find((p) => p.id === productoId);
  const unidades = parseInt(cantidad) || 0;
  const precioNum = parseFloat(precio) || 0;
  const total = unidades * precioNum;
  const abonado =
    pago === "completo" ? total : pago === "abono" ? Math.min(parseFloat(abono) || 0, total) : 0;
  const ganancia = producto ? unidades * (precioNum - producto.costo_real) : 0;

  function elegirProducto(id: string) {
    setProductoId(id);
    const p = productos.find((x) => x.id === id);
    if (p) setPrecio(String(p.precio_venta));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!producto) return;
    if (unidades < 1) return setError("La cantidad debe ser al menos 1.");
    if (unidades > producto.stock) return setError(`Solo quedan ${producto.stock} en stock.`);
    if (pago === "abono" && !(abonado > 0)) return setError("Escribe cuánto abonó.");
    if (pago !== "completo" && !cliente.trim())
      return setError("Anota el nombre de quien te debe.");

    setGuardando(true);
    const { error } = await createClient().from("ventas").insert({
      producto_id: producto.id,
      cantidad: unidades,
      precio: precioNum,
      fecha,
      cliente: cliente.trim() || null,
      abonado,
    });
    if (error) {
      setError(error.message);
      setGuardando(false);
      return;
    }
    router.replace("/ventas");
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <section className="tarjeta space-y-3">
        <div>
          <label className="etiqueta" htmlFor="producto">
            Producto
          </label>
          <select
            id="producto"
            value={productoId}
            onChange={(e) => elegirProducto(e.target.value)}
            className="campo"
          >
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.stock} disp.)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="etiqueta" htmlFor="cantidad">
              Cantidad
            </label>
            <input
              id="cantidad"
              type="number"
              inputMode="numeric"
              min="1"
              max={producto?.stock}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="campo"
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="precio">
              Precio c/u ($)
            </label>
            <input
              id="precio"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="campo"
            />
          </div>
        </div>

        <div>
          <label className="etiqueta" htmlFor="fecha">
            Fecha
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="campo"
          />
        </div>
      </section>

      <section className="tarjeta space-y-3">
        <p className="etiqueta">¿Cómo pagó?</p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["completo", "Pagó todo"],
              ["abono", "Abonó"],
              ["nada", "Debe todo"],
            ] as const
          ).map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setPago(valor)}
              className={`rounded-2xl px-2 py-2.5 text-sm font-bold transition ${
                pago === valor
                  ? "bg-gradient-to-r from-lila-500 to-rosa-400 text-white shadow"
                  : "bg-lila-50 text-lila-600"
              }`}
            >
              {texto}
            </button>
          ))}
        </div>

        {pago === "abono" && (
          <div>
            <label className="etiqueta" htmlFor="abono">
              Abonó ($)
            </label>
            <input
              id="abono"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={abono}
              onChange={(e) => setAbono(e.target.value)}
              className="campo"
            />
          </div>
        )}

        <div>
          <label className="etiqueta" htmlFor="cliente">
            Cliente {pago === "completo" ? "(opcional)" : ""}
          </label>
          <input
            id="cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="campo"
            placeholder="Nombre"
          />
        </div>
      </section>

      <section className="tarjeta space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-lila-600">Total</span>
          <strong className="text-lg text-lila-800">{dinero(total)}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-lila-600">Queda por cobrar</span>
          <strong className="text-deuda">{dinero(total - abonado)}</strong>
        </div>
        <div className="flex justify-between border-t border-dorado-300/60 pt-1">
          <span className="text-lila-600">Tu ganancia en esta venta</span>
          <strong className={ganancia >= 0 ? "text-ganancia" : "text-deuda"}>
            {dinero(ganancia)}
          </strong>
        </div>
      </section>

      {error && <p className="rounded-2xl bg-rosa-50 px-4 py-3 text-sm text-deuda">{error}</p>}

      <button type="submit" disabled={guardando} className="boton">
        {guardando ? "Guardando…" : "Guardar venta"}
      </button>
    </form>
  );
}
