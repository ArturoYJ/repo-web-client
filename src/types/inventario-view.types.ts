export interface Variante {
  id_variante: number;
  precio_adquisicion: number;
  precio_venta_etiqueta: number;
  sucursal?: string;
}

export interface Producto {
  id_producto_maestro: number;
  sku: string;
  nombre: string;
  proveedor: string | null;
  variantes: Variante[];
}

export interface ProductoFila {
  id: number;
  sku: string;
  nombre: string;
  proveedor: string | null;
  totalStock: number;
  valorOriginal: number;
  valorVenta: number;
  sucursal: string;
}

export interface VarianteDetalle {
  id_variante: number;
  codigo_barras: string;
  modelo: string | null;
  color: string | null;
  precio_adquisicion: number;
  precio_venta_etiqueta: number;
}

export interface ProductoCompleto {
  id_producto_maestro: number;
  sku: string;
  nombre: string;
  proveedor: string | null;
  variantes: VarianteDetalle[];
}

export interface InventarioInfo {
  sucursal: string;
  stock_actual: number;
}

export interface ProductoFormData {
  nombre: string;
  sku: string;
  proveedor: string;
  modelo: string;
  color: string;
  codigo_barras: string;
  precio_adquisicion: string;
  precio_venta_etiqueta: string;
  sucursal_id: string;
  stock_inicial: string;
}

export interface ProductoFormErrors {
  nombre?: string;
  precio_adquisicion?: string;
  precio_venta_etiqueta?: string;
  sucursal_id?: string;
}

export interface SucursalForm {
  id_sucursal: number;
  nombre_lugar: string;
  ubicacion: string;
}