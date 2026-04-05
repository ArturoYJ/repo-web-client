'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import VentaForm from './Ventaform';
import type { VentaDetallada, Sucursal } from '@/types/ventas-view.types';
import styles from './page.module.css';


export default function VentasPage() {
  const [ventas, setVentas] = useState<VentaDetallada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [filterSucursal, setFilterSucursal] = useState('');
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [showVentaModal, setShowVentaModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`/api/v1/inventario/sucursales`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setSucursales(d.data || []))
      .catch(() => setSucursales([]));
  }, []);

  const fetchVentas = useCallback(async (sucursal = '', inicio = '', fin = '') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (sucursal) params.set('sucursal_id', sucursal);
      if (inicio) params.set('fecha_inicio', inicio);
      if (fin) params.set('fecha_fin', fin);

      const url = `/api/v1/ventas/historial${params.toString() ? '?' + params.toString() : ''}`;
      const r = await fetch(url, { credentials: 'include' });
      if (!r.ok) throw new Error('Error al cargar historial');
      const d = await r.json();
      setVentas(d.data || []);
      setPage(1);
    } catch {
      setError('No se pudo cargar el historial de ventas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVentas(); }, [fetchVentas]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVentas(filterSucursal, filterFechaInicio, filterFechaFin);
  };

  const handleClearFilters = () => {
    setFilterSucursal('');
    setFilterFechaInicio('');
    setFilterFechaFin('');
    fetchVentas('', '', '');
  };

  const handleRevertVenta = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas revertir esta venta? El stock volverá al inventario y el registro se eliminará permanentemente.')) {
      return;
    }

    try {
      const r = await fetch(`/api/v1/ventas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await r.json();

      if (!r.ok) throw new Error(data.error || 'Error al revertir la venta');

      showToast('Venta revertida exitosamente. Stock actualizado.', 'success');
      fetchVentas(filterSucursal, filterFechaInicio, filterFechaFin);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al revertir la venta', 'error');
    }
  };

  const exportCSV = () => {
    const headers = ['Fecha', 'Producto', 'Código', 'Sucursal', 'Cantidad', 'Precio unit.', 'Total', 'Utilidad Unitaria', 'Motivo', 'Usuario'];
    const rows = ventas.map(v => [
      new Date(v.fecha_hora).toLocaleString('es-MX'),
      v.nombre_producto + (v.modelo ? ` (${v.modelo})` : '') + (v.color ? ` ${v.color}` : ''),
      v.sku_variante,
      v.nombre_sucursal,
      v.cantidad,
      v.precio_venta_final,
      (Number(v.precio_venta_final) * v.cantidad).toFixed(2),
      v.utilidad,
      v.motivo,
      v.nombre_usuario,
    ]);
    const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalVentas = ventas.length;
  const totalIngresos = ventas.reduce((acc, v) => acc + Number(v.precio_venta_final) * v.cantidad, 0);
  const totalUtilidad = ventas.reduce((acc, v) => acc + Number(v.utilidad), 0);

  const totalPages = Math.ceil(ventas.length / ITEMS_PER_PAGE);
  const paginated = ventas.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.msg}
        </div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Ventas</h1>
          <p className={styles.subtitle}>{loading ? 'Cargando...' : `${totalVentas} transacciones registradas`}</p>
        </div>
        <Button onClick={() => setShowVentaModal(true)}>+ Registrar venta</Button>
      </div>

      <form onSubmit={handleApplyFilters} className={styles.filterBar}>
        <select
          aria-label="Filtrar por sucursal"
          className={styles.filterSelect}
          value={filterSucursal}
          onChange={e => setFilterSucursal(e.target.value)}
        >
          <option value="">Todas las sucursales</option>
          {sucursales.map(s => (
            <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre_lugar}</option>
          ))}
        </select>

        <div className={styles.filterDateGroup}>
          <input
            aria-label="Fecha inicio"
            className={styles.filterInput}
            type="date"
            value={filterFechaInicio}
            onChange={e => setFilterFechaInicio(e.target.value)}
          />
          <span className={styles.filterDateSep}>—</span>
          <input
            aria-label="Fecha fin"
            className={styles.filterInput}
            type="date"
            value={filterFechaFin}
            onChange={e => setFilterFechaFin(e.target.value)}
          />
        </div>

        <div className={styles.filterActions}>
          <Button type="submit" variant="primary">Filtrar</Button>
          <Button type="button" variant="secondary" onClick={handleClearFilters}>Limpiar</Button>
          {ventas.length > 0 && (
            <Button type="button" variant="secondary" onClick={exportCSV}>Exportar CSV</Button>
          )}
        </div>
      </form>

      {!loading && ventas.length > 0 && (
        <div className={styles.summaryRow}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Total transacciones</p>
            <p className={styles.summaryValue}>{totalVentas.toLocaleString()}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Ingresos totales</p>
            <p className={styles.summaryValue}>${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Utilidad neta</p>
            <p className={`${styles.summaryValue} ${totalUtilidad >= 0 ? styles.summaryPositive : styles.summaryNegative}`}>
              ${totalUtilidad.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : error ? (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <Button onClick={() => fetchVentas(filterSucursal, filterFechaInicio, filterFechaFin)} variant="secondary">Reintentar</Button>
        </div>
      ) : ventas.length === 0 ? (
        <div className={styles.emptyPage}>Sin ventas registradas para los filtros seleccionados</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Fecha</th>
                  <th className={styles.th}>Producto</th>
                  <th className={styles.th}>Sucursal</th>
                  <th className={styles.th}>Cant.</th>
                  <th className={styles.th}>Precio unit.</th>
                  <th className={styles.th}>Total</th>
                  <th className={styles.th}>Utilidad Unitaria</th>
                  <th className={styles.th}>Motivo</th>
                  <th className={styles.th}>Usuario</th>
                  <th className={`${styles.th} ${styles.actionsTh}`}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(v => (
                  <tr key={v.id_transaccion} className={styles.tr}>
                    <td className={styles.td}>
                      <span className={styles.dateCell}>
                        {new Date(v.fecha_hora).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className={styles.timeCell}>
                        {new Date(v.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.productName}>{v.nombre_producto}</span>
                      <span className={styles.productMeta}>
                        {v.sku_variante}{v.modelo ? ` · ${v.modelo}` : ''}{v.color ? ` · ${v.color}` : ''}
                      </span>
                    </td>
                    <td className={styles.td}>{v.nombre_sucursal}</td>
                    <td className={styles.td}><span className={styles.badge}>{v.cantidad}</span></td>
                    <td className={styles.td}>${Number(v.precio_venta_final).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className={styles.td}>${(Number(v.precio_venta_final) * v.cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className={`${styles.td} ${Number(v.utilidad) >= 0 ? styles.utilidadPos : styles.utilidadNeg}`}>
                      ${Number(v.utilidad).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.motivoBadge}>{v.motivo}</span>
                    </td>
                    <td className={styles.td}>{v.nombre_usuario}</td>
                    <td className={`${styles.td} ${styles.actionsTd}`}>
                      <button 
                        className={styles.revertBtn}
                        onClick={() => handleRevertVenta(v.id_transaccion)}
                        title="Revertir venta"
                      >
                        <span role="img" aria-label="revertir">🔄</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          )}
        </>
      )}

      <VentaForm
        open={showVentaModal}
        onClose={() => setShowVentaModal(false)}
        onSuccess={fetchVentas}
        showToast={showToast}
      />
    </div>
  );
}