'use client';

import { useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import NuevoProductoForm, { FormErrors, validateField, buildFormErrors } from './Nuevoproducto';
import type { FormData } from './Nuevoproducto';
import { useProductoEdit } from '@/hooks/useProductoEdit';
import formStyles from './form.module.css';

interface EditProductoModalProps {
  open: boolean;
  productoId: number | null;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function EditProductoModal({
  open,
  productoId,
  onClose,
  onSuccess,
  showToast,
}: EditProductoModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { formData, setFormData, loading } = useProductoEdit(
    open,
    productoId,
    onClose,
    showToast,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: validateField(name as keyof FormData, value, formData.precio_adquisicion) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId) return;

    const errors = buildFormErrors(formData, false, true);
    if (errors.nombre) { setFormErrors(errors); return; }

    setSubmitting(true);
    try {
      const result = await fetch(`/api/v1/productos/${productoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          sku: formData.sku.trim() || undefined,
          proveedor: formData.proveedor.trim() || undefined,
        }),
      });

      if (!result.ok) {
        const d = await result.json().catch(() => ({}));
        showToast(d.error ?? 'Error al guardar', 'error');
        return;
      }
      showToast('Producto actualizado correctamente', 'success');
      onSuccess();
      onClose();
    } catch {
      showToast('Error al actualizar el producto', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) { setFormErrors({}); onClose(); }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Editar producto">
      {loading ? (
        <p className={formStyles.loadingText}>Cargando datos...</p>
      ) : (
        <NuevoProductoForm
          formData={formData}
          formErrors={formErrors}
          submitting={submitting}
          submitLabel="Guardar cambios"
          showSucursal={false}
          isCreationMode={true}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      )}
    </Dialog>
  );
}