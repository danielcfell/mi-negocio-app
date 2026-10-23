# Mi Negocio

App web para el celular, de una sola usuaria: compras, stock, ventas con abonos, gastos, retiros personales y ganancia real.

Stack: Next.js 16 (TypeScript, Tailwind) + Supabase, pensado para desplegar en Vercel.

## Puesta en marcha

1. Crea un proyecto en Supabase.
2. En el SQL Editor ejecuta `supabase/schema.sql` completo (tablas, seguridad por usuario, vistas, función `resumen` y bucket de fotos).
3. En Authentication > Users crea el usuario de la clienta (correo y contraseña). La app no tiene registro público.
4. Copia `.env.example` a `.env.local` y pega la URL y la clave pública del proyecto (Project Settings > API).
5. `npm install` y `npm run dev`.

## Cómo se calcula

- Costo real de un artículo = costo unitario + transporte del viaje ÷ unidades del viaje.
- Stock = comprado − vendido (ventas anuladas no cuentan).
- Ganancia del mes = ventas − costo real de lo vendido − gastos del negocio.
- Me deben = suma de saldos de ventas no anuladas.
- Dinero disponible = abonos cobrados − compras (con transporte) − gastos − retiros.
- Un retiro personal no es gasto: baja el dinero disponible, no la ganancia.

## Pendiente

- Probar contra un proyecto real de Supabase.
- Icono e instalación como app (PWA).
