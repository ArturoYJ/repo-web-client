import Button from '@/components/ui/Button';
import styles from './form.module.css';
import type { ProductoFormData as FormData, ProductoFormErrors as FormErrors, SucursalForm as Sucursal } from '@/types/inventario-view.types';
export type { FormData, FormErrors };
export type { Sucursal };

export function validateField(
  name: keyof FormData,
  value: string,
  precioAdquisicion?: string,
  isCreationMode?: boolean
): string | undefined {
  if (name === 'nombre' && !value.trim()) return 'El nombre es obligatorio';

  if (isCreationMode) return undefined;

  if (name === 'precio_adquisicion') {
    if (!value) return 'El precio de adquisición es obligatorio';
    if (isNaN(Number(value)) || Number(value) < 0) return 'Debe ser un número positivo';
  }
  if (name === 'precio_venta_etiqueta') {
    if (!value) return 'El precio de venta es obligatorio';
    if (isNaN(Number(value)) || Number(value) < 0) return 'Debe ser un número positivo';
    if (precioAdquisicion && Number(value) < Number(precioAdquisicion))
      return 'Debe ser mayor al precio de adquisición';
  }
  if (name === 'sucursal_id' && !value) return 'Selecciona una sucursal';
  return undefined;
}

export function buildFormErrors(formData: FormData, includeSucursal = false, isCreationMode = false): FormErrors {
  const errors: FormErrors = {};
  const e1 = validateField('nombre', formData.nombre, undefined, isCreationMode);
  if (e1) errors.nombre = e1;

  if (!isCreationMode) {
    const e2 = validateField('precio_adquisicion', formData.precio_adquisicion, undefined, isCreationMode);
    const e3 = validateField('precio_venta_etiqueta', formData.precio_venta_etiqueta, formData.precio_adquisicion, isCreationMode);

    if (e2) errors.precio_adquisicion = e2;
    if (e3) errors.precio_venta_etiqueta = e3;
    if (includeSucursal) {
      const e4 = validateField('sucursal_id', formData.sucursal_id, undefined, isCreationMode);
      if (e4) errors.sucursal_id = e4;
    }
  }
  return errors;
}

interface NuevoProductoFormProps {
  formData: FormData;
  formErrors: FormErrors;
  sucursales?: Sucursal[];
  loadingSucursales?: boolean;
  submitting: boolean;
  submitLabel?: string;
  showSucursal?: boolean;
  isCreationMode?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function NuevoProductoForm({
  formData,
  formErrors,
  sucursales = [],
  loadingSucursales = false,
  submitting,
  submitLabel = 'Agregar producto',
  showSucursal = true,
  isCreationMode = false,
  onChange,
  onSubmit,
  onCancel,
}: NuevoProductoFormProps) {
  return (
    <form onSubmit={onSubmit} className={styles.form}>

      <div className={styles.field}>
        <input
          className={`${styles.input} ${formErrors.nombre ? styles.inputError : ''}`}
          type="text"
          name="nombre"
          placeholder="Nombre del producto"
          value={formData.nombre}
          onChange={onChange}
        />
        {formErrors.nombre && <p className={styles.error}>{formErrors.nombre}</p>}
      </div>

      <div className={styles.field}>
        <input
          className={styles.input}
          type="text"
          name="sku"
          placeholder="Identificador (opcional)"
          value={formData.sku}
          onChange={onChange}
        />
      </div>

      <div className={styles.field}>
        <input
          className={styles.input}
          type="text"
          name="proveedor"
          placeholder="Proveedor (opcional)"
          value={formData.proveedor}
          onChange={onChange}
        />
      </div>

      {!isCreationMode && (
        <>
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
              <input
                className={styles.input}
                type="text"
                name="color"
                placeholder="Color"
                value={formData.color}
                onChange={onChange}
              />
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
                placeholder="Valor original"
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
                placeholder="Valor venta"
                min="0"
                step="0.01"
                value={formData.precio_venta_etiqueta}
                onChange={onChange}
              />
              {formErrors.precio_venta_etiqueta && <p className={styles.error}>{formErrors.precio_venta_etiqueta}</p>}
            </div>
          </div>

          {showSucursal ? (
            <div className={styles.row}>
              <div className={styles.field}>
                <select
                  className={`${styles.input} ${styles.select} ${formErrors.sucursal_id ? styles.inputError : ''}`}
                  name="sucursal_id"
                  value={formData.sucursal_id}
                  onChange={onChange}
                  disabled={loadingSucursales}
                  aria-label="Sucursal"
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
          ) : (
            <div className={styles.field}>
              <input
                className={styles.input}
                type="number"
                name="stock_inicial"
                placeholder="Stock actual"
                min="0"
                step="1"
                value={formData.stock_inicial}
                onChange={onChange}
              />
            </div>
          )}
        </>
      )}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : submitLabel}
        </Button>
      </div>

    </form>
  );
}