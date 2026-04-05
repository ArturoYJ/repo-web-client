'use client';

import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { useProductoInfo } from '@/hooks/useProductoInfo';
import styles from './Infoproducto.module.css';
import formStyles from './form.module.css';

interface InfoProductoModalProps {
  open: boolean;
  productoId: number | null;
  onClose: () => void;
}

export default function InfoProductoModal({ open, productoId, onClose }: InfoProductoModalProps) {
  const { producto, inventarioInfo, loading } = useProductoInfo(open, productoId);

  const totalValorOriginal = producto?.variantes.reduce((acc, v) => acc + Number(v.precio_adquisicion), 0) || 0;
  const totalValorVenta = producto?.variantes.reduce((acc, v) => acc + Number(v.precio_venta_etiqueta), 0) || 0;
  const totalEnExistencia = inventarioInfo.reduce((acc, info) => acc + info.stock_actual, 0);

  return (
    <Dialog open={open} onClose={onClose} title="Información del producto">
      {loading ? (
        <p className={formStyles.loadingText}>Cargando...</p>
      ) : !producto ? (
        <p className={formStyles.loadingText}>No se encontró el producto</p>
      ) : (
        <div className={styles.section}>

          <div className={styles.row}>
            <div className={styles.field}>
              <p className={styles.label}>Nombre</p>
              <p className={styles.value}>{producto.nombre}</p>
            </div>
            <div className={styles.field}>
              <p className={styles.label}>Identificador</p>
              <p className={styles.value}>{producto.sku || '—'}</p>
            </div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.row}>
            <div className={styles.field}>
              <p className={styles.label}>Valor original acumulado</p>
              <p className={styles.value}>${totalValorOriginal.toLocaleString()}</p>
            </div>
            <div className={styles.field}>
              <p className={styles.label}>Valor venta acumulado</p>
              <p className={styles.value}>${totalValorVenta.toLocaleString()}</p>
            </div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.row}>
            <div className={styles.field}>
              <p className={styles.label}>Total en existencia</p>
              <p className={styles.value} style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                {totalEnExistencia} piezas
              </p>
            </div>
            <div className={styles.field}>
              <p className={styles.label}>Variantes registradas</p>
              <p className={styles.value} style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                {producto.variantes.length}
              </p>
            </div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.field}>
            <p className={styles.label}>Sucursal / stock</p>
            {inventarioInfo.length === 0 ? (
              <p className={styles.value}>Sin inventario registrado</p>
            ) : (
              <div className={styles.stockList}>
                {inventarioInfo.map((info, i) => (
                  <div key={i} className={styles.stockRow}>
                    <p className={styles.value}>{info.sucursal}</p>
                    <span className={styles.badge}>{info.stock_actual} piezas</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          </div>

        </div>
      )}
    </Dialog>
  );
}