"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Package, ShoppingBag, ReceiptText, Wallet } from "lucide-react";

const enlaces = [
  { href: "/", texto: "Inicio", Icono: House },
  { href: "/productos", texto: "Productos", Icono: Package },
  { href: "/ventas/nueva", texto: "Vender", Icono: ShoppingBag, destacado: true },
  { href: "/ventas", texto: "Ventas", Icono: ReceiptText },
  { href: "/gastos", texto: "Gastos", Icono: Wallet },
];

export default function BottomNav() {
  const ruta = usePathname();

  function activo(href: string) {
    if (href === "/") return ruta === "/";
    if (href === "/ventas") return ruta === "/ventas";
    return ruta.startsWith(href);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-lila-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-md items-end justify-around px-2 py-2">
        {enlaces.map(({ href, texto, Icono, destacado }) => {
          const on = activo(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={
                  destacado
                    ? "-mt-6 flex flex-col items-center gap-0.5 text-xs font-bold text-lila-700"
                    : `flex flex-col items-center gap-0.5 px-2 text-xs font-semibold ${
                        on ? "text-lila-600" : "text-lila-300"
                      }`
                }
              >
                {destacado ? (
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-lila-500 to-rosa-400 text-white shadow-lg shadow-lila-300/60 ring-4 ring-white">
                    <Icono className="h-6 w-6" />
                  </span>
                ) : (
                  <Icono className="h-6 w-6" />
                )}
                {texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
