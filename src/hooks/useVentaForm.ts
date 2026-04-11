import { useState, useEffect, useCallback, useRef } from 'react';
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
  motivos: MotivoTransaccion[];
  allInventario: InventarioItem[];
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
  const [motivos, setMotivos] = useState<MotivoTransaccion[]>([]);

  const [allInventario, setAllInventario] = useState<InventarioItem[]>([]);
  const [filteredInventario, setFilteredInventario] = useState<InventarioItem[]>([]);
  const [loadingInventario, setLoadingInventario] = useState(false);
  const [searchProducto, setSearchProducto] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<InventarioItem | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const initializedRef = useRef(false);

  const fetchAllInventario = useCallback(async (sucursales: Sucursal[], preselectVarianteId?: number) => {
    setLoadingInventario(true);
    try {
      const results = await Promise.all(
        sucursales.map(async (s) => {
          const r = await fetch(`/api/v1/inventario?sucursal_id=${s.id_sucursal}`, { credentials: 'include' });
          const d = r.ok ? await r.json() : { data: [] };
          return (d.data || [])
            .filter((item: InventarioItem) => item.stock_actual > 0)
            .map((item: InventarioItem) => ({ ...item, id_sucursal: s.id_sucursal, nombre_sucursal: s.nombre_lugar }));
        })
      );
      const flat: InventarioItem[] = results.flat();
      setAllInventario(flat);
      setFilteredInventario(flat);

      if (preselectVarianteId) {
        const match = flat.find(i => i.id_variante === preselectVarianteId && (!options?.preselectedSucursalId || i.id_sucursal === options.preselectedSucursalId));
        if (match) {
          setSelectedProduct(match);
          setFormData(prev => ({
            ...prev,
            id_variante: String(match.id_variante),
            sucursal_id: String(match.id_sucursal),
            precio_venta_final: String(match.precio_venta),
          }));
        }
      }
    } catch {
      setAllInventario([]);
      setFilteredInventario([]);
    } finally {
      setLoadingInventario(false);
    }
  }, []);

  useEffect(() => {
    if (!open) { initializedRef.current = false; return; }
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (options?.initialSearchTerm) {
      setSearchProducto(options.initialSearchTerm);
    }

    Promise.all([
      fetch(`/api/v1/inventario/sucursales`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { data: [] })
        .then(d => d.data as Sucursal[] || [])
        .catch(() => [] as Sucursal[]),
      fetch(`/api/v1/motivos`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { data: [] })
        .then(d => d.data as MotivoTransaccion[] || [])
        .catch(() => [] as MotivoTransaccion[]),
    ]).then(([sucursales, listaMotivos]) => {
      setMotivos(listaMotivos);
      if (listaMotivos.length > 0) {
        setFormData(prev => ({ ...prev, id_motivo: String(listaMotivos[0].id_motivo) }));
      }
      fetchAllInventario(sucursales, options?.preselectedVarianteId);
    });
  }, [open]);

  useEffect(() => {
    const term = searchProducto.trim().toLowerCase();
    if (!term) { setFilteredInventario(allInventario); return; }
    setFilteredInventario(allInventario.filter(item =>
      item.nombre_producto.toLowerCase().includes(term) ||
      item.sku_producto.toLowerCase().includes(term) ||
      (item.modelo || '').toLowerCase().includes(term)
    ));
  }, [searchProducto, allInventario]);

  useEffect(() => {
    const qty = Number(formData.cantidad);
    const price = Number(formData.precio_venta_final);
    setTotal(qty > 0 && price >= 0 ? qty * price : null);
  }, [formData.cantidad, formData.precio_venta_final]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectProduct = (item: InventarioItem) => {
    setSelectedProduct(item);
    setFormData(prev => ({
      ...prev,
      id_variante: String(item.id_variante),
      sucursal_id: String(item.id_sucursal),
      precio_venta_final: String(item.precio_venta),
    }));
    setFormErrors(prev => ({ ...prev, id_variante: undefined }));
  };

  const validate = (): boolean => {
    const errors: VentaFormErrors = {};
    if (!formData.id_variante) errors.id_variante = 'Selecciona un producto';
    if (!formData.cantidad || Number(formData.cantidad) <= 0) errors.cantidad = 'Ingresa una cantidad válida';
    if (!formData.precio_venta_final || Number(formData.precio_venta_final) < 0) errors.precio_venta_final = 'Ingresa un precio válido';
    if (selectedProduct && Number(formData.cantidad) > selectedProduct.stock_actual) {
      errors.cantidad = `Stock insuficiente. Disponible: ${selectedProduct.stock_actual}`;
    }
    if (selectedProduct && Number(formData.precio_venta_final) < selectedProduct.precio_adquisicion) {
      errors.precio_venta_final = `El precio no puede ser menor al costo ($${selectedProduct.precio_adquisicion})`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const reset = () => {
    const primerMotivo = motivos.length > 0 ? String(motivos[0].id_motivo) : '';
    setFormData({ ...FORM_INITIAL, id_motivo: primerMotivo });
    setFormErrors({});
    setSelectedProduct(null);
    setAllInventario([]);
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
    motivos,
    allInventario,
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