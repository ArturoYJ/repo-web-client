import React from 'react';
import { RankingProducto } from '@/types/dashboard.types';
import styles from './kpiCards.module.css';

interface BestSellersCardProps {
  productos: RankingProducto[];
}

export default function BestSellersCard({ productos }: BestSellersCardProps) {
  if (!productos || productos.length === 0) return null;

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Top 10 Más Vendidos</h3>
      <p className={styles.cardSubtitle}>Productos con mayor movimiento global</p>
      
      <div className={styles.listContainer}>
        {productos.map((prod, idx) => (
          <div key={`${prod.id_variante}-${idx}`} className={styles.listItem}>
            <span className={styles.rankNumber}>{idx + 1}</span>
            <div className={styles.itemDetails}>
              <div className={styles.itemName}>{prod.nombre_producto}</div>
              <div className={styles.itemMeta}>Identificador: {prod.sku_variante}</div>
            </div>
            <div className={styles.itemStats}>
              <div className={styles.statPrimary}>{prod.total_unidades_vendidas} unidades</div>
              <div className={styles.statSecondary}>${prod.ingresos_totales.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}