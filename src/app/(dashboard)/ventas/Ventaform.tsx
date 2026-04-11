'use client';

import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { useVentaForm } from '@/hooks/useVentaForm';
import type { VentaFormProps } from '@/types/ventas-view.types';
import styles from './Ventaform.module.css';

export default function VentaForm({ open, onClose, onSuccess, showToast, preselectedSucursalId, preselectedVarianteId, initialSearchTerm }: VentaFormProps) {
  const {
    formData, formErrors, submitting,
    motivos,
    filteredInventario, loadingInventario,
    searchProducto, selectedProduct, total,
    setSearchProducto, handleChange, handleSelectProduct,
    handleSubmit, handleClose,
  } = useVentaForm(open, onClose, onSuccess, showToast, {
    preselectedSucursalId,
    preselectedVarianteId,
    initialSearchTerm,
  });

  return (
    <Dialog open={open} onClose={handleClose} title="Registrar venta">
      <form onSubmit={handleSubmit} className={styles.form}>

        <div className={styles.field}>
          <input
            className={styles.input}
            type="text"
            placeholder="Buscar producto por nombre, SKU o modelo..."
            value={searchProducto}
            onChange={e => setSearchProducto(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <div className={styles.productList}>
            {loadingInventario ? (
              <p className={styles.productEmpty}>Cargando inventario...</p>
            ) : filteredInventario.length === 0 ? (
              <p className={styles.productEmpty}>
                {searchProducto.trim() ? 'Sin resultados para esa búsqueda' : 'Sin productos con stock disponible'}
              </p>
            ) : (
              filteredInventario.map(item => {
                const isSelected = selectedProduct?.id_variante === item.id_variante && selectedProduct?.id_sucursal === item.id_sucursal;
                const stockBajo = item.stock_actual <= 3;
                return (
                  <div
                    key={`${item.id_variante}-${item.id_sucursal}`}
                    className={`${styles.productItem} ${isSelected ? styles.productItemSelected : ''}`}
                    onClick={() => handleSelectProduct(item)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className={`${styles.productName} ${isSelected ? styles.productNameSelected : ''}`}>
                        {item.nombre_producto}
                      </p>
                      <p className={styles.productMeta}>
                        {item.sku_producto}
                        {item.modelo ? ` · ${item.modelo}` : ''}
                        {item.color ? ` · ${item.color}` : ''}
                      </p>
                      <p className={styles.productSucursal}>{item.nombre_sucursal}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p className={stockBajo ? styles.productStockLow : styles.productStockOk}>
                        Stock: {item.stock_actual}
                      </p>
                      <p className={styles.productPrice}>
                        ${Number(item.precio_venta).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {formErrors.id_variante && <p className={styles.error}>{formErrors.id_variante}</p>}
        </div>

        {selectedProduct && (
          <div className={styles.selectedInfo}>
            <span className={styles.selectedLabel}>Vendiendo desde:</span>
            <span className={styles.selectedValue}>{selectedProduct.nombre_sucursal}</span>
          </div>
        )}

        {selectedProduct && (
          <div className={styles.row}>
            <div className={styles.field}>
              <input
                className={`${styles.input} ${formErrors.cantidad ? styles.inputError : ''}`}
                type="number"
                name="cantidad"
                placeholder="Cantidad *"
                min="1"
                max={selectedProduct.stock_actual}
                step="1"
                value={formData.cantidad}
                onChange={handleChange}
              />
              {formErrors.cantidad && <p className={styles.error}>{formErrors.cantidad}</p>}
            </div>
            <div className={styles.field}>
              <input
                className={`${styles.input} ${formErrors.precio_venta_final ? styles.inputError : ''}`}
                type="number"
                name="precio_venta_final"
                placeholder="Precio venta *"
                min="0"
                step="0.01"
                value={formData.precio_venta_final}
                onChange={handleChange}
              />
              {formErrors.precio_venta_final && <p className={styles.error}>{formErrors.precio_venta_final}</p>}
            </div>
          </div>
        )}

        {selectedProduct && (
          <div className={styles.field}>
            <select
              aria-label="Motivo de venta"
              className={`${styles.input} ${styles.select}`}
              name="id_motivo"
              value={formData.id_motivo}
              onChange={handleChange}
              disabled={motivos.length === 0}
            >
              <option value="" disabled>
                {motivos.length === 0 ? 'Sin motivos disponibles' : 'Motivo de venta *'}
              </option>
              {motivos.map(m => (
                <option key={m.id_motivo} value={m.id_motivo}>{m.descripcion}</option>
              ))}
            </select>
          </div>
        )}

        {total !== null && (
          <div className={styles.totalBox}>
            <p className={styles.totalLabel}>Total de la venta</p>
            <p className={styles.totalValue}>
              ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting || !selectedProduct}>
            {submitting ? 'Registrando...' : 'Confirmar venta'}
          </Button>
        </div>

      </form>
    </Dialog>
  );
}