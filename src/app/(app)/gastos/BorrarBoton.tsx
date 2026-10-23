"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function BorrarBoton({
  tabla,
  id,
}: {
  tabla: "gastos" | "retiros";
  id: string;
}) {
  const router = useRouter();

  async function borrar() {
    if (!window.confirm("¿Borrar este registro?")) return;
    const { error } = await createClient().from(tabla).delete().eq("id", id);
    if (error) return window.alert(error.message);
    router.refresh();
  }

  return (
    <button onClick={borrar} aria-label="Borrar" className="text-lila-300 hover:text-rosa-400">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
