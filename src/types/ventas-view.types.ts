export interface VentaDetallada {
  id_transaccion: number;
  fecha_hora: string;
  nombre_producto: string;
  sku: string;
  sku_variante: string;
  modelo: string | null;
  color: string | null;
  nombre_sucursal: string;
  cantidad: number;
  precio_venta_final: string;
  motivo: string;
  nombre_usuario: string;
  precio_adquisicion: string;
  utilidad: string;
}

export interface Sucursal {
  id_sucursal: number;
  nombre_lugar: string;
  ubicacion?: string;
}

export interface InventarioItem {
  id_inventario: number;
  id_variante: number;
  id_sucursal: number;
  nombre_sucursal: string;
  sku_producto: string;
  nombre_producto: string;
  stock_actual: number;
  precio_venta: number;
  precio_adquisicion: number;
  modelo: string | null;
  color: string | null;
}

export interface VentaFormData {
  sucursal_id: string;
  id_variante: string;
  cantidad: string;
  precio_venta_final: string;
  id_motivo: string;
}

export interface VentaFormErrors {
  sucursal_id?: string;
  id_variante?: string;
  cantidad?: string;
  precio_venta_final?: string;
}

export interface VentaFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  preselectedSucursalId?: number;
  preselectedVarianteId?: number;
  initialSearchTerm?: string;
}

export interface MotivoTransaccion {
  id_motivo: number;
  descripcion: string;
}