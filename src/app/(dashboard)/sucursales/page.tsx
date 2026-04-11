'use client';

import { useState, useEffect, useCallback } from 'react';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import SucursalCard from './SucursalCard';
import SucursalDetail from './SucursalDetail';
import EditVarianteModal from '../inventario/EditVarianteModal';
import InfoVarianteModal from '../inventario/InfoVarianteModal';
import AjusteStockModal from '../inventario/AjusteStockModal';
import CreateSucursalModal from './CreateSucursal';
import EditSucursalModal from './EditSucursalModal';
import VentaForm from '../ventas/Ventaform';
import type { Sucursal, SucursalConInventario, VarianteProducto, Producto } from '@/types/sucursales-view.types';
import type { InventarioItem } from '@/types/inventario.types';
import styles from './page.module.css';

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<SucursalConInventario[]>([]);
  const [filtered, setFiltered] = useState<SucursalConInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [varianteToProductoMap, setVarianteToProductoMap] = useState<Map<number, number>>(new Map());

  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSucursalTarget, setDeleteSucursalTarget] = useState<{ id: number; nombre: string } | null>(null);
  const [deletingSucursal, setDeletingSucursal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showEditSucursalModal, setShowEditSucursalModal] = useState(false);
  const [editSucursalTarget, setEditSucursalTarget] = useState<{ id: number; nombre: string; ubicacion: string } | null>(null);

  const [showVentaModal, setShowVentaModal] = useState(false);
  const [ventaPreselectedVariante, setVentaPreselectedVariante] = useState<number | undefined>(undefined);
  const [ventaPreselectedSucursal, setVentaPreselectedSucursal] = useState<number | undefined>(undefined);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [showEditVarianteModal, setShowEditVarianteModal] = useState(false);
  const [editVarianteId, setEditVarianteId] = useState<number | null>(null);

  const [showInfoVarianteModal, setShowInfoVarianteModal] = useState(false);
  const [infoVarianteId, setInfoVarianteId] = useState<number | null>(null);
  const [infoInventarioId, setInfoInventarioId] = useState<number | null>(null);

  const [showAjusteStockModal, setShowAjusteStockModal] = useState(false);
  const [ajusteVarianteId, setAjusteVarianteId] = useState<number | null>(null);
  const [ajusteSucursalId, setAjusteSucursalId] = useState<number | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchInventarioSucursal = useCallback(async (id_sucursal: number): Promise<InventarioItem[]> => {
    try {
      const res = await fetch(`/api/v1/inventario?sucursal_id=${id_sucursal}`, { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data || [];
    } catch {
      return [];
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resSucursales, resProductos] = await Promise.all([
        fetch(`/api/v1/inventario/sucursales`, { credentials: 'include' }),
        fetch(`/api/v1/productos?page=1&limit=100`, { credentials: 'include' }),
      ]);

      if (!resSucursales.ok) throw new Error();

      const dataSucursales = await resSucursales.json();
      const lista: Sucursal[] = dataSucursales.data || [];

      if (resProductos.ok) {
        const dataProductos = await resProductos.json();
        const map = new Map<number, number>();
        (dataProductos.productos || []).forEach((p: Producto) => {
          p.variantes.forEach((v: VarianteProducto) => {
            map.set(v.id_variante, p.id_producto_maestro);
          });
        });
        setVarianteToProductoMap(map);
      }

      const initial: SucursalConInventario[] = lista.map((s) => ({
        ...s, inventario: [], loadingInventario: true,
      }));
      setSucursales(initial);
      setFiltered(initial);
      setLoading(false);

      const withInv = await Promise.all(
        lista.map(async (s) => ({
          ...s,
          inventario: await fetchInventarioSucursal(s.id_sucursal),
          loadingInventario: false,
        }))
      );
      setSucursales(withInv);
      setFiltered(withInv);
    } catch {
      setError('No se pudieron cargar las sucursales.');
      setLoading(false);
    }
  }, [fetchInventarioSucursal]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSearch = useCallback((term: string) => {
    if (!term.trim()) { setFiltered(sucursales); return; }
    const lower = term.toLowerCase();
    setFiltered(sucursales.filter((s) =>
      s.nombre_lugar.toLowerCase().includes(lower) ||
      (s.ubicacion || '').toLowerCase().includes(lower)
    ));
  }, [sucursales]);

  const handleDeleteProducto = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/productos/${deleteTarget}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error al eliminar');
      }
      showToast('Producto eliminado correctamente', 'success');
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSucursal = async () => {
    if (!deleteSucursalTarget) return;
    setDeletingSucursal(true);
    try {
      const res = await fetch(`/api/v1/sucursales/${deleteSucursalTarget.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error al eliminar la sucursal');
      }
      showToast('Sucursal eliminada correctamente', 'success');
      setDeleteSucursalTarget(null);
      fetchAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar sucursal', 'error');
      setDeleteSucursalTarget(null);
    } finally {
      setDeletingSucursal(false);
    }
  };

  const handleOpenEditVariante = (idV: number, idI: number) => { setEditVarianteId(idV); setShowEditVarianteModal(true); };
  const handleOpenInfoVariante = (idV: number, idI: number) => { setInfoVarianteId(idV); setInfoInventarioId(idI); setShowInfoVarianteModal(true); };
  const handleOpenAjusteStock = (idV: number, idS: number) => { setAjusteVarianteId(idV); setAjusteSucursalId(idS); setShowAjusteStockModal(true); };
  const handleOpenVenta = (idV: number, idS: number) => {
    setVentaPreselectedVariante(idV);
    setVentaPreselectedSucursal(idS);
    setShowVentaModal(true);
  };

  const handleOpenEditSucursal = (s: Sucursal) => {
    setEditSucursalTarget({ id: s.id_sucursal, nombre: s.nombre_lugar, ubicacion: s.ubicacion || '' });
    setShowEditSucursalModal(true);
  };

  const selectedSucursal = sucursales.find(s => s.id_sucursal === selectedSucursalId);

  return (
    <div>
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.msg}
        </div>
      )}

      {selectedSucursalId === null && (
        <SearchInput placeholder="Buscar sucursales..." onSearch={handleSearch} />
      )}

      {selectedSucursalId === null && (
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Sucursales</h1>
            <p className={styles.subtitle}>
              {loading ? 'Cargando...' : `${filtered.length} sucursales registradas`}
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>+ Nueva sucursal</Button>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingPage}>
          <div className={styles.spinner} />
          <p>Cargando sucursales...</p>
        </div>
      ) : error ? (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <Button onClick={fetchAll} variant="secondary">Reintentar</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyPage}>Sin sucursales registradas</div>
      ) : selectedSucursalId !== null ? (
        selectedSucursal ? (
          <SucursalDetail
            nombre={selectedSucursal.nombre_lugar}
            ubicacion={selectedSucursal.ubicacion}
            inventario={selectedSucursal.inventario}
            loading={selectedSucursal.loadingInventario}
            onBack={() => setSelectedSucursalId(null)}
            onDelete={(idVariante) => {
              const idProducto = varianteToProductoMap.get(idVariante);
              if (idProducto) setDeleteTarget(idProducto);
            }}
            onEdit={handleOpenEditVariante}
            onInfo={handleOpenInfoVariante}
            onAjustar={handleOpenAjusteStock}
            onVenta={handleOpenVenta}
          />
        ) : null
      ) : (
        <div className={styles.grid}>
          {filtered.map((s) => (
            <div key={s.id_sucursal} className={styles.cardWrapper}>
              <SucursalCard
                id_sucursal={s.id_sucursal}
                nombre={s.nombre_lugar}
                ubicacion={s.ubicacion}
                inventario={s.inventario}
                loading={s.loadingInventario}
                onViewDetails={setSelectedSucursalId}
              />
              <div className={styles.cardActions}>
                <button
                  onClick={() => handleOpenEditSucursal(s)}
                  title="Editar sucursal"
                  className={styles.editBtn}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteSucursalTarget({ id: s.id_sucursal, nombre: s.nombre_lugar })}
                  title="Eliminar sucursal"
                  className={styles.deleteBtn}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteSucursalTarget !== null && (
        <div className={styles.modalOverlay} onClick={() => !deletingSucursal && setDeleteSucursalTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Eliminar sucursal</h2>
            <p className={styles.modalText}>
              ¿Estás seguro que deseas eliminar <strong>{deleteSucursalTarget.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setDeleteSucursalTarget(null)} disabled={deletingSucursal}>Cancelar</Button>
              <Button variant="danger" onClick={handleDeleteSucursal} disabled={deletingSucursal}>
                {deletingSucursal ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget !== null && (
        <div className={styles.modalOverlay} onClick={() => !deleting && setDeleteTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Eliminar producto</h2>
            <p className={styles.modalText}>¿Estás seguro que deseas eliminar este producto? Esta acción no se puede deshacer.</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
              <Button variant="danger" onClick={handleDeleteProducto} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateSucursalModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchAll}
        showToast={showToast}
      />

      <EditSucursalModal
        open={showEditSucursalModal}
        sucursalId={editSucursalTarget?.id ?? null}
        initialNombre={editSucursalTarget?.nombre ?? ''}
        initialUbicacion={editSucursalTarget?.ubicacion ?? ''}
        onClose={() => { setShowEditSucursalModal(false); setEditSucursalTarget(null); }}
        onSuccess={fetchAll}
        showToast={showToast}
      />

      <EditVarianteModal
        open={showEditVarianteModal}
        varianteId={editVarianteId}
        onClose={() => setShowEditVarianteModal(false)}
        onSuccess={fetchAll}
        showToast={showToast}
      />

      <InfoVarianteModal
        open={showInfoVarianteModal}
        varianteId={infoVarianteId}
        inventarioId={infoInventarioId}
        onClose={() => setShowInfoVarianteModal(false)}
      />

      <AjusteStockModal
        open={showAjusteStockModal}
        varianteId={ajusteVarianteId}
        sucursalId={ajusteSucursalId}
        onClose={() => setShowAjusteStockModal(false)}
        onSuccess={fetchAll}
        showToast={showToast}
      />

      <VentaForm
        open={showVentaModal}
        onClose={() => { setShowVentaModal(false); setVentaPreselectedVariante(undefined); setVentaPreselectedSucursal(undefined); }}
        onSuccess={fetchAll}
        showToast={showToast}
        preselectedSucursalId={ventaPreselectedSucursal}
        preselectedVarianteId={ventaPreselectedVariante}
      />
    </div>
  );
}