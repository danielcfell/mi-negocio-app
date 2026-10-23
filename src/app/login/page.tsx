"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flower2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: clave,
    });
    if (error) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-white shadow-md ring-1 ring-lila-100">
          <Flower2 className="h-8 w-8 text-lila-500" />
        </div>
        <h1 className="text-3xl font-bold text-lila-800">Mi Negocio</h1>
        <div className="detalle-dorado mx-auto mt-2" />
        <p className="mt-3 text-sm text-lila-600">Tus ventas y ganancias, claras y en orden.</p>
      </div>

      <form onSubmit={entrar} className="tarjeta space-y-4">
        <div>
          <label htmlFor="correo" className="etiqueta">
            Correo
          </label>
          <input
            id="correo"
            type="email"
            autoComplete="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="campo"
            placeholder="tucorreo@ejemplo.com"
          />
        </div>
        <div>
          <label htmlFor="clave" className="etiqueta">
            Contraseña
          </label>
          <input
            id="clave"
            type="password"
            autoComplete="current-password"
            required
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="campo"
          />
        </div>
        {error && <p className="rounded-xl bg-rosa-50 px-3 py-2 text-sm text-deuda">{error}</p>}
        <button type="submit" disabled={cargando} className="boton">
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
