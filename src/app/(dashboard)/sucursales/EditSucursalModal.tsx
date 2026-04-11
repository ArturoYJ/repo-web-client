'use client';

import { useState, useEffect } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import styles from './CreateSucursal.module.css';

interface EditSucursalModalProps {
  open: boolean;
  sucursalId: number | null;
  initialNombre: string;
  initialUbicacion: string;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function EditSucursalModal({
  open,
  sucursalId,
  initialNombre,
  initialUbicacion,
  onClose,
  onSuccess,
  showToast,
}: EditSucursalModalProps) {
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setNombre(initialNombre);
      setUbicacion(initialUbicacion);
      setError('');
    }
  }, [open, initialNombre, initialUbicacion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    if (!sucursalId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/sucursales/${sucursalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre_lugar: nombre.trim(), ubicacion: ubicacion.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar sucursal');
      showToast('Sucursal actualizada correctamente', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al actualizar sucursal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !submitting && onClose()} title="Editar sucursal">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Nombre *</label>
          <input
            className={styles.input}
            type="text"
            value={nombre}
            onChange={e => { setNombre(e.target.value); setError(''); }}
            placeholder="Nombre de la sucursal"
            disabled={submitting}
          />
          {error && <p className={styles.error}>{error}</p>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Ubicación</label>
          <input
            className={styles.input}
            type="text"
            value={ubicacion}
            onChange={e => setUbicacion(e.target.value)}
            placeholder="Dirección o descripción (opcional)"
            disabled={submitting}
          />
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar cambios'}</Button>
        </div>
      </form>
    </Dialog>
  );
}