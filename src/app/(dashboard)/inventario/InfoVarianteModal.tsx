import Dialog from '@/components/ui/Dialog';
import styles from './Infoproducto.module.css';
import formStyles from './form.module.css';
import { VarianteInfo } from '@/types/variantes.types';
import { useState, useEffect } from 'react';

interface InfoVarianteModalProps {
  open: boolean;
  varianteId: number | null;
  inventarioId: number | null;
  onClose: () => void;
}

export default function InfoVarianteModal({ open, varianteId, inventarioId, onClose }: InfoVarianteModalProps) {
  const [data, setData] = useState<VarianteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (!open || !varianteId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/variantes/${varianteId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Error al cargar variante');
        const vData = await res.json();
        const v = vData.data || vData;
        
        let pName = 'Producto Maestro';
        if (v.id_producto_maestro) {
           const pRes = await fetch(`/api/v1/productos/${v.id_producto_maestro}`, { credentials: 'include' });
           if (pRes.ok) {
             const pJson = await pRes.json();
             pName = pJson.nombre || pName;
           }
        }

        let invStock = 0;
        if (inventarioId) {
           const resInv = await fetch(`/api/v1/inventario/${inventarioId}`, { credentials: 'include' });
           if (resInv.ok) {
             const invJson = await resInv.json();
             invStock = (invJson.data?.stock_actual ?? invJson.stock_actual) || 0;
           }
        }

        if (active) {
            setData({
                nombre: pName,
                sku: v.sku_variante,
                codigo_barras: v.codigo_barras,
                modelo: v.modelo,
                color: v.color,
                precio_adquisicion: v.precio_adquisicion,
                precio_venta_etiqueta: v.precio_venta_etiqueta,
                stock: invStock
            });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [open, varianteId, inventarioId]);

  return (
    <Dialog open={open} onClose={onClose} title="Información de la Variante">
      {loading ? (
        <p className={formStyles.loadingText}>Cargando...</p>
      ) : !data ? (
        <p className={formStyles.error}>No se pudo cargar la información.</p>
      ) : (
        <div className={styles.section}>
          
          <div className={styles.field}>
            <p className={styles.label}>Producto Maestro (Vinculado)</p>
            <p className={styles.value}>{data.nombre}</p>
          </div>

          <hr className={styles.divider} />

          <div className={styles.row}>
            <div className={styles.field}>
              <p className={styles.label}>Identificador Variante</p>
              <p className={styles.value}>{data.sku}</p>
            </div>
            <div className={styles.field}>
              <p className={styles.label}>Código de barras</p>
              <p className={styles.value}>{data.codigo_barras || '—'}</p>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <p className={styles.label}>Modelo</p>
              <p className={styles.value}>{data.modelo || '—'}</p>
            </div>
            <div className={styles.field}>
              <p className={styles.label}>Color</p>
              <p className={styles.value}>{data.color || '—'}</p>
            </div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.row}>
            <div className={styles.field}>
              <p className={styles.label}>Valor original</p>
              <p className={styles.value}>${Number(data.precio_adquisicion).toLocaleString()}</p>
            </div>
            <div className={styles.field}>
              <p className={styles.label}>Valor venta</p>
              <p className={styles.value}>${Number(data.precio_venta_etiqueta).toLocaleString()}</p>
            </div>
          </div>
          
          <div className={styles.field}>
            <p className={styles.label}>Stock Actual (Ubicación)</p>
            <p className={styles.value}>{data.stock}</p>
          </div>
          
        </div>
      )}
    </Dialog>
  );
}
