import React from 'react';
import { RankingProducto } from '@/types/dashboard.types';
import styles from './kpiCards.module.css';

interface SlowMoversCardProps {
  productos: RankingProducto[];
}

export default function SlowMoversCard({ productos }: SlowMoversCardProps) {
  if (!productos || productos.length === 0) return null;

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Rotación Lenta</h3>
      <p className={styles.cardSubtitle}>Productos con menos unidades vendidas globalmente</p>
      
      <div className={styles.listContainer}>
        {productos.map((prod, idx) => (
          <div key={`${prod.id_variante}-${idx}`} className={styles.listItem}>
            <span className={styles.rankNumber}>{idx + 1}</span>
            <div className={styles.itemDetails}>
              <div className={styles.itemName}>{prod.nombre_producto}</div>
              <div className={styles.itemMeta}>Identificador: {prod.sku_variante}</div>
            </div>
            <div className={styles.itemStats}>
              <div className={`${styles.statPrimary} ${prod.total_unidades_vendidas === 0 ? styles.textDanger : ''}`}>
                {prod.total_unidades_vendidas} unidades
              </div>
              <div className={styles.statSecondary}>${prod.ingresos_totales.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}