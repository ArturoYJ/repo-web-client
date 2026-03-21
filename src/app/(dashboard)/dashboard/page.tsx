"use client";

import { useState, useCallback, useMemo } from "react";
import Table, { Column } from "@/components/ui/Table";
import SearchInput from "@/components/ui/SearchInput";
import Button from "@/components/ui/Button";
import StatsCard from "./Statscard";
import BestSellersCard from './BestSellersCard';
import SlowMoversCard from './SlowMoversCard';
import SucursalesPerformance from './SucursalesPerformance';
import SalesTrendChart from './SalesTrendChart';
import { useDashboardData } from "@/hooks/useDashboardData";
import type { ProductoFila } from "@/types/dashboard-view.types";
import styles from "./page.module.css";
import kpiStyles from './kpiCards.module.css';

type SortField = 'sku' | 'nombre' | 'totalStock' | 'valorOriginal' | 'valorVenta' | 'cantidadVariantes' | 'utilidad';
type SortOrder = 'asc' | 'desc';

export default function DashboardPage() {
  const {
    stats,
    statsLoading,
    productos,
    tableLoading,
    sucursales,
    varianteSucursalMap,
    varianteToProductoMap,
    fetchTodo,
    fetchStats,
  } = useDashboardData();

  const [filtered, setFiltered] = useState<ProductoFila[]>([]);
  const [filteredInit, setFilteredInit] = useState(false);
  const [periodo, setPeriodo] = useState('30dias');
  const [stockFilter, setStockFilter] = useState('todos');
  const [variantFilter, setVariantFilter] = useState('todos');
  
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSearch = useCallback(
    (term: string) => {
      setFilteredInit(true);
      if (!term.trim()) {
        setFiltered(productos);
        return;
      }
      const lower = term.toLowerCase();
      setFiltered(
        productos.filter(
          (p) =>
            p.nombre.toLowerCase().includes(lower) ||
            p.sku.toLowerCase().includes(lower),
        ),
      );
    },
    [productos],
  );

  const displayProductos = useMemo(() => {
    let result = [...(filteredInit ? filtered : productos)];

    // Apply stock/variant filters
    result = result.filter((p) => {
      if (stockFilter === 'agotados' && p.totalStock > 0) return false;
      if (stockFilter === 'con_stock' && p.totalStock === 0) return false;
      if (variantFilter === 'sin_variantes' && p.cantidadVariantes > 0) return false;
      if (variantFilter === 'con_variantes' && p.cantidadVariantes === 0) return false;
      return true;
    });

    // Apply sorting
    result.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'sku': valA = a.sku || ''; valB = b.sku || ''; break;
        case 'nombre': valA = a.nombre || ''; valB = b.nombre || ''; break;
        case 'totalStock': valA = a.totalStock; valB = b.totalStock; break;
        case 'valorOriginal': valA = a.valorOriginal; valB = b.valorOriginal; break;
        case 'valorVenta': valA = a.valorVenta; valB = b.valorVenta; break;
        case 'cantidadVariantes': valA = a.cantidadVariantes; valB = b.cantidadVariantes; break;
        case 'utilidad': 
          valA = a.valorVenta - a.valorOriginal;
          valB = b.valorVenta - b.valorOriginal;
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [filteredInit, filtered, productos, stockFilter, variantFilter, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as SortField);
      setSortOrder('asc');
    }
  };

  const valorInventario = productos.reduce((acc, p) => acc + p.valorVenta, 0);

  const columnas: Column<ProductoFila>[] = [
    { header: "SKU", key: "sku", sortable: true },
    { header: "Productos", key: "nombre", sortable: true },
    { header: "Total Stock", key: "totalStock", sortable: true },
    {
      header: "Valor original",
      key: "valorOriginal",
      sortable: true,
      render: (r) => `$${r.valorOriginal.toLocaleString()}`,
    },
    {
      header: "Valor venta",
      key: "valorVenta",
      sortable: true,
      render: (r) => `$${r.valorVenta.toLocaleString()}`,
    },
    { 
      header: "Utilidad", 
      key: "utilidad",
      sortable: true,
      render: (r) => {
        const g = r.valorVenta - r.valorOriginal;
        const m = r.valorVenta > 0 ? ((g / r.valorVenta) * 100).toFixed(1) : '0.0';
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
             <span style={{ fontWeight: 600, color: '#059669' }}>${g.toLocaleString()}</span>
             <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>({m}%)</span>
          </div>
        );
      }
    },
    { header: "Cant. variantes", key: "cantidadVariantes", sortable: true },
  ];

  return (
    <div>
      <div 
        className={styles.statsRow}
        style={{ 
          opacity: (tableLoading && productos.length > 0) ? 0.5 : 1, 
          transition: 'opacity 0.2s ease', 
          pointerEvents: tableLoading ? 'none' : 'auto' 
        }}
      >
        <StatsCard
          label="Productos únicos"
          value={(
            stats?.estadisticas.total_productos_unicos ?? 0
          ).toLocaleString()}
          sub="en el sistema"
          loading={statsLoading && !stats}
        />
        <StatsCard
          label="Total variantes"
          value={(stats?.estadisticas.total_variantes ?? 0).toLocaleString()}
          sub="SKUs registrados"
          loading={statsLoading && !stats}
        />
        <StatsCard
          label="Valor del inventario"
          value={`$${valorInventario.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`}
          sub="precio venta etiqueta"
          loading={tableLoading && productos.length === 0}
        />
      </div>

      {stats && (
        <div style={{ opacity: statsLoading ? 0.5 : 1, transition: 'opacity 0.2s ease', pointerEvents: statsLoading ? 'none' : 'auto' }}>
          <div className={styles.filterBar} style={{ marginTop: '2rem' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0, marginRight: '1rem', fontSize: '1.2rem' }}>Rendimiento</h2>
            <select
              aria-label="Periodo de rendimiento"
              className={styles.filterSelect}
              value={periodo}
              onChange={(e) => {
                const val = e.target.value;
                setPeriodo(val);
                fetchStats(val);
              }}
            >
              <option value="hoy">Hoy</option>
              <option value="7dias">Últimos 7 días</option>
              <option value="30dias">Últimos 30 días</option>
              <option value="este_mes">Este mes</option>
              <option value="historico">Histórico completo</option>
            </select>
            <div className={styles.filterActions}>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setPeriodo('30dias');
                  fetchStats('30dias');
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>
          <div className={kpiStyles.kpiGrid}>
            <BestSellersCard productos={stats.top_productos || []} />
            <SlowMoversCard productos={stats.slow_movers || []} />
            <SucursalesPerformance sucursales={stats.rendimiento_sucursales || []} />
          </div>
          
          <SalesTrendChart data={stats.ventas_por_dia || []} />

          <hr className={styles.divider} />
        </div>
      )}

      <div className={styles.filterBar}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <SearchInput placeholder="Buscar productos..." onSearch={handleSearch} />
        </div>
        <select
          aria-label="Filtrar por estado de stock"
          className={styles.filterSelect}
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="todos">Estado de Stock (Todos)</option>
          <option value="con_stock">Con Stock Global</option>
          <option value="agotados">Agotados Globalmente</option>
        </select>
        <select
          aria-label="Filtrar por variantes"
          className={styles.filterSelect}
          value={variantFilter}
          onChange={(e) => setVariantFilter(e.target.value)}
        >
          <option value="todos">Variantes (Todas)</option>
          <option value="con_variantes">Con Variantes</option>
          <option value="sin_variantes">Sin Variantes</option>
        </select>
        <div className={styles.filterActions}>
          <Button 
            variant="secondary" 
            onClick={() => {
              setStockFilter('todos');
              setVariantFilter('todos');
              // Notice: We don't need to clear the search input here directly since it's controlled internally by `SearchInput`,
              // unless we refactor `SearchInput`, but we clear the select filters as requested.
            }}
          >
            Limpiar
          </Button>
        </div>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>General</h1>
          <p className={styles.subtitle}>
            Total productos: <strong>{displayProductos.length}</strong>
          </p>
        </div>
      </div>

      {tableLoading && productos.length === 0 ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      ) : (
        <div style={{ opacity: tableLoading ? 0.5 : 1, transition: 'opacity 0.2s ease', pointerEvents: tableLoading ? 'none' : 'auto' }}>
          <Table
            headers={columnas}
            data={displayProductos}
            emptyMessage="Sin productos registrados"
            onSort={handleSort}
            sortField={sortField}
            sortOrder={sortOrder}
          />
        </div>
      )}
    </div>
  );
}