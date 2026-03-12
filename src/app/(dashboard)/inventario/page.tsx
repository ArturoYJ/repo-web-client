'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Table, { Column } from '@/components/ui/Table';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import NuevoProductoForm, {
  FormData,
  FormErrors,
  validateField,
  buildFormErrors,
} from './Nuevoproducto';
import EditProductoModal from './Editproducto';
import InfoProductoModal from './Infoproducto';
import AddVarianteModal from './AddVarianteModal';
import SelectVarianteModal from './SelectVarianteModal';
import EditVarianteModal from './EditVarianteModal';
import type { Producto, ProductoFila } from '@/types/inventario-view.types';
import styles from './page.module.css';
import formStyles from './form.module.css';

export interface Sucursal { id_sucursal: number; nombre_lugar: string; ubicacion: string; }

type SortField = 'sku' | 'nombre' | 'totalStock' | 'valorOriginal' | 'valorVenta' | 'sucursal' | 'proveedor';
type SortOrder = 'asc' | 'desc';

const FORM_INITIAL: FormData = {
  nombre: "",
  sku: "",
  proveedor: "",
  modelo: "",
  color: "",
  codigo_barras: "",
  precio_adquisicion: "",
  precio_venta_etiqueta: "",
  sucursal_id: "",
  stock_inicial: "",
};

const ITEMS_PER_PAGE = 20;

export default function InventarioPage() {
  const [productos, setProductos] = useState<ProductoFila[]>([]);
  const [filtered, setFiltered] = useState<ProductoFila[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNombre, setDeleteNombre] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [infoId, setInfoId] = useState<number | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [stockMin, setStockMin] = useState('');
  const [stockMax, setStockMax] = useState('');

  const [showAddVarianteModal, setShowAddVarianteModal] = useState(false);
  const [addVarianteProductId, setAddVarianteProductId] = useState<number | null>(null);
  const [addVarianteProductoNombre, setAddVarianteProductoNombre] = useState('');

  const [showSelectVarianteModal, setShowSelectVarianteModal] = useState(false);
  const [selectVarianteProductId, setSelectVarianteProductId] = useState<number | null>(null);
  const [showEditVarianteModal, setShowEditVarianteModal] = useState(false);
  const [editVarianteId, setEditVarianteId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(FORM_INITIAL);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resProductos, resSucursales] = await Promise.all([
        fetch(`/api/v1/productos?page=1&limit=100`, { credentials: 'include' }),
        fetch(`/api/v1/inventario/sucursales`, { credentials: 'include' }),
      ]);
      if (!resProductos.ok) throw new Error('Error al cargar productos');
      const data = await resProductos.json();

      const sucursalesData = resSucursales.ok ? await resSucursales.json() : { data: [] };
      const listaSucursales: Sucursal[] = sucursalesData.data || [];
      setSucursales(listaSucursales);

      const inventarios = await Promise.all(
        listaSucursales.map(async (s) => {
          const r = await fetch(`/api/v1/inventario?sucursal_id=${s.id_sucursal}`, { credentials: 'include' });
          if (!r.ok) return [];
          const d = await r.json();
          return d.data || [];
        })
      );

      const flat = inventarios.flat();
      const stockMap = new Map<number, number>();
      flat.forEach((item: { id_variante: number; stock_actual: number }) => {
        stockMap.set(item.id_variante, (stockMap.get(item.id_variante) ?? 0) + item.stock_actual);
      });

      const filas: ProductoFila[] = (data.productos || []).map((p: Producto) => ({
        id: p.id_producto_maestro,
        sku: p.sku,
        nombre: p.nombre,
        proveedor: p.proveedor || '—',
        totalStock: p.variantes.reduce((acc, v) => acc + (stockMap.get(v.id_variante) ?? 0), 0),
        cantidadVariantes: p.variantes.length,
        valorOriginal: p.variantes.reduce((acc, v) => acc + Number(v.precio_adquisicion), 0),
        valorVenta: p.variantes.reduce((acc, v) => acc + Number(v.precio_venta_etiqueta), 0),
        sucursal: p.variantes[0]?.sucursal || '—',
      }));

      setProductos(filas);
      setFiltered(filas);
    } catch {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);

  const handleSearch = useCallback((term: string) => {
    setPage(1);
    if (!term.trim()) { setFiltered(productos); return; }
    const lower = term.toLowerCase();
    setFiltered(productos.filter((p) =>
      p.nombre.toLowerCase().includes(lower) || p.sku.toLowerCase().includes(lower)
    ));
  }, [productos]);

  const sortedProductos = useMemo(() => {
    let result = [...filtered];

    if (stockMin) result = result.filter(p => p.totalStock >= Number(stockMin));
    if (stockMax) result = result.filter(p => p.totalStock <= Number(stockMax));

    result.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'sku': valA = a.sku || ''; valB = b.sku || ''; break;
        case 'nombre': valA = a.nombre || ''; valB = b.nombre || ''; break;
        case 'totalStock': valA = a.totalStock; valB = b.totalStock; break;
        case 'valorOriginal': valA = a.valorOriginal; valB = b.valorOriginal; break;
        case 'valorVenta': valA = a.valorVenta; valB = b.valorVenta; break;
        case 'sucursal': valA = a.sucursal || ''; valB = b.sucursal || ''; break;
        case 'proveedor': valA = a.proveedor || ''; valB = b.proveedor || ''; break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [filtered, sortField, sortOrder, stockMin, stockMax]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as SortField);
      setSortOrder('asc');
    }
  };

  const handleOpenEdit = (id: number) => {
    setEditId(id);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleOpenInfo = (id: number) => {
    setInfoId(id);
    setShowInfoModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/v1/productos/${deleteId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al eliminar el producto');
      }
      showToast('Producto eliminado correctamente', 'success');
      fetchProductos();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar el producto', 'error');
    } finally {
      setDeleteId(null);
      setDeleteNombre('');
    }
  };

  const handleOpenModal = () => {
    setFormData(FORM_INITIAL);
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setShowModal(false);
      setFormErrors({});
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof FormData, value, formData.precio_adquisicion, true),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = buildFormErrors(formData, true, true);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    setSubmitting(true);
    try {
      const body = { nombre: formData.nombre.trim(), sku: formData.sku.trim() || undefined };
      const res = await fetch(`/api/v1/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear el producto");
      showToast("Producto agregado correctamente", "success");
      handleCloseModal();
      fetchProductos();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al crear el producto", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(sortedProductos.length / ITEMS_PER_PAGE);
  const paginated = sortedProductos.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const headers: Column<ProductoFila>[] = [
    { header: 'SKU', key: 'sku', sortable: true },
    { header: 'Productos', key: 'nombre', sortable: true },
    {
      header: 'Total Stock',
      key: 'totalStock',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{row.totalStock} en existencia</span>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{row.cantidadVariantes} variantes</span>
        </div>
      ),
    },
    { header: 'Valor original', key: 'valorOriginal', sortable: true, render: (row) => `$${row.valorOriginal.toLocaleString()}` },
    { header: 'Valor venta', key: 'valorVenta', sortable: true, render: (row) => `$${row.valorVenta.toLocaleString()}` },
    { header: 'Proveedor', key: 'proveedor', sortable: true },
    { header: 'Sucursal', key: 'sucursal', sortable: true },
    {
      header: 'Acciones',
      key: 'acciones',
      render: (row) => (
        <div className={styles.menuWrapper}>
          <button
            className={styles.menuTrigger}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuPos({ top: rect.bottom + 4, left: rect.right - 120 });
              setOpenMenuId(openMenuId === row.id ? null : row.id);
            }}
          >•••</button>
          {openMenuId === row.id && menuPos && (
            <div
              className={styles.dropdown}
              style={{ top: menuPos.top, left: menuPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={() => { setDeleteId(row.id); setDeleteNombre(row.nombre); setOpenMenuId(null); }}>Eliminar</button>
              <button className={styles.dropdownItem} onClick={() => { setAddVarianteProductId(row.id); setAddVarianteProductoNombre(row.nombre); setShowAddVarianteModal(true); setOpenMenuId(null); }}>Agregar variante</button>
              <button className={styles.dropdownItem} onClick={() => { setSelectVarianteProductId(row.id); setShowSelectVarianteModal(true); setOpenMenuId(null); }}>Editar variantes</button>
              <button className={styles.dropdownItem} onClick={() => handleOpenEdit(row.id)}>Editar producto</button>
              <button className={styles.dropdownItem} onClick={() => handleOpenInfo(row.id)}>Mas info general</button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div onClick={() => setOpenMenuId(null)}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.msg}
        </div>
      )}

      <div className={styles.filterBar}>
        <div className={styles.filterSearch}>
          <SearchInput placeholder="Buscar productos..." onSearch={handleSearch} />
        </div>

        <div className={styles.filterDivider} />

        <span className={styles.filterLabel}>Stock:</span>
        <input
          className={styles.filterInput}
          type="number" placeholder="Min" min="0"
          value={stockMin} onChange={e => { setStockMin(e.target.value); setPage(1); }}
        />
        <input
          className={styles.filterInput}
          type="number" placeholder="Max" min="0"
          value={stockMax} onChange={e => { setStockMax(e.target.value); setPage(1); }}
        />

        {(stockMin || stockMax) && (
          <button className={styles.filterClear} onClick={() => { setStockMin(''); setStockMax(''); }}>
            Limpiar
          </button>
        )}
      </div>

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>General</h1>
          <p className={styles.subtitle}>Total productos: {sortedProductos.length}</p>
        </div>
        <Button onClick={handleOpenModal}>+ Agregar producto</Button>
      </div>

      {loading ? (
        <p className={styles.loading}>Cargando...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <>
          <Table
            headers={headers}
            data={paginated}
            emptyMessage="Sin productos registrados"
            onSort={handleSort}
            sortField={sortField}
            sortOrder={sortOrder}
          />
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          )}
        </>
      )}

      <Dialog open={deleteId !== null} onClose={() => { setDeleteId(null); setDeleteNombre(''); }} title="Eliminar producto">
        <p className={formStyles.modalText}>
          Estas seguro que deseas eliminar <strong style={{ color: '#111827' }}>{deleteNombre}</strong>? Esta accion no se puede deshacer.
        </p>
        <div className={formStyles.modalActions}>
          <Button variant="secondary" onClick={() => { setDeleteId(null); setDeleteNombre(''); }}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
        </div>
      </Dialog>

      <SelectVarianteModal
        open={showSelectVarianteModal}
        productoId={selectVarianteProductId}
        onClose={() => setShowSelectVarianteModal(false)}
        onSelect={(idVar) => { setShowSelectVarianteModal(false); setEditVarianteId(idVar); setShowEditVarianteModal(true); }}
      />

      <EditVarianteModal
        open={showEditVarianteModal}
        varianteId={editVarianteId}
        onClose={() => setShowEditVarianteModal(false)}
        onSuccess={fetchProductos}
        showToast={showToast}
      />

      <EditProductoModal
        open={showEditModal}
        productoId={editId}
        onClose={() => { setShowEditModal(false); setEditId(null); }}
        onSuccess={fetchProductos}
        showToast={showToast}
      />

      <InfoProductoModal
        open={showInfoModal}
        productoId={infoId}
        onClose={() => { setShowInfoModal(false); setInfoId(null); }}
      />

      <AddVarianteModal
        open={showAddVarianteModal}
        productoId={addVarianteProductId}
        productoNombre={addVarianteProductoNombre}
        sucursales={sucursales.map((s) => ({ id_sucursal: s.id_sucursal, nombre_lugar: s.nombre_lugar, ubicacion: s.ubicacion }))}
        onClose={() => setShowAddVarianteModal(false)}
        onSuccess={fetchProductos}
        showToast={showToast}
      />

      <Dialog open={showModal} onClose={handleCloseModal} title="Nuevo producto">
        <NuevoProductoForm
          formData={formData}
          formErrors={formErrors}
          sucursales={sucursales.map((s) => ({ id_sucursal: s.id_sucursal, nombre_lugar: s.nombre_lugar, ubicacion: s.ubicacion }))}
          submitting={submitting}
          isCreationMode={true}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Dialog>
    </div>
  );
}