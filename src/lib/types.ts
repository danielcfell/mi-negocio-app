export type ProductoStock = {
  id: string;
  compra_id: string;
  nombre: string;
  foto_url: string | null;
  comprado: number;
  vendido: number;
  stock: number;
  costo_unitario: number;
  costo_real: number;
  precio_venta: number;
  ganancia_unidad: number;
  fecha_compra: string;
  /** Ventas registradas, incluidas las anuladas */
  num_ventas: number;
  creado: string;
  eliminado: boolean;
};

export type VentaDetalle = {
  id: string;
  fecha: string;
  cliente: string | null;
  cantidad: number;
  precio: number;
  total: number;
  abonado: number;
  saldo: number;
  anulada: boolean;
  producto_id: string;
  producto: string;
  ganancia: number;
  creada: string;
  /** Quitada de la lista; sigue contando en los números */
  oculta: boolean;
};

export type Gasto = {
  id: string;
  fecha: string;
  concepto: string;
  monto: number;
};

export type Retiro = {
  id: string;
  fecha: string;
  monto: number;
  nota: string | null;
  tipo: "retiro" | "aporte";
};

export type Resumen = {
  ventas_periodo: number;
  costo_vendido: number;
  gastos_periodo: number;
  ganancia_periodo: number;
  me_deben: number;
  valor_stock: number;
  dinero_disponible: number;
};
