"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mensajeError } from "@/lib/format";

export default function BorrarBoton({
  tabla,
  id,
}: {
  tabla: "gastos" | "retiros";
  id: string;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  async function borrar() {
    if (!window.confirm("¿Borrar este registro?")) return;
    setOcupado(true);
    const { error } = await createClient().from(tabla).delete().eq("id", id);
    setOcupado(false);
    if (error) return window.alert(mensajeError(error));
    router.refresh();
  }

  return (
    <button
      onClick={borrar}
      disabled={ocupado}
      aria-label="Borrar registro"
      className="p-1 text-lila-300 hover:text-rosa-400 disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
