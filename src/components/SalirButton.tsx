"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SalirButton() {
  const router = useRouter();

  async function salir() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={salir}
      aria-label="Cerrar sesión"
      className="grid h-10 w-10 place-items-center rounded-full bg-white text-lila-500 shadow-sm ring-1 ring-lila-100"
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
}
