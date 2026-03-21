'use client';

import { useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import NuevaVarianteForm, {
  VarianteFormData,
  VarianteFormErrors,
  validateVarianteField,
  buildVarianteFormErrors
} from './Nuevavariante';
import type { SucursalForm } from '@/types/inventario-view.types';

interface AddVarianteModalProps {
  open: boolean;
  productoId: number | null;
  productoNombre: string;
  sucursales: SucursalForm[];
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const FORM_INITIAL: VarianteFormData = {
  modelo: '', color: '', codigo_barras: '',
  precio_adquisicion: '', precio_venta_etiqueta: '',
  sucursal_id: '', stock_inicial: '', fecha_compra: '',
};

export default function AddVarianteModal({
  open,
  productoId,
  productoNombre,
  sucursales,
  onClose,
  onSuccess,
  showToast
}: AddVarianteModalProps) {
  const [formData, setFormData] = useState<VarianteFormData>(FORM_INITIAL);
  const [formErrors, setFormErrors] = useState<VarianteFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const errorOrUndefined = validateVarianteField(name as keyof VarianteFormData, value, formData.precio_adquisicion);
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      if (errorOrUndefined) {
        newErrors[name] = errorOrUndefined;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData(FORM_INITIAL);
      setFormErrors({});
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId) return;

    const errors = buildVarianteFormErrors(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id_producto_maestro: productoId,
        ...(formData.codigo_barras.trim() && { codigo_barras: formData.codigo_barras.trim() }),
        ...(formData.modelo.trim() && { modelo: formData.modelo.trim() }),
        ...(formData.color.trim() && { color: formData.color.trim() }),
        precio_adquisicion: Number(formData.precio_adquisicion),
        precio_venta_etiqueta: Number(formData.precio_venta_etiqueta),
        sucursal_id: Number(formData.sucursal_id),
        stock_inicial: Number(formData.stock_inicial) || 0,
        ...(formData.fecha_compra && { fecha_compra: formData.fecha_compra }),
      };

      const res = await fetch(`/api/v1/variantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agregar variante');

      showToast('Variante agregada correctamente', 'success');
      setFormData(FORM_INITIAL);
      setFormErrors({});
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error interno al guardar', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title={`Agregar variante: ${productoNombre}`}>
      <NuevaVarianteForm
        formData={formData}
        formErrors={formErrors}
        sucursales={sucursales}
        loadingSucursales={false}
        submitting={submitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleClose}
      />
    </Dialog>
  );
}