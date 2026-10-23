"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { dinero, hoy, numero, numeroO0 } from "@/lib/format";
import { reducirImagen } from "@/lib/imagen";

type Linea = {
  id: number;
  nombre: string;
  cantidad: string;
  costo: string;
  precio: string;
  foto: File | null;
};

const MAX_ARTICULOS = 20;
let siguienteId = 1;
const lineaVacia = (): Linea => ({
  id: siguienteId++,
  nombre: "",
  cantidad: "1",
  costo: "",
  precio: "",
  foto: null,
});

export default function NuevaCompra() {
  const router = useRouter();
  const [fecha, setFecha] = useState(hoy());
  const [lugar, setLugar] = useState("");
  const [transporte, setTransporte] = useState("");
  const [lineas, setLineas] = useState<Linea[]>(() => [lineaVacia()]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // El transporte se reparte solo entre los artículos que tienen nombre (los que se guardan).
  const unidades = useMemo(
    () =>
      lineas
        .filter((l) => l.nombre.trim())
        .reduce((suma, l) => suma + (parseInt(l.cantidad) || 0), 0),
    [lineas],
  );
  const transporteUnidad = unidades > 0 ? numeroO0(transporte) / unidades : 0;
  const totalCompra = useMemo(
    () =>
      lineas
        .filter((l) => l.nombre.trim())
        .reduce((s, l) => s + (parseInt(l.cantidad) || 0) * numeroO0(l.costo), 0) +
      numeroO0(transporte),
    [lineas, transporte],
  );

  function cambiar(id: number, cambios: Partial<Linea>) {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, ...cambios } : l)));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validas = lineas.filter((l) => l.nombre.trim());
    if (validas.length === 0) {
      setError("Agrega al menos un artículo con nombre.");
      return;
    }
    if (transporte.trim() && !Number.isFinite(numero(transporte))) {
      setError("El transporte debe ser un número, por ejemplo 5 o 5,50.");
      return;
    }
    for (const l of validas) {
      const cantidad = parseInt(l.cantidad);
      if (!(cantidad > 0) || !Number.isFinite(numero(l.costo)) || !Number.isFinite(numero(l.precio))) {
        setError(`Revisa cantidad, costo y precio de venta en “${l.nombre.trim()}”.`);
        return;
      }
    }

    setGuardando(true);
    const supabase = createClient();
    let compraId: string | null = null;
    const fotosSubidas: string[] = [];

    try {
      const { data: usuario } = await supabase.auth.getUser();
      if (!usuario.user) throw new Error("Tu sesión expiró. Vuelve a entrar.");

      const { data: compra, error: errCompra } = await supabase
        .from("compras")
        .insert({
          fecha,
          lugar: lugar.trim() || null,
          transporte: numeroO0(transporte),
        })
        .select("id")
        .single();
      if (errCompra) throw errCompra;
      compraId = compra.id;

      const filas = [];
      for (const l of validas) {
        let foto_url: string | null = null;
        if (l.foto) {
          const imagen = await reducirImagen(l.foto);
          const ruta = `${usuario.user.id}/${crypto.randomUUID()}.jpg`;
          const { error: errFoto } = await supabase.storage
            .from("productos")
            .upload(ruta, imagen, { contentType: "image/jpeg" });
          if (errFoto) throw new Error(`No se pudo subir la foto de “${l.nombre.trim()}”.`);
          fotosSubidas.push(ruta);
          foto_url = supabase.storage.from("productos").getPublicUrl(ruta).data.publicUrl;
        }
        filas.push({
          compra_id: compraId,
          nombre: l.nombre.trim(),
          cantidad: parseInt(l.cantidad),
          costo_unitario: numero(l.costo),
          precio_venta: numero(l.precio),
          foto_url,
        });
      }

      const { error: errProductos } = await supabase.from("productos").insert(filas);
      if (errProductos) throw errProductos;

      router.replace("/productos");
      router.refresh();
    } catch (err) {
      // Si algo falló, se deshace lo guardado a medias para no dejar datos sueltos.
      if (compraId) await supabase.from("compras").delete().eq("id", compraId);
      if (fotosSubidas.length) await supabase.storage.from("productos").remove(fotosSubidas);
      setError(err instanceof Error ? err.message : "No se pudo guardar la compra.");
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-lila-800">Nueva compra</h1>
        <div className="detalle-dorado mt-2" />
      </header>

      <section className="tarjeta space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="etiqueta" htmlFor="fecha">
              Fecha
            </label>
            <input
              id="fecha"
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="campo"
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="transporte">
              Transporte ($)
            </label>
            <input
              id="transporte"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={transporte}
              onChange={(e) => setTransporte(e.target.value)}
              className="campo"
              placeholder="0,00"
            />
          </div>
        </div>
        <div>
          <label className="etiqueta" htmlFor="lugar">
            ¿Dónde compraste?
          </label>
          <input
            id="lugar"
            value={lugar}
            onChange={(e) => setLugar(e.target.value)}
            className="campo"
            placeholder="Tienda, feria, ciudad…"
          />
        </div>
      </section>

      <section className="space-y-3">
        {lineas.map((l, i) => {
          const costoReal = numeroO0(l.costo) + transporteUnidad;
          const ganancia = numeroO0(l.precio) - costoReal;
          const mostrarCalculo =
            Number.isFinite(numero(l.costo)) && Number.isFinite(numero(l.precio));
          return (
            <div key={l.id} className="tarjeta space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-dorado-600">Artículo {i + 1}</span>
                {lineas.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Quitar artículo ${i + 1}`}
                    onClick={() => setLineas((prev) => prev.filter((x) => x.id !== l.id))}
                    className="p-1 text-rosa-400"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
              <input
                aria-label={`Nombre del artículo ${i + 1}`}
                value={l.nombre}
                onChange={(e) => cambiar(l.id, { nombre: e.target.value })}
                className="campo"
                placeholder="Nombre (ej. Sérum vitamina C)"
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="etiqueta" htmlFor={`cantidad-${l.id}`}>
                    Cantidad
                  </label>
                  <input
                    id={`cantidad-${l.id}`}
                    inputMode="numeric"
                    type="number"
                    min="1"
                    step="1"
                    value={l.cantidad}
                    onChange={(e) => cambiar(l.id, { cantidad: e.target.value })}
                    className="campo px-3"
                  />
                </div>
                <div>
                  <label className="etiqueta" htmlFor={`costo-${l.id}`}>
                    Costo c/u
                  </label>
                  <input
                    id={`costo-${l.id}`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={l.costo}
                    onChange={(e) => cambiar(l.id, { costo: e.target.value })}
                    className="campo px-3"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="etiqueta" htmlFor={`precio-${l.id}`}>
                    Vender a
                  </label>
                  <input
                    id={`precio-${l.id}`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={l.precio}
                    onChange={(e) => cambiar(l.id, { precio: e.target.value })}
                    className="campo px-3"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <label className="boton-suave w-full cursor-pointer">
                <Camera className="h-4 w-4 shrink-0" />
                <span className="truncate">{l.foto ? l.foto.name : "Agregar foto (opcional)"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => cambiar(l.id, { foto: e.target.files?.[0] ?? null })}
                />
              </label>

              {mostrarCalculo && (
                <p className="rounded-xl bg-dorado-100/60 px-3 py-2 text-xs text-lila-700">
                  Costo real {dinero(costoReal)} · ganancia por unidad{" "}
                  <strong className={ganancia >= 0 ? "text-ganancia" : "text-deuda"}>
                    {dinero(ganancia)}
                  </strong>
                </p>
              )}
            </div>
          );
        })}

        {lineas.length < MAX_ARTICULOS ? (
          <button
            type="button"
            onClick={() => setLineas((prev) => [...prev, lineaVacia()])}
            className="boton-suave w-full"
          >
            <Plus className="h-4 w-4" />
            Agregar otro artículo
          </button>
        ) : (
          <p className="text-center text-xs text-lila-400">
            Máximo {MAX_ARTICULOS} artículos por compra.
          </p>
        )}
      </section>

      <section className="tarjeta flex items-center justify-between">
        <span className="font-semibold text-lila-600">Total de la compra</span>
        <span className="text-xl font-extrabold text-lila-800">{dinero(totalCompra)}</span>
      </section>

      {error && <p className="rounded-2xl bg-rosa-50 px-4 py-3 text-sm text-deuda">{error}</p>}

      <button type="submit" disabled={guardando} className="boton">
        {guardando ? "Guardando…" : "Guardar compra"}
      </button>
    </form>
  );
}
