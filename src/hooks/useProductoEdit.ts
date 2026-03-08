import { useState, useEffect, useCallback } from 'react';
import type { ProductoFormData } from '@/types/inventario-view.types';

const FORM_EMPTY: ProductoFormData = {
  nombre: '', sku: '', proveedor: '', modelo: '', color: '', codigo_barras: '',
  precio_adquisicion: '', precio_venta_etiqueta: '', sucursal_id: '', stock_inicial: '',
};

interface UseProductoEditResult {
  formData: ProductoFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductoFormData>>;
  varianteId: number | null;
  inventarioId: number | null;
  loading: boolean;
}

export function useProductoEdit(
  open: boolean,
  productoId: number | null,
  onClose: () => void,
  showToast: (msg: string, type: 'success' | 'error') => void,
): UseProductoEditResult {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductoFormData>(FORM_EMPTY);
  const [varianteId, setVarianteId] = useState<number | null>(null);
  const [inventarioId, setInventarioId] = useState<number | null>(null);

  const fetchProducto = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/productos/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const producto = await res.json();
      const variante = producto.variantes[0] ?? null;
      setVarianteId(variante?.id_variante ?? null);

      let inventario = null;
      if (variante) {
        const resSuc = await fetch(`/api/v1/inventario/sucursales`, { credentials: 'include' });
        if (resSuc.ok) {
          const { data: sucursales = [] } = await resSuc.json();
          for (const s of sucursales) {
            const r = await fetch(`/api/v1/inventario?sucursal_id=${s.id_sucursal}`, { credentials: 'include' });
            if (!r.ok) continue;
            const { data = [] } = await r.json();
            const found = data.find((item: { id_variante: number }) => item.id_variante === variante.id_variante);
            if (found) { inventario = found; break; }
          }
        }
      }

      setInventarioId(inventario?.id_inventario ?? null);
      setFormData({
        nombre: producto.nombre,
        sku: producto.sku,
        proveedor: producto.proveedor ?? '',
        modelo: variante?.modelo ?? '',
        color: variante?.color ?? '',
        codigo_barras: variante?.codigo_barras ?? '',
        precio_adquisicion: variante ? String(variante.precio_adquisicion) : '',
        precio_venta_etiqueta: variante ? String(variante.precio_venta_etiqueta) : '',
        sucursal_id: '',
        stock_inicial: inventario ? String(inventario.stock_actual) : '0',
      });
    } catch {
      showToast('Error al cargar el producto', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [onClose, showToast]);

  useEffect(() => {
    if (open && productoId) {
      fetchProducto(productoId);
    } else {
      setFormData(FORM_EMPTY);
      setVarianteId(null);
      setInventarioId(null);
    }
  }, [open, productoId, fetchProducto]);

  return { formData, setFormData, varianteId, inventarioId, loading };
}