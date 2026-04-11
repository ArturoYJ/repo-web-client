import { useState, useEffect, useCallback } from 'react';
import type { Sucursal, InventarioItem, VentaFormData, VentaFormErrors, MotivoTransaccion } from '@/types/ventas-view.types';

const FORM_INITIAL: VentaFormData = {
  sucursal_id: '',
  id_variante: '',
  cantidad: '',
  precio_venta_final: '',
  id_motivo: '',
};

interface UseVentaFormResult {
  formData: VentaFormData;
  formErrors: VentaFormErrors;
  submitting: boolean;
  sucursales: Sucursal[];
  loadingSucursales: boolean;
  motivos: MotivoTransaccion[];
  filteredInventario: InventarioItem[];
  loadingInventario: boolean;
  searchProducto: string;
  selectedProduct: InventarioItem | null;
  total: number | null;
  setSearchProducto: (value: string) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSelectProduct: (item: InventarioItem) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleClose: () => void;
}

export interface VentaFormOptions {
  preselectedSucursalId?: number;
  preselectedVarianteId?: number;
  initialSearchTerm?: string;
}

export function useVentaForm(
  open: boolean,
  onClose: () => void,
  onSuccess: () => void,
  showToast: (msg: string, type: 'success' | 'error') => void,
  options?: VentaFormOptions,
): UseVentaFormResult {
  const [formData, setFormData] = useState<VentaFormData>(FORM_INITIAL);
  const [formErrors, setFormErrors] = useState<VentaFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [motivos, setMotivos] = useState<MotivoTransaccion[]>([]);

  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [filteredInventario, setFilteredInventario] = useState<InventarioItem[]>([]);
  const [loadingInventario, setLoadingInventario] = useState(false);
  const [searchProducto, setSearchProducto] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<InventarioItem | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const fetchInventario = useCallback(async (sucursalId: string, autoSelectVarianteId?: number, searchTerm?: string) => {
    if (!sucursalId) { setInventario([]); setFilteredInventario([]); return; }
    setLoadingInventario(true);
    try {
      const r = await fetch(`/api/v1/inventario?sucursal_id=${sucursalId}`, { credentials: 'include' });
      const d = r.ok ? await r.json() : { data: [] };
      const items: InventarioItem[] = (d.data || []).filter((item: InventarioItem) => item.stock_actual > 0);
      setInventario(items);

      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        setFilteredInventario(items.filter(item =>
          item.nombre_producto.toLowerCase().includes(lower) ||
          item.sku_producto.toLowerCase().includes(lower)
        ));
      } else {
        setFilteredInventario(items);
      }

      if (autoSelectVarianteId) {
        const match = items.find(i => i.id_variante === autoSelectVarianteId);
        if (match) {
          setSelectedProduct(match);
          setFormData(prev => ({
            ...prev,
            id_variante: String(match.id_variante),
            precio_venta_final: String(match.precio_venta),
          }));
        }
      }
    } catch {
      setInventario([]);
      setFilteredInventario([]);
    } finally {
      setLoadingInventario(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoadingSucursales(true);

    if (options?.initialSearchTerm) {
      setSearchProducto(options.initialSearchTerm);
    }

    Promise.all([
      fetch(`/api/v1/inventario/sucursales`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { data: [] })
        .then(d => {
          const lista: Sucursal[] = d.data || [];
          setSucursales(lista);
          if (options?.preselectedSucursalId) {
            const sid = String(options.preselectedSucursalId);
            setFormData(prev => ({ ...prev, sucursal_id: sid }));
            fetchInventario(sid, options.preselectedVarianteId, options.initialSearchTerm);
          }
        })
        .catch(() => setSucursales([])),
      fetch(`/api/v1/motivos`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { data: [] })
        .then(d => {
          const lista: MotivoTransaccion[] = d.data || [];
          setMotivos(lista);
          if (lista.length > 0) {
            setFormData(prev => ({ ...prev, id_motivo: String(lista[0].id_motivo) }));
          }
        })
        .catch(() => setMotivos([])),
    ]).finally(() => setLoadingSucursales(false));
  }, [open]);

  useEffect(() => {
    if (!searchProducto.trim()) { setFilteredInventario(inventario); return; }
    const lower = searchProducto.toLowerCase();
    setFilteredInventario(inventario.filter(item =>
      item.nombre_producto.toLowerCase().includes(lower) ||
      item.sku_producto.toLowerCase().includes(lower)
    ));
  }, [searchProducto, inventario]);

  useEffect(() => {
    const qty = Number(formData.cantidad);
    const price = Number(formData.precio_venta_final);
    setTotal(qty > 0 && price >= 0 ? qty * price : null);
  }, [formData.cantidad, formData.precio_venta_final]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: undefined }));

    if (name === 'sucursal_id') {
      setFormData(prev => ({ ...prev, sucursal_id: value, id_variante: '', cantidad: '', precio_venta_final: '' }));
      setSelectedProduct(null);
      setSearchProducto('');
      fetchInventario(value);
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectProduct = (item: InventarioItem) => {
    setSelectedProduct(item);
    setFormData(prev => ({
      ...prev,
      id_variante: String(item.id_variante),
      precio_venta_final: String(item.precio_venta),
    }));
    setFormErrors(prev => ({ ...prev, id_variante: undefined }));
  };

  const validate = (): boolean => {
    const errors: VentaFormErrors = {};
    if (!formData.sucursal_id) errors.sucursal_id = 'Selecciona una sucursal';
    if (!formData.id_variante) errors.id_variante = 'Selecciona un producto';
    if (!formData.cantidad || Number(formData.cantidad) <= 0) errors.cantidad = 'Ingresa una cantidad válida';
    if (!formData.precio_venta_final || Number(formData.precio_venta_final) < 0) errors.precio_venta_final = 'Ingresa un precio válido';
    if (selectedProduct && Number(formData.cantidad) > selectedProduct.stock_actual) {
      errors.cantidad = `Stock insuficiente. Disponible: ${selectedProduct.stock_actual}`;
    }
    if (selectedProduct && Number(formData.precio_venta_final) < selectedProduct.precio_adquisicion) {
      errors.precio_venta_final = `El precio no puede ser menor al costo de adquisición ($${selectedProduct.precio_adquisicion})`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const reset = () => {
    const primerMotivo = motivos.length > 0 ? String(motivos[0].id_motivo) : '';
    setFormData({ ...FORM_INITIAL, id_motivo: primerMotivo });
    setFormErrors({});
    setSelectedProduct(null);
    setInventario([]);
    setFilteredInventario([]);
    setSearchProducto('');
    setTotal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id_variante: Number(formData.id_variante),
          id_sucursal: Number(formData.sucursal_id),
          id_motivo: Number(formData.id_motivo),
          cantidad: Number(formData.cantidad),
          precio_venta_final: Number(formData.precio_venta_final),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar venta');
      showToast('Venta registrada exitosamente', 'success');
      onSuccess();
      reset();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al registrar venta', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  return {
    formData,
    formErrors,
    submitting,
    sucursales,
    loadingSucursales,
    motivos,
    filteredInventario,
    loadingInventario,
    searchProducto,
    selectedProduct,
    total,
    setSearchProducto,
    handleChange,
    handleSelectProduct,
    handleSubmit,
    handleClose,
  };
}