'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import formStyles from './form.module.css';

const COLORES_PREDEFINIDOS = [
  'Amarillo', 'Azul', 'Azul marino', 'Beige', 'Blanco', 'Café', 'Champagne',
  'Coral', 'Crema', 'Dorado', 'Estampado', 'Estampado floral', 'Estampado geométrico',
  'Fucsia', 'Gris', 'Gris oscuro', 'Lavanda', 'Lila', 'Magenta', 'Menta',
  'Morado', 'Naranja', 'Negro', 'Nude', 'Plateado', 'Rojo', 'Rosa', 'Rosa pastel',
  'Salmón', 'Terracota', 'Turquesa', 'Verde', 'Verde olivo', 'Vino',
  'Con textura', 'Brillante', 'Mate', 'Metálico', 'Transparente', 'Bicolor',
];

const MOTIVOS_AJUSTE = [
  'Venta directa al cliente',
  'Baja por merma / daño',
  'Ajuste de inventario (Sobrante)',
  'Ajuste de inventario (Faltante)',
  'Ingreso por adquisición / compra',
];

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtrados = COLORES_PREDEFINIDOS.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (color: string) => {
    onChange(color);
    setOpen(false);
    setSearch('');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSearch(e.target.value);
    setOpen(true);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          className={formStyles.input}
          type="text"
          placeholder="Color / acabado"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        <button
          type="button"
          aria-label="Abrir selector de color"
          className={formStyles.input}
          style={{ width: '40px', flexShrink: 0, cursor: 'pointer', textAlign: 'center', padding: '0' }}
          onClick={() => { setOpen(o => !o); setSearch(''); }}
        >
          ▾
        </button>
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          zIndex: 100,
          top: '100%',
          left: 0,
          right: 0,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          maxHeight: '200px',
          overflowY: 'auto',
          marginTop: '2px',
        }}>
          <div style={{ padding: '6px' }}>
            <input
              className={formStyles.input}
              type="text"
              placeholder="Buscar color..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{ marginBottom: '4px' }}
            />
          </div>
          {filtrados.length === 0 ? (
            <p style={{ padding: '8px 12px', color: '#6b7280', fontSize: '13px' }}>Sin coincidencias</p>
          ) : (
            filtrados.map(color => (
              <div
                key={color}
                onClick={() => handleSelect(color)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  background: value === color ? '#fdf2f8' : 'transparent',
                  color: value === color ? '#9d174d' : '#111827',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fdf2f8')}
                onMouseLeave={e => (e.currentTarget.style.background = value === color ? '#fdf2f8' : 'transparent')}
              >
                {color}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface StockEntry {
  id_inventario: number;
  id_sucursal: number;
  nombre_sucursal: string;
  stock_actual: number;
}

interface EditVarianteModalProps {
  open: boolean;
  varianteId: number | null;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function EditVarianteModal({ open, varianteId, onClose, onSuccess, showToast }: EditVarianteModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre_maestro: '',
    sku_variante: '',
    modelo: '',
    color: '',
    codigo_barras: '',
    precio_adquisicion: '',
    precio_venta_etiqueta: '',
    fecha_compra: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [ajusteStockId, setAjusteStockId] = useState('');
  const [ajusteCantidad, setAjusteCantidad] = useState('');
  const [ajusteMotivo, setAjusteMotivo] = useState('');
  const [ajusteErrors, setAjusteErrors] = useState<Record<string, string>>({});
  const [submittingAjuste, setSubmittingAjuste] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchVariante = async () => {
      if (!open || !varianteId) return;
      setLoading(true);
      try {
        const [resVariante, resStock] = await Promise.all([
          fetch(`/api/v1/variantes/${varianteId}`, { credentials: 'include' }),
          fetch(`/api/v1/inventario/variante/${varianteId}`, { credentials: 'include' }),
        ]);

        if (!resVariante.ok) throw new Error('Error al cargar la variante');
        const json = await resVariante.json();
        const v = json.data || json;

        let pName = 'Producto Maestro';
        if (v.id_producto_maestro) {
          const pRes = await fetch(`/api/v1/productos/${v.id_producto_maestro}`, { credentials: 'include' });
          if (pRes.ok) {
            const pData = await pRes.json();
            pName = pData.nombre || pName;
          }
        }

        const stockData = resStock.ok ? await resStock.json() : { data: [] };

        if (active) {
          setFormData({
            nombre_maestro: pName,
            sku_variante: v.sku_variante || '',
            modelo: v.modelo || '',
            color: v.color || '',
            codigo_barras: v.codigo_barras || '',
            precio_adquisicion: v.precio_adquisicion?.toString() || '',
            precio_venta_etiqueta: v.precio_venta_etiqueta?.toString() || '',
            fecha_compra: v.fecha_compra ? v.fecha_compra.split('T')[0] : '',
          });
          setStockEntries(stockData.data || []);
          setAjusteStockId('');
          setAjusteCantidad('');
          setAjusteMotivo('');
          setAjusteErrors({});
        }
      } catch (err) {
        console.error(err);
        if (active) showToast('Error al cargar variante', 'error');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchVariante();
    return () => { active = false; };
  }, [open, varianteId, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleColorChange = (value: string) => {
    setFormData(prev => ({ ...prev, color: value }));
    setFormErrors(prev => ({ ...prev, color: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varianteId) return;

    const errors: Record<string, string> = {};
    if (!formData.sku_variante.trim()) errors.sku_variante = 'El código es requerido';
    if (!formData.precio_adquisicion || Number(formData.precio_adquisicion) < 0) errors.precio_adquisicion = 'Valor inválido';
    if (!formData.precio_venta_etiqueta || Number(formData.precio_venta_etiqueta) < 0) errors.precio_venta_etiqueta = 'Valor inválido';
    if (Number(formData.precio_venta_etiqueta) < Number(formData.precio_adquisicion)) errors.precio_venta_etiqueta = 'No puede ser menor al costo';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/variantes/${varianteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sku_variante: formData.sku_variante.trim(),
          modelo: formData.modelo.trim() || null,
          color: formData.color.trim() || null,
          codigo_barras: formData.codigo_barras.trim(),
          precio_adquisicion: Number(formData.precio_adquisicion),
          precio_venta_etiqueta: Number(formData.precio_venta_etiqueta),
          fecha_compra: formData.fecha_compra || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error ?? 'Error al guardar', 'error');
        return;
      }

      showToast('Variante actualizada correctamente', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Error de red al guardar', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAjusteStock = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!ajusteStockId) errors.ajusteStockId = 'Selecciona una sucursal';
    if (!ajusteCantidad || Number(ajusteCantidad) === 0) errors.ajusteCantidad = 'Ingresa una cantidad distinta de cero';
    if (!ajusteMotivo) errors.ajusteMotivo = 'Selecciona un motivo';

    if (Object.keys(errors).length > 0) {
      setAjusteErrors(errors);
      return;
    }

    const entry = stockEntries.find(s => s.id_inventario === Number(ajusteStockId));
    if (!entry) return;

    setSubmittingAjuste(true);
    try {
      const res = await fetch(`/api/v1/inventario/ajuste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id_variante: varianteId,
          id_sucursal: entry.id_sucursal,
          cantidad: Number(ajusteCantidad),
          motivo: ajusteMotivo,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error ?? d.detalles?.[0]?.mensaje ?? 'Error al ajustar stock', 'error');
        return;
      }

      const updated = await res.json();
      setStockEntries(prev =>
        prev.map(s =>
          s.id_inventario === entry.id_inventario
            ? { ...s, stock_actual: updated.stock_nuevo }
            : s
        )
      );
      setAjusteCantidad('');
      setAjusteMotivo('');
      setAjusteErrors({});
      showToast('Stock ajustado correctamente', 'success');
      onSuccess();
    } catch (err) {
      console.error(err);
      showToast('Error de red al ajustar stock', 'error');
    } finally {
      setSubmittingAjuste(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} title="Editar Variante">
      {loading ? (
        <p className={formStyles.loadingText}>Cargando información...</p>
      ) : (
        <>
          <form onSubmit={handleSubmit} className={formStyles.form}>
            <div className={formStyles.field}>
              <label htmlFor="nombre_maestro" className={formStyles.label}>Nombre del Producto Maestro</label>
              <input
                id="nombre_maestro"
                className={formStyles.input}
                type="text"
                value={formData.nombre_maestro}
                disabled
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  color: '#6b7280',
                  borderColor: '#e5e7eb',
                  cursor: 'not-allowed',
                  fontWeight: '500'
                }}
              />
              <p className={formStyles.hint}>
                El nombre completo se edita en el Producto Maestro.
              </p>
            </div>

            <div className={formStyles.row}>
              <div className={formStyles.field}>
                <label htmlFor="sku_variante" className={formStyles.label}>Código de la Variante</label>
                <input
                  id="sku_variante"
                  className={`${formStyles.input} ${formErrors.sku_variante ? formStyles.inputError : ''}`}
                  type="text"
                  name="sku_variante"
                  value={formData.sku_variante}
                  onChange={handleChange}
                />
                {formErrors.sku_variante && <p className={formStyles.error}>{formErrors.sku_variante}</p>}
              </div>
              <div className={formStyles.field}>
                <label htmlFor="codigo_barras" className={formStyles.label}>Código de barras</label>
                <input
                  id="codigo_barras"
                  className={formStyles.input}
                  type="text"
                  name="codigo_barras"
                  value={formData.codigo_barras}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={formStyles.row}>
              <div className={formStyles.field}>
                <label htmlFor="modelo" className={formStyles.label}>Descripción</label>
                <input
                  id="modelo"
                  className={formStyles.input}
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                />
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Color / Acabado</label>
                <ColorPicker value={formData.color} onChange={handleColorChange} />
              </div>
            </div>

            <div className={formStyles.row}>
              <div className={formStyles.field}>
                <label htmlFor="precio_adquisicion" className={formStyles.label}>Costo (Valor original)</label>
                <input
                  id="precio_adquisicion"
                  className={`${formStyles.input} ${formErrors.precio_adquisicion ? formStyles.inputError : ''}`}
                  type="number"
                  name="precio_adquisicion"
                  min="0"
                  step="0.01"
                  value={formData.precio_adquisicion}
                  onChange={handleChange}
                />
                {formErrors.precio_adquisicion && <p className={formStyles.error}>{formErrors.precio_adquisicion}</p>}
              </div>
              <div className={formStyles.field}>
                <label htmlFor="precio_venta_etiqueta" className={formStyles.label}>Precio Venta</label>
                <input
                  id="precio_venta_etiqueta"
                  className={`${formStyles.input} ${formErrors.precio_venta_etiqueta ? formStyles.inputError : ''}`}
                  type="number"
                  name="precio_venta_etiqueta"
                  min="0"
                  step="0.01"
                  value={formData.precio_venta_etiqueta}
                  onChange={handleChange}
                />
                {formErrors.precio_venta_etiqueta && <p className={formStyles.error}>{formErrors.precio_venta_etiqueta}</p>}
              </div>
            </div>

            <div className={formStyles.field}>
              <label htmlFor="fecha_compra" className={formStyles.label}>Fecha de compra</label>
              <input
                id="fecha_compra"
                className={formStyles.input}
                type="date"
                name="fecha_compra"
                value={formData.fecha_compra}
                onChange={handleChange}
              />
            </div>

            <div className={formStyles.actions}>
              <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar variante'}
              </Button>
            </div>
          </form>

          <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
              Ajustar stock
            </h3>

            {stockEntries.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#6b7280' }}>Sin registros de inventario para esta variante.</p>
            ) : (
              <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {stockEntries.map(s => (
                  <span key={s.id_inventario} style={{ fontSize: '13px', color: '#374151' }}>
                    {s.nombre_sucursal}: <strong>{s.stock_actual} piezas</strong>
                  </span>
                ))}
              </div>
            )}

            <form onSubmit={handleAjusteStock} className={formStyles.form} style={{ marginTop: '8px' }}>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Sucursal a ajustar</label>
                <select
                  aria-label="Sucursal a ajustar"
                  className={`${formStyles.input} ${formStyles.select} ${ajusteErrors.ajusteStockId ? formStyles.inputError : ''}`}
                  value={ajusteStockId}
                  onChange={e => { setAjusteStockId(e.target.value); setAjusteErrors(prev => ({ ...prev, ajusteStockId: '' })); }}
                >
                  <option value="">Selecciona sucursal</option>
                  {stockEntries.map(s => (
                    <option key={s.id_inventario} value={s.id_inventario}>
                      {s.nombre_sucursal} (Stock actual: {s.stock_actual})
                    </option>
                  ))}
                </select>
                {ajusteErrors.ajusteStockId && <p className={formStyles.error}>{ajusteErrors.ajusteStockId}</p>}
              </div>

              <div className={formStyles.field}>
                <label className={formStyles.label}>Cantidad (+) para añadir, (-) para quitar</label>
                <input
                  className={`${formStyles.input} ${ajusteErrors.ajusteCantidad ? formStyles.inputError : ''}`}
                  type="number"
                  placeholder="-3, 5, etc."
                  step="1"
                  value={ajusteCantidad}
                  onChange={e => { setAjusteCantidad(e.target.value); setAjusteErrors(prev => ({ ...prev, ajusteCantidad: '' })); }}
                />
                {ajusteErrors.ajusteCantidad && <p className={formStyles.error}>{ajusteErrors.ajusteCantidad}</p>}
              </div>

              <div className={formStyles.field}>
                <label className={formStyles.label}>Motivo del ajuste</label>
                <select
                  aria-label="Motivo del ajuste"
                  className={`${formStyles.input} ${formStyles.select} ${ajusteErrors.ajusteMotivo ? formStyles.inputError : ''}`}
                  value={ajusteMotivo}
                  onChange={e => { setAjusteMotivo(e.target.value); setAjusteErrors(prev => ({ ...prev, ajusteMotivo: '' })); }}
                >
                  <option value="">Selecciona un motivo</option>
                  {MOTIVOS_AJUSTE.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {ajusteErrors.ajusteMotivo && <p className={formStyles.error}>{ajusteErrors.ajusteMotivo}</p>}
              </div>

              <div className={formStyles.actions}>
                <Button type="submit" disabled={submittingAjuste}>
                  {submittingAjuste ? 'Ajustando...' : 'Aplicar ajuste'}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </Dialog>
  );
}