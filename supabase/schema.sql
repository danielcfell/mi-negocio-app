-- Mi Negocio: esquema para Supabase (una sola usuaria)
-- Ejecutar completo en el SQL Editor de Supabase o como migración.

-- ============ TABLAS ============

create table public.compras (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha       date not null default current_date,
  lugar       text,
  transporte  numeric(12,2) not null default 0 check (transporte >= 0),
  created_at  timestamptz not null default now()
);

create table public.productos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  compra_id       uuid not null references public.compras (id) on delete cascade,
  nombre          text not null,
  foto_url        text,
  cantidad        integer not null check (cantidad > 0),
  costo_unitario  numeric(12,2) not null check (costo_unitario >= 0),
  precio_venta    numeric(12,2) not null check (precio_venta >= 0),
  created_at      timestamptz not null default now()
);

create table public.ventas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  producto_id  uuid not null references public.productos (id) on delete restrict,
  cantidad     integer not null check (cantidad > 0),
  precio       numeric(12,2) not null check (precio >= 0),   -- precio unitario cobrado
  fecha        date not null default current_date,
  cliente      text,
  abonado      numeric(12,2) not null default 0 check (abonado >= 0),
  anulada      boolean not null default false,
  created_at   timestamptz not null default now()
);

create table public.gastos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha       date not null default current_date,
  concepto    text not null,
  monto       numeric(12,2) not null check (monto >= 0),
  created_at  timestamptz not null default now()
);

-- Dinero personal: 'retiro' = saqué para mí, 'aporte' = puse dinero en el negocio
create table public.retiros (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha       date not null default current_date,
  monto       numeric(12,2) not null check (monto >= 0),
  nota        text,
  tipo        text not null default 'retiro' check (tipo in ('retiro', 'aporte')),
  created_at  timestamptz not null default now()
);

create index on public.productos (compra_id, user_id);
create index on public.ventas (producto_id, user_id);
create index on public.ventas (fecha);
create index on public.gastos (fecha);
create index on public.compras (user_id);
create index on public.productos (user_id);
create index on public.ventas (user_id);
create index on public.gastos (user_id);
create index on public.retiros (user_id);

-- Cada producto y venta solo puede apuntar a filas del mismo usuario
alter table public.compras   add constraint compras_id_user_unique   unique (id, user_id);
alter table public.productos add constraint productos_id_user_unique unique (id, user_id);
alter table public.productos
  add constraint productos_compra_mismo_usuario
  foreign key (compra_id, user_id) references public.compras (id, user_id) on delete cascade;
alter table public.ventas
  add constraint ventas_producto_mismo_usuario
  foreign key (producto_id, user_id) references public.productos (id, user_id) on delete restrict;

-- Un abono no puede superar el total de la venta
alter table public.ventas
  add constraint abono_no_supera_total check (abonado <= cantidad * precio);

-- No se puede vender más de lo que hay en stock
create or replace function public.validar_stock() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  comprado integer;
  vendido  integer;
begin
  if new.anulada then
    return new;
  end if;

  select cantidad into comprado from public.productos where id = new.producto_id;
  if comprado is null then
    raise exception 'Producto no encontrado';
  end if;

  select coalesce(sum(cantidad), 0) into vendido
  from public.ventas
  where producto_id = new.producto_id
    and not anulada
    and id is distinct from new.id;

  if vendido + new.cantidad > comprado then
    raise exception 'No hay stock suficiente: quedan % unidades', comprado - vendido;
  end if;
  return new;
end;
$$;

create trigger ventas_validar_stock
  before insert or update on public.ventas
  for each row execute function public.validar_stock();

-- Al corregir un producto, la cantidad no puede quedar por debajo de lo ya vendido
create or replace function public.validar_cantidad_producto() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  vendido integer;
begin
  select coalesce(sum(cantidad), 0) into vendido
  from public.ventas
  where producto_id = new.id and not anulada;

  if new.cantidad < vendido then
    raise exception 'Ya vendiste % unidades; la cantidad no puede ser menor', vendido;
  end if;
  return new;
end;
$$;

create trigger productos_validar_cantidad
  before update of cantidad on public.productos
  for each row execute function public.validar_cantidad_producto();

-- ============ SEGURIDAD (RLS) ============

alter table public.compras   enable row level security;
alter table public.productos enable row level security;
alter table public.ventas    enable row level security;
alter table public.gastos    enable row level security;
alter table public.retiros   enable row level security;

create policy "mis compras"   on public.compras   for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "mis productos" on public.productos for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "mis ventas"    on public.ventas    for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "mis gastos"    on public.gastos    for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "mis retiros"   on public.retiros   for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ============ VISTAS ============

-- Stock y costo real por producto.
-- costo_real = costo unitario + parte del transporte del viaje (transporte / unidades del viaje)
create or replace view public.productos_stock
with (security_invoker = true) as
select
  p.id,
  p.compra_id,
  p.nombre,
  p.foto_url,
  p.cantidad                                           as comprado,
  coalesce(v.vendido, 0)                               as vendido,
  p.cantidad - coalesce(v.vendido, 0)                  as stock,
  p.costo_unitario,
  round(p.costo_unitario + c.transporte / nullif(t.unidades, 0), 2) as costo_real,
  p.precio_venta,
  round(p.precio_venta - (p.costo_unitario + c.transporte / nullif(t.unidades, 0)), 2) as ganancia_unidad,
  c.fecha                                              as fecha_compra,
  coalesce(v.num_ventas, 0)                            as num_ventas,
  p.created_at                                         as creado
from public.productos p
join public.compras c on c.id = p.compra_id
join (
  select compra_id, sum(cantidad) as unidades
  from public.productos
  group by compra_id
) t on t.compra_id = p.compra_id
left join (
  select producto_id,
         sum(cantidad) filter (where not anulada) as vendido,
         count(*) as num_ventas
  from public.ventas
  group by producto_id
) v on v.producto_id = p.id;

-- Ventas con su producto, total, saldo y ganancia
create or replace view public.ventas_detalle
with (security_invoker = true) as
select
  v.id,
  v.fecha,
  v.cliente,
  v.cantidad,
  v.precio,
  v.cantidad * v.precio                         as total,
  v.abonado,
  v.cantidad * v.precio - v.abonado             as saldo,
  v.anulada,
  ps.id                                         as producto_id,
  ps.nombre                                     as producto,
  round(v.cantidad * (v.precio - ps.costo_real), 2) as ganancia,
  v.created_at                                  as creada
from public.ventas v
join public.productos_stock ps on ps.id = v.producto_id;

-- ============ RESUMEN DEL PANEL ============

create or replace function public.resumen(p_desde date, p_hasta date)
returns table (
  ventas_periodo     numeric,
  costo_vendido      numeric,
  gastos_periodo     numeric,
  ganancia_periodo   numeric,
  me_deben           numeric,
  valor_stock        numeric,
  dinero_disponible  numeric
)
language sql stable security invoker
set search_path = ''
as $$
  with
  vp as (
    select coalesce(sum(total), 0) as ventas,
           coalesce(sum(total - ganancia), 0) as costo
    from public.ventas_detalle
    where not anulada and fecha between p_desde and p_hasta
  ),
  gp as (
    select coalesce(sum(monto), 0) as gastos
    from public.gastos
    where fecha between p_desde and p_hasta
  ),
  deben as (
    select coalesce(sum(saldo), 0) as monto
    from public.ventas_detalle
    where not anulada
  ),
  stock as (
    select coalesce(sum(stock * costo_real), 0) as valor
    from public.productos_stock
  ),
  caja as (
    select
      (select coalesce(sum(abonado), 0) from public.ventas where not anulada)
      + (select coalesce(sum(case when tipo = 'aporte' then monto else -monto end), 0) from public.retiros)
      - (select coalesce(sum(p.cantidad * p.costo_unitario), 0) from public.productos p)
      - (select coalesce(sum(transporte), 0) from public.compras)
      - (select coalesce(sum(monto), 0) from public.gastos) as disponible
  )
  select
    vp.ventas,
    vp.costo,
    gp.gastos,
    vp.ventas - vp.costo - gp.gastos,
    deben.monto,
    stock.valor,
    caja.disponible
  from vp, gp, deben, stock, caja;
$$;

-- ============ FOTOS DE PRODUCTOS ============

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

create policy "subir mis fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'productos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "ver mis fotos" on storage.objects for select to authenticated
  using (bucket_id = 'productos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "borrar mis fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'productos' and (storage.foldername(name))[1] = (select auth.uid())::text);
