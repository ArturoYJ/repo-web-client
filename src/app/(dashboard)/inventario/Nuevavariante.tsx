import Button from '@/components/ui/Button';
import styles from './form.module.css';
import { FormEvent, ChangeEvent, useState, useRef, useEffect } from 'react';

const COLORES_PREDEFINIDOS = [
  'Amarillo', 'Azul', 'Azul marino', 'Beige', 'Blanco', 'Café', 'Champagne',
  'Coral', 'Crema', 'Dorado', 'Fucsia', 'Gris', 'Gris oscuro', 'Lavanda',
  'Lila', 'Magenta', 'Menta', 'Morado', 'Naranja', 'Negro', 'Nude', 'Plateado',
  'Rojo', 'Rosa', 'Rosa pastel', 'Salmón', 'Terracota', 'Turquesa', 'Verde',
  'Verde olivo', 'Vino',
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
          className={styles.input}
          type="text"
          placeholder="Color"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        <button
          type="button"
          className={styles.input}
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
              className={styles.input}
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

export interface VarianteFormData {
  modelo: string;
  color: string;
  codigo_barras: string;
  precio_adquisicion: string;
  precio_venta_etiqueta: string;
  sucursal_id: string;
  stock_inicial: string;
}

export interface VarianteFormErrors {
  [key: string]: string;
}

export function validateVarianteField(name: keyof VarianteFormData, value: string, precioAdquisicion?: string): string | undefined {
  if (name === 'precio_adquisicion') {
    if (!value) return 'El costo es obligatorio';
    if (isNaN(Number(value)) || Number(value) < 0) return 'Debe ser positivo';
  }
  if (name === 'precio_venta_etiqueta') {
    if (!value) return 'El precio es obligatorio';
    if (isNaN(Number(value)) || Number(value) < 0) return 'Debe ser positivo';
    if (precioAdquisicion && Number(value) < Number(precioAdquisicion)) return 'Debe ser mayor al costo';
  }
  if (name === 'sucursal_id' && !value) return 'Selecciona una sucursal';
  return undefined;
}

export function buildVarianteFormErrors(formData: VarianteFormData): VarianteFormErrors {
  const errors: VarianteFormErrors = {};
  const e1 = validateVarianteField('precio_adquisicion', formData.precio_adquisicion);
  const e2 = validateVarianteField('precio_venta_etiqueta', formData.precio_venta_etiqueta, formData.precio_adquisicion);
  const e3 = validateVarianteField('sucursal_id', formData.sucursal_id);
  if (e1) errors.precio_adquisicion = e1;
  if (e2) errors.precio_venta_etiqueta = e2;
  if (e3) errors.sucursal_id = e3;
  return errors;
}

interface NuevaVarianteFormProps {
  formData: VarianteFormData;
  formErrors: VarianteFormErrors;
  sucursales: { id_sucursal: number; nombre_lugar: string }[];
  loadingSucursales: boolean;
  submitting: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

export default function NuevaVarianteForm({
  formData,
  formErrors,
  sucursales,
  loadingSucursales,
  submitting,
  onChange,
  onSubmit,
  onCancel,
}: NuevaVarianteFormProps) {
  const handleColorChange = (value: string) => {
    onChange({ target: { name: 'color', value } } as ChangeEvent<HTMLInputElement>);
  };

  return (
    <form onSubmit={onSubmit} className={styles.form}>

      <div className={styles.row}>
        <div className={styles.field}>
          <input
            className={styles.input}
            type="text"
            name="modelo"
            placeholder="Modelo"
            value={formData.modelo}
            onChange={onChange}
          />
        </div>
        <div className={styles.field}>
          <ColorPicker value={formData.color} onChange={handleColorChange} />
        </div>
      </div>

      <div className={styles.field}>
        <input
          className={styles.input}
          type="text"
          name="codigo_barras"
          placeholder="Código de barras (opcional)"
          value={formData.codigo_barras}
          onChange={onChange}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <input
            className={`${styles.input} ${formErrors.precio_adquisicion ? styles.inputError : ''}`}
            type="number"
            name="precio_adquisicion"
            placeholder="Valor original (Costo) *"
            min="0"
            step="0.01"
            value={formData.precio_adquisicion}
            onChange={onChange}
          />
          {formErrors.precio_adquisicion && <p className={styles.error}>{formErrors.precio_adquisicion}</p>}
        </div>
        <div className={styles.field}>
          <input
            className={`${styles.input} ${formErrors.precio_venta_etiqueta ? styles.inputError : ''}`}
            type="number"
            name="precio_venta_etiqueta"
            placeholder="Valor venta *"
            min="0"
            step="0.01"
            value={formData.precio_venta_etiqueta}
            onChange={onChange}
          />
          {formErrors.precio_venta_etiqueta && <p className={styles.error}>{formErrors.precio_venta_etiqueta}</p>}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <select
            className={`${styles.input} ${styles.select} ${formErrors.sucursal_id ? styles.inputError : ''}`}
            name="sucursal_id"
            value={formData.sucursal_id}
            onChange={onChange}
            disabled={loadingSucursales}
            title="Sucursal"
          >
            <option value="">{loadingSucursales ? 'Cargando...' : 'Sucursal *'}</option>
            {sucursales.map(s => (
              <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre_lugar}</option>
            ))}
          </select>
          {formErrors.sucursal_id && <p className={styles.error}>{formErrors.sucursal_id}</p>}
        </div>
        <div className={styles.field}>
          <input
            className={styles.input}
            type="number"
            name="stock_inicial"
            placeholder="Stock inicial"
            min="0"
            step="1"
            value={formData.stock_inicial}
            onChange={onChange}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Añadiendo...' : 'Añadir variante'}
        </Button>
      </div>

    </form>
  );
}