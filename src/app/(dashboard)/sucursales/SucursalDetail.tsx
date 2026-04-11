import { useState, useMemo } from 'react';
import styles from './SucursalDetail.module.css';
import { InventarioItem } from '@/types/inventario.types';

interface SucursalDetailProps {
  nombre: string;
  ubicacion: string;
  inventario: InventarioItem[];
  loading: boolean;
  onBack: () => void;
  onDelete: (idVariante: number) => void;
  onEdit: (idVariante: number, idInventario: number) => void;
  onInfo: (idVariante: number, idInventario: number) => void;
  onAjustar: (idVariante: number, idSucursal: number) => void;
  onVenta: (idVariante: number, idSucursal: number) => void;
}

type SortField = 'sku' | 'nombre' | 'stock' | 'precio_adquisicion' | 'precio_venta' | 'utilidad';
type SortOrder = 'asc' | 'desc';

export default function SucursalDetail({
  nombre,
  ubicacion,
  inventario,
  loading,
  onBack,
  onDelete,
  onEdit,
  onInfo,
  onAjustar,
  onVenta,
}: SucursalDetailProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const financialMetrics = useMemo(() => {
    let totalInversion = 0;
    let totalVenta = 0;
    inventario.forEach(item => {
      const stock = Number(item.stock_actual) || 0;
      const costo = Number(item.precio_adquisicion) || 0;
      const precio = Number(item.precio_venta) || 0;
      totalInversion += (stock * costo);
      totalVenta += (stock * precio);
    });
    return { totalInversion, totalVenta };
  }, [inventario]);

  const filteredAndSorted = useMemo(() => {
    let result = [...inventario];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.sku_producto?.toLowerCase().includes(term) ||
        item.nombre_producto?.toLowerCase().includes(term) ||
        item.modelo?.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'sku': valA = a.sku_producto || ''; valB = b.sku_producto || ''; break;
        case 'nombre': valA = a.nombre_producto || ''; valB = b.nombre_producto || ''; break;
        case 'stock': valA = Number(a.stock_actual); valB = Number(b.stock_actual); break;
        case 'precio_adquisicion': valA = Number(a.precio_adquisicion) || 0; valB = Number(b.precio_adquisicion) || 0; break;
        case 'precio_venta': valA = Number(a.precio_venta) || 0; valB = Number(b.precio_venta) || 0; break;
        case 'utilidad': 
          valA = (Number(a.precio_venta) || 0) - (Number(a.precio_adquisicion) || 0);
          valB = (Number(b.precio_venta) || 0) - (Number(b.precio_adquisicion) || 0);
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [inventario, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <span className={styles.sortIconPlaceholder}>↕</span>;
    return <span className={styles.sortIconActive}>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className={styles.detailContainer} onClick={() => setOpenMenuId(null)}>
      <button onClick={onBack} className={styles.backButton}>
        &larr; Volver a Sucursales
      </button>

      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.nombre}>{nombre}</h2>
          {ubicacion && <p className={styles.ubicacion}>{ubicacion}</p>}
        </div>
        
        <div className={styles.financialMetrics}>
           <div className={styles.metricItem}>
             <span className={styles.metricLabel}>Total Productos</span>
             <span className={styles.metricValue}>{loading ? '...' : inventario.length}</span>
           </div>
           <div className={styles.metricDivider}></div>
           <div className={styles.metricItem}>
             <span className={styles.metricLabel}>Inversión Total</span>
             <span className={styles.metricValue}>${financialMetrics.totalInversion.toLocaleString()}</span>
           </div>
           <div className={styles.metricDivider}></div>
           <div className={styles.metricItem}>
             <span className={styles.metricLabel}>Venta Esperada</span>
             <span className={`${styles.metricValue} ${styles.textSuccess}`}>${financialMetrics.totalVenta.toLocaleString()}</span>
           </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.toolbar}>
          <input 
            type="text" 
            placeholder="Buscar por SKU, Nombre o Modelo..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
            <p className={styles.empty}>Cargando inventario...</p>
          ) : inventario.length === 0 ? (
            <p className={styles.empty}>Sin productos en esta sucursal</p>
          ) : filteredAndSorted.length === 0 ? (
            <p className={styles.empty}>No hay resultados para {searchTerm}</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} onClick={() => handleSort('sku')}>SKU {renderSortIcon('sku')}</th>
                  <th className={styles.th} onClick={() => handleSort('nombre')}>Productos {renderSortIcon('nombre')}</th>
                  <th className={styles.th}>Modelo</th>
                  <th className={styles.th}>Color</th>
                  <th className={styles.th} onClick={() => handleSort('stock')}>Stock {renderSortIcon('stock')}</th>
                  <th className={styles.th} onClick={() => handleSort('precio_adquisicion')}>Costo {renderSortIcon('precio_adquisicion')}</th>
                  <th className={styles.th} onClick={() => handleSort('precio_venta')}>Venta {renderSortIcon('precio_venta')}</th>
                  <th className={styles.th} onClick={() => handleSort('utilidad')}>Utilidad {renderSortIcon('utilidad')}</th>
                  <th className={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((item) => {
                  const stock = Number(item.stock_actual);
                  const isLowStock = stock <= 5;
                  
                  const costo = Number(item.precio_adquisicion) || 0;
                  const precio = Number(item.precio_venta) || 0;
                  const ganancia = precio - costo;
                  const margen = precio > 0 ? ((ganancia / precio) * 100).toFixed(1) : '0.0';

                  return (
                    <tr key={item.id_inventario} className={styles.tr}>
                      <td className={styles.td}>{item.sku_producto}</td>
                      <td className={styles.td}>{item.nombre_producto}</td>
                      <td className={styles.td}>{item.modelo || '—'}</td>
                      <td className={styles.td}>{item.color || '—'}</td>
                      <td className={styles.td}>
                        <span className={`${styles.stockBadge} ${isLowStock ? styles.stockLow : styles.stockNormal}`}>
                          {stock} {isLowStock && '!'}
                        </span>
                      </td>
                      <td className={styles.td}>${costo.toLocaleString()}</td>
                      <td className={styles.td}>${precio.toLocaleString()}</td>
                      <td className={styles.td}>
                         <div className={styles.utilidadBox}>
                           <span className={styles.gananciaDinero}>${ganancia.toLocaleString()}</span>
                           <span className={styles.margenPorcentaje}>({margen}%)</span>
                         </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.menuWrapper}>
                          <button
                            className={styles.menuTrigger}
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPos({ top: rect.bottom + 4, left: rect.right - 120 });
                              setOpenMenuId(openMenuId === item.id_inventario ? null : item.id_inventario);
                            }}
                          >
                            •••
                          </button>
                          {openMenuId === item.id_inventario && menuPos && (
                            <div
                              className={styles.dropdown}
                              style={{ top: menuPos.top, left: menuPos.left }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDelete(item.id_variante);
                                }}
                              >
                                Eliminar
                              </button>
                              <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEdit(item.id_variante, item.id_inventario);
                                }}
                              >
                                Editar
                              </button>
                              <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onInfo(item.id_variante, item.id_inventario);
                                }}
                              >
                                Más info
                              </button>
                              <button
                                className={`${styles.dropdownItem} ${styles.dropdownWarning}`}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onAjustar(item.id_variante, item.id_sucursal);
                                }}
                                style={{ color: '#0ea5e9' }}
                              >
                                Ajustar stock
                              </button>
                              <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onVenta(item.id_variante, item.id_sucursal);
                                }}
                              >
                                Generar venta
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}