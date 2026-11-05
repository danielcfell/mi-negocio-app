"use client";

import { useState } from "react";
import { Camera, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { centavos, dinero, mensajeError, numero } from "@/lib/format";
import type { ProductoStock } from "@/lib/types";
import { reducirImagen } from "@/lib/imagen";
import { avisoEliminar, borrarFoto, eliminarProducto } from "../EliminarProducto";

export default function EditarProducto({ producto }: { producto: ProductoStock }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(producto.nombre);
  const [cantidad, setCantidad] = useState(String(producto.comprado));
  const [costo, setCosto] = useState(String(producto.costo_unitario));
  const [precio, setPrecio] = useState(String(producto.precio_venta));
  const [foto, setFoto] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
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
    const supabase = createClient();
    const cambios: Record<string, string | number> = {
      nombre: nombre.trim(),
      cantidad: cant,
      costo_unitario: costoNum,
      precio_venta: precioNum,
    };

    let rutaNueva: string | null = null;
    if (foto) {
      try {
        const { data: usuario } = await supabase.auth.getUser();
        if (!usuario.user) throw new Error("Tu sesión expiró. Vuelve a entrar.");
        const imagen = await reducirImagen(foto);
        rutaNueva = `${usuario.user.id}/${crypto.randomUUID()}.jpg`;
        const { error: errFoto } = await supabase.storage
          .from("productos")
          .upload(rutaNueva, imagen, { contentType: "image/jpeg" });
        if (errFoto) throw new Error("No se pudo subir la foto. Intenta de nuevo.");
        cambios.foto_url = supabase.storage.from("productos").getPublicUrl(rutaNueva).data.publicUrl;
      } catch (e) {
        setOcupado(false);
        return setError(e instanceof Error ? e.message : "No se pudo procesar la foto.");
      }
    }

    const { error } = await supabase.from("productos").update(cambios).eq("id", producto.id);
    if (error) {
      if (rutaNueva) await supabase.storage.from("productos").remove([rutaNueva]);
      setOcupado(false);
      return setError(mensajeError(error));
    }
    if (rutaNueva) await borrarFoto(producto.foto_url);
    setOcupado(false);
    router.replace("/productos");
    router.refresh();
  }

  async function eliminar() {
    if (!window.confirm(avisoEliminar(producto))) return;
    setOcupado(true);
    setError(null);
    const msg = await eliminarProducto(producto);
    if (msg) {
      setOcupado(false);
      return setError(msg);
    }
    router.replace("/productos");
    router.refresh();
  }

  function elegirFoto(archivo: File | null) {
    if (vista) URL.revokeObjectURL(vista);
    setFoto(archivo);
    setVista(archivo ? URL.createObjectURL(archivo) : null);
  }

  const fotoMostrada = vista ?? producto.foto_url;

  return (
    <div className="space-y-4">
      <form onSubmit={guardar} noValidate className="tarjeta space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-lila-50">
            {fotoMostrada ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoMostrada} alt={producto.nombre} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-lila-200">
                <ImageIcon className="h-7 w-7" />
              </div>
            )}
          </div>
          <label className="boton-suave cursor-pointer">
            <Camera className="h-4 w-4" />
            <span>{producto.foto_url || foto ? "Cambiar foto" : "Agregar foto"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => elegirFoto(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

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
