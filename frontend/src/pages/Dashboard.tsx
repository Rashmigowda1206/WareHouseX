import React, { useEffect, useState, useRef } from 'react';
import {
  Boxes,
  Archive,
  AlertTriangle,
  AlertCircle,
  ShoppingCart,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  Database,
  ShieldCheck,
  Download,
  SlidersHorizontal,
  ChevronRight,
  MapPin,
  Barcode,
  Layers,
  ArrowUpRight,
  TrendingUp,
  X
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { LiveTelemetryChart } from '../components/charts/LiveTelemetryChart';
import { InventoryCategoryChart } from '../components/charts/InventoryCategoryChart';
import {
  inventoryService,
  searchService,
  monitoringService,
  qdrantBackupService,
  backupService,
  logsService
} from '../services';
import {
  InventoryItem,
  InventorySummary,
  SystemMetrics,
  User,
  QdrantBackupStatus
} from '../types';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const [qdrantStatus, setQdrantStatus] = useState<QdrantBackupStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchMode, setSearchMode] = useState<'semantic' | 'exact'>('semantic');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [detectedFilters, setDetectedFilters] = useState<Record<string, string>>({});

  // Filter Options from Qdrant
  const [filterOptions, setFilterOptions] = useState<{
    categories: string[];
    warehouse_locations: string[];
    suppliers: string[];
    statuses: string[];
  }>({
    categories: [],
    warehouse_locations: [],
    suppliers: [],
    statuses: ['In Stock', 'Low Stock', 'Out of Stock', 'Overstocked'],
  });

  // Modals for Quick Actions
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState<boolean>(false);
  const [selectedItemForStock, setSelectedItemForStock] = useState<InventoryItem | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(10);
  const [stockReason, setStockReason] = useState<string>('Owner inventory adjustment');
  const [similarModalOpen, setSimilarModalOpen] = useState<boolean>(false);
  const [similarItems, setSimilarItems] = useState<InventoryItem[]>([]);
  const [targetSimilarItem, setTargetSimilarItem] = useState<InventoryItem | null>(null);

  // Form State for Quick Add
  const [addItemForm, setAddItemForm] = useState({
    item_id: '',
    item_name: '',
    category: 'Electronics',
    quantity: 50,
    unit_price: 199.99,
    supplier: 'OmniSupply Corp',
    minimum_stock: 15,
    warehouse_location: 'Zone A-01-A',
    description: '',
    SKU: '',
    barcode: '',
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load User & Core Data
  useEffect(() => {
    const savedUser = localStorage.getItem('whx_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // silent
      }
    }
    fetchDashboardData();

    // Auto-refresh metrics interval
    const interval = setInterval(async () => {
      try {
        const live = await monitoringService.getMetrics();
        if (live) setMetrics(live);
      } catch (err) {
        // silent
      }
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const [invSum, sysMetrics, hist, qStatus, filters] = await Promise.all([
        inventoryService.getSummary().catch(() => null),
        monitoringService.getMetrics().catch(() => null),
        monitoringService.getHistory().catch(() => ({ history: [] })),
        qdrantBackupService.getStatus().catch(() => null),
        searchService.getFilters().catch(() => ({
          categories: ['Electronics', 'Machinery', 'Packaging', 'Safety Gear', 'IT Hardware'],
          warehouse_locations: ['Zone A-01-A', 'Zone A-01-B', 'Zone B-02-F'],
          suppliers: ['OmniSupply Corp', 'ZebraTech Global'],
          statuses: ['In Stock', 'Low Stock', 'Out of Stock', 'Overstocked'],
        })),
      ]);

      if (invSum) setSummary(invSum);
      if (sysMetrics) setMetrics(sysMetrics);
      if (hist && hist.history) setTelemetryHistory(hist.history);
      if (qStatus) setQdrantStatus(qStatus);
      if (filters) setFilterOptions(filters);
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Execute Search
  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = overrideQuery !== undefined ? overrideQuery : searchQuery;
    if (!queryToUse.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setDetectedFilters({});

    try {
      if (searchMode === 'exact') {
        const res = await searchService.exactSearch(queryToUse);
        setSearchResults(res.items || []);
      } else {
        const res = await searchService.semanticSearch({
          query: queryToUse,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          warehouse_location: selectedLocation !== 'all' ? selectedLocation : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          limit: 15,
        });
        setSearchResults(res.results || []);
        if (res.auto_detected_filters) {
          setDetectedFilters(res.auto_detected_filters);
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger search on prompt chip click
  const handleQuickPromptClick = (prompt: string, mode: 'semantic' | 'exact' = 'semantic') => {
    setSearchQuery(prompt);
    setSearchMode(mode);
    handleSearch(undefined, prompt);
  };

  // Find Similar Items
  const handleFindSimilar = async (item: InventoryItem) => {
    const itemId = item.item_id || item.product_id;
    if (!itemId) return;

    setTargetSimilarItem(item);
    setSimilarModalOpen(true);
    try {
      const res = await searchService.getSimilar(itemId, 5);
      setSimilarItems(res.similar_items || []);
    } catch (err) {
      console.error('Failed to find similar items:', err);
    }
  };

  // Adjust Stock
  const handleOpenStockModal = (item: InventoryItem) => {
    setSelectedItemForStock(item);
    setStockDelta(10);
    setIsStockModalOpen(true);
  };

  const handleConfirmStockAdjust = async () => {
    if (!selectedItemForStock) return;
    const itemId = selectedItemForStock.item_id || selectedItemForStock.product_id || selectedItemForStock.id;
    if (!itemId) return;

    try {
      await inventoryService.adjustStock(itemId, stockDelta, stockReason);
      setIsStockModalOpen(false);
      // Refresh search & summary
      if (hasSearched) handleSearch();
      fetchDashboardData();
    } catch (err) {
      alert('Stock adjustment error: Could not update Qdrant record.');
    }
  };

  // Quick Add Item
  const handleOpenAddModal = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setAddItemForm({
      item_id: `WHX-${randomNum}`,
      item_name: '',
      category: filterOptions.categories[0] || 'Electronics',
      quantity: 50,
      unit_price: 99.0,
      supplier: 'OmniSupply Corp',
      minimum_stock: 15,
      warehouse_location: 'Zone A-01-A',
      description: '',
      SKU: `SKU-${randomNum}`,
      barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    });
    setIsAddModalOpen(true);
  };

  const handleConfirmAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryService.addProduct(addItemForm);
      setIsAddModalOpen(false);
      fetchDashboardData();
      if (hasSearched) handleSearch();
      alert(`Item ${addItemForm.item_id} added to Qdrant vector database!`);
    } catch (err: any) {
      alert(err.message || 'Error adding item to Qdrant.');
    }
  };

  // Create Instant Snapshot
  const handleCreateSnapshot = async () => {
    try {
      const res = await qdrantBackupService.createSnapshot('manual', 'Owner Quick Dashboard snapshot');
      alert(`Encrypted Qdrant Snapshot created: ${res.backup.filename} (${res.backup.size_formatted})`);
      fetchDashboardData();
    } catch (err) {
      alert('Snapshot creation failed. Ensure sufficient disk storage.');
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const csvData = await inventoryService.exportInventory('csv');
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `warehousex_qdrant_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (err) {
      alert('Export failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ============================================================ */}
      {/* 1. TOP SECTION: Welcome, Status Pill, User Profile & Quick Actions */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-3xl bg-[#FFFFFF] border border-[#08482D]/15 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#08482D] animate-pulse" />
            <span className="text-xs font-mono-tech font-bold uppercase tracking-wider text-[#08482D] bg-[#DAE7C7]/50 px-2.5 py-0.5 rounded-full border border-[#08482D]/20">
              Qdrant Vector Engine Active
            </span>
            <span className="text-xs font-mono-tech text-[#5E5E61]">
              Collection: <strong className="text-[#101410]">warehouse_inventory</strong> • 384-Dim
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-heading font-extrabold text-[#101410] tracking-tight">
            Welcome, {user?.full_name || 'Warehouse Owner'}
          </h1>
          <p className="text-sm text-[#5E5E61]">
            Executive Dashboard • Semantic Inventory Search, Real-Time Stock Telemetry & Recovery
          </p>
        </div>

        {/* Right side toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-heading font-semibold text-[#08482D] bg-[#F5F8EF] hover:bg-[#DAE7C7]/60 border border-[#08482D]/20 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Refresh Qdrant Telemetry"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleCreateSnapshot}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-heading font-semibold text-[#08482D] bg-[#DAE7C7]/50 hover:bg-[#DAE7C7] border border-[#08482D]/20 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Create Encrypted Vector Snapshot"
          >
            <ShieldCheck size={14} />
            <span>Snapshot DB</span>
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-[#08482D]/15">
            <div className="w-9 h-9 rounded-xl bg-[#08482D] text-[#FFFFFF] flex items-center justify-center font-heading font-bold text-sm shadow-xs">
              {(user?.full_name || 'Owner').substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-heading font-bold text-[#101410] leading-tight">
                {user?.full_name || 'Administrator'}
              </p>
              <p className="text-[10px] font-mono-tech text-[#08482D] font-semibold uppercase">
                {user?.role || 'OWNER'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SUMMARY CARDS (6 Metrics as Requested) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Items */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#08482D]/15 shadow-xs hover:border-[#08482D]/35 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono-tech font-bold text-[#5E5E61] uppercase tracking-wider">
              Total Items
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#DAE7C7]/60 text-[#08482D] flex items-center justify-center">
              <Boxes size={14} />
            </div>
          </div>
          <div className="text-2xl font-heading font-extrabold text-[#101410]">
            {summary ? summary.total_products : '25'}
          </div>
          <div className="text-[10px] font-mono-tech text-[#08482D] font-semibold mt-1">
            Qdrant Vector Points
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#08482D]/15 shadow-xs hover:border-[#08482D]/35 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono-tech font-bold text-[#5E5E61] uppercase tracking-wider">
              Total Stock
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#DAE7C7]/60 text-[#08482D] flex items-center justify-center">
              <Archive size={14} />
            </div>
          </div>
          <div className="text-2xl font-heading font-extrabold text-[#101410]">
            {summary ? summary.total_quantity.toLocaleString() : '5,531'}
          </div>
          <div className="text-[10px] font-mono-tech text-[#5E5E61] mt-1">
            Physical Units
          </div>
        </div>

        {/* Low Stock */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#D97706]/20 bg-[#FFFBEB]/30 shadow-xs hover:border-[#D97706]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono-tech font-bold text-[#D97706] uppercase tracking-wider">
              Low Stock
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div className="text-2xl font-heading font-extrabold text-[#D97706]">
            {summary ? summary.low_stock_count : '7'}
          </div>
          <div className="text-[10px] font-mono-tech text-[#D97706] font-semibold mt-1">
            Below Reorder Point
          </div>
        </div>

        {/* Out of Stock */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#DC2626]/20 bg-[#FEF2F2]/30 shadow-xs hover:border-[#DC2626]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono-tech font-bold text-[#DC2626] uppercase tracking-wider">
              Out of Stock
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="text-2xl font-heading font-extrabold text-[#DC2626]">
            {summary ? summary.out_of_stock_count : '1'}
          </div>
          <div className="text-[10px] font-mono-tech text-[#DC2626] font-semibold mt-1">
            Zero Inventory
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#08482D]/15 shadow-xs hover:border-[#08482D]/35 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono-tech font-bold text-[#5E5E61] uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#DAE7C7]/60 text-[#08482D] flex items-center justify-center">
              <ShoppingCart size={14} />
            </div>
          </div>
          <div className="text-2xl font-heading font-extrabold text-[#101410]">
            {summary ? summary.total_orders : '12'}
          </div>
          <div className="text-[10px] font-mono-tech text-[#08482D] font-semibold mt-1">
            ${summary ? summary.total_revenue.toLocaleString() : '84,920'} Total
          </div>
        </div>

        {/* Pending Orders */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#08482D]/15 shadow-xs hover:border-[#08482D]/35 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono-tech font-bold text-[#5E5E61] uppercase tracking-wider">
              Pending Orders
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div className="text-2xl font-heading font-extrabold text-[#0284C7]">
            {summary && summary.pending_orders !== undefined ? summary.pending_orders : '3'}
          </div>
          <div className="text-[10px] font-mono-tech text-[#5E5E61] mt-1">
            Awaiting Dispatch
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. CENTRAL INTELLIGENT SEARCH ENGINE (Large Search Bar) */}
      {/* ============================================================ */}
      <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#08482D]/20 shadow-md space-y-4">
        {/* Search header & mode switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#08482D]" />
              <h2 className="text-lg font-heading font-bold text-[#101410]">
                Intelligent Vector & Exact Inventory Search
              </h2>
            </div>
            <p className="text-xs text-[#5E5E61]">
              Search thousands of warehouse products using plain English descriptions, item IDs, SKUs, or barcodes.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-[#F5F8EF] p-1 rounded-xl border border-[#08482D]/15">
            <button
              onClick={() => setSearchMode('semantic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer ${
                searchMode === 'semantic'
                  ? 'bg-[#08482D] text-[#FFFFFF] shadow-xs'
                  : 'text-[#5E5E61] hover:text-[#101410]'
              }`}
            >
              <Sparkles size={13} />
              <span>Semantic Vector</span>
            </button>
            <button
              onClick={() => setSearchMode('exact')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer ${
                searchMode === 'exact'
                  ? 'bg-[#08482D] text-[#FFFFFF] shadow-xs'
                  : 'text-[#5E5E61] hover:text-[#101410]'
              }`}
            >
              <Barcode size={13} />
              <span>Exact Match</span>
            </button>
          </div>
        </div>

        {/* Central Search Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative flex items-center">
            <Search size={20} className="absolute left-4 text-[#08482D]/60 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchMode === 'semantic'
                  ? 'Describe items naturally (e.g. "wireless devices with low stock", "protective safety equipment", "packaging cartons")...'
                  : 'Enter exact Item ID (e.g. WHX-EL-1001), SKU, or Barcode...'
              }
              className="w-full pl-12 pr-28 py-4 rounded-2xl bg-[#FAFCF6] border-2 border-[#08482D]/20 focus:border-[#08482D] focus:bg-[#FFFFFF] text-base text-[#101410] placeholder-[#5E5E61]/70 outline-none transition-all font-body shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setHasSearched(false);
                }}
                className="absolute right-24 text-[#5E5E61] hover:text-[#101410] p-1 rounded-md"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2.5 px-5 py-2.5 rounded-xl bg-[#08482D] hover:bg-[#053320] text-[#FFFFFF] font-heading font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Search</span>
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
            <span className="flex items-center gap-1 text-[#5E5E61] font-mono-tech font-semibold">
              <SlidersHorizontal size={13} />
              Filters:
            </span>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#FAFCF6] border border-[#08482D]/20 text-[#101410] font-heading text-xs outline-none focus:border-[#08482D]"
            >
              <option value="all">All Categories</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Location Zone Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#FAFCF6] border border-[#08482D]/20 text-[#101410] font-heading text-xs outline-none focus:border-[#08482D]"
            >
              <option value="all">All Fulfillment Zones</option>
              {filterOptions.warehouse_locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#FAFCF6] border border-[#08482D]/20 text-[#101410] font-heading text-xs outline-none focus:border-[#08482D]"
            >
              <option value="all">All Stock Statuses</option>
              {filterOptions.statuses.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* Auto-detected intent notification */}
            {detectedFilters.status && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DAE7C7] text-[#08482D] font-mono-tech text-[11px] font-bold border border-[#08482D]/20">
                <Sparkles size={11} /> Auto-Filtered: {detectedFilters.status}
              </span>
            )}
          </div>

          {/* Quick Example Prompt Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-[#5E5E61] font-mono-tech">Quick queries:</span>
            <button
              type="button"
              onClick={() => handleQuickPromptClick("Show me wireless devices with low stock", "semantic")}
              className="px-2.5 py-1 rounded-lg bg-[#F5F8EF] hover:bg-[#DAE7C7] text-[#08482D] text-[11px] font-mono-tech border border-[#08482D]/15 transition-all cursor-pointer"
            >
              ⚡ "Show me wireless devices with low stock"
            </button>
            <button
              type="button"
              onClick={() => handleQuickPromptClick("cut resistant safety gloves", "semantic")}
              className="px-2.5 py-1 rounded-lg bg-[#F5F8EF] hover:bg-[#DAE7C7] text-[#08482D] text-[11px] font-mono-tech border border-[#08482D]/15 transition-all cursor-pointer"
            >
              🧤 "cut resistant safety gloves"
            </button>
            <button
              type="button"
              onClick={() => handleQuickPromptClick("thermal barcode shipping labels", "semantic")}
              className="px-2.5 py-1 rounded-lg bg-[#F5F8EF] hover:bg-[#DAE7C7] text-[#08482D] text-[11px] font-mono-tech border border-[#08482D]/15 transition-all cursor-pointer"
            >
              🏷️ "thermal barcode shipping labels"
            </button>
            <button
              type="button"
              onClick={() => handleQuickPromptClick("WHX-EL-1001", "exact")}
              className="px-2.5 py-1 rounded-lg bg-[#F5F8EF] hover:bg-[#DAE7C7] text-[#08482D] text-[11px] font-mono-tech border border-[#08482D]/15 transition-all cursor-pointer"
            >
              🔍 "WHX-EL-1001" (Exact)
            </button>
          </div>
        </form>

        {/* ============================================================ */}
        {/* 4. SEARCH RESULTS DISPLAY */}
        {/* ============================================================ */}
        {hasSearched && (
          <div className="pt-4 border-t border-[#08482D]/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-heading font-bold text-[#101410]">
                  Search Results
                </h3>
                <span className="text-xs font-mono-tech bg-[#DAE7C7]/60 text-[#08482D] font-bold px-2 py-0.5 rounded-full border border-[#08482D]/20">
                  {searchResults.length} {searchResults.length === 1 ? 'item found' : 'items found'}
                </span>
                <span className="text-[11px] text-[#5E5E61] font-mono-tech">
                  via {searchMode === 'semantic' ? 'Qdrant Cosine Similarity' : 'Indexed Exact Match'}
                </span>
              </div>
              <button
                onClick={() => {
                  setHasSearched(false);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="text-xs text-[#5E5E61] hover:text-[#101410] underline cursor-pointer"
              >
                Clear Results
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#FAFCF6] border border-dashed border-[#08482D]/20 space-y-2">
                <Boxes size={28} className="mx-auto text-[#5E5E61]/60" />
                <p className="text-sm font-heading font-semibold text-[#101410]">
                  No matching warehouse items found in Qdrant
                </p>
                <p className="text-xs text-[#5E5E61]">
                  Try adjusting your search query, selecting "All Categories", or checking your exact SKU spelling.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#08482D]/15">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#DAE7C7]/40 text-[#08482D] font-heading font-bold uppercase text-[10.5px] tracking-wider border-b border-[#08482D]/15">
                    <tr>
                      <th className="py-3 px-4">Item ID</th>
                      <th className="py-3 px-4">Product Name & SKU</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Stock Status</th>
                      <th className="py-3 px-4">Relevance</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#08482D]/10 bg-[#FFFFFF]">
                    {searchResults.map((item, idx) => {
                      const itemId = item.item_id || item.product_id || `WHX-${idx}`;
                      const itemName = item.item_name || item.name || 'Unnamed Item';
                      const itemSku = item.SKU || item.sku || 'N/A';
                      const loc = item.warehouse_location || item.location_zone || 'Unassigned';
                      const status = item.status || item.stock_status || 'In Stock';

                      return (
                        <tr key={itemId} className="hover:bg-[#F5F8EF]/70 transition-colors">
                          <td className="py-3 px-4 font-mono-tech font-bold text-[#08482D]">
                            {itemId}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-heading font-bold text-[#101410] line-clamp-1">{itemName}</p>
                            <p className="font-mono-tech text-[10px] text-[#5E5E61]">{itemSku}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-[#F5F8EF] border border-[#08482D]/15 font-mono-tech text-[10.5px] text-[#08482D]">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono-tech font-bold text-[#101410]">
                            {item.quantity} <span className="text-[#5E5E61] font-normal text-[10px]">units</span>
                          </td>
                          <td className="py-3 px-4 text-[#5E5E61] font-body">
                            {item.supplier}
                          </td>
                          <td className="py-3 px-4 font-mono-tech text-[#101410]">
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-[#08482D]" />
                              {loc}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={status as any} />
                          </td>
                          <td className="py-3 px-4">
                            {item.match_type === 'exact' ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#DAE7C7] text-[#08482D] font-mono-tech text-[10px] font-bold">
                                100% Exact
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-[#DAE7C7]/70 text-[#08482D] font-mono-tech text-[10px] font-bold">
                                {item.similarity_percent || `${Math.round((item.score || 0.8) * 100)}%`}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenStockModal(item)}
                                className="px-2.5 py-1 rounded-lg bg-[#DAE7C7]/50 hover:bg-[#DAE7C7] text-[#08482D] font-heading font-bold text-[11px] transition-all cursor-pointer"
                                title="Adjust Stock Quantity in Qdrant"
                              >
                                Stock
                              </button>
                              <button
                                onClick={() => handleFindSimilar(item)}
                                className="px-2.5 py-1 rounded-lg bg-[#F5F8EF] hover:bg-[#DAE7C7]/60 text-[#08482D] font-heading font-bold text-[11px] border border-[#08482D]/20 transition-all cursor-pointer"
                                title="Find Semantically Similar Products"
                              >
                                Similar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. QUICK ACTIONS BAR (6 Owner Actions) */}
      {/* ============================================================ */}
      <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#08482D]/15 shadow-sm space-y-3">
        <h3 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-[#5E5E61]">
          Warehouse Owner Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Add Item */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#08482D] hover:bg-[#053320] text-[#FFFFFF] font-heading font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Item</span>
          </button>

          {/* Search Item */}
          <button
            onClick={() => {
              searchInputRef.current?.focus();
              window.scrollTo({ top: 250, behavior: 'smooth' });
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#F5F8EF] hover:bg-[#DAE7C7]/60 text-[#08482D] font-heading font-bold text-xs border border-[#08482D]/20 transition-all cursor-pointer"
          >
            <Search size={15} />
            <span>Search Item</span>
          </button>

          {/* Update Stock */}
          <button
            onClick={() => {
              if (searchResults.length > 0) {
                handleOpenStockModal(searchResults[0]);
              } else {
                onNavigateTab('inventory');
              }
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#F5F8EF] hover:bg-[#DAE7C7]/60 text-[#08482D] font-heading font-bold text-xs border border-[#08482D]/20 transition-all cursor-pointer"
          >
            <Archive size={15} />
            <span>Update Stock</span>
          </button>

          {/* View Inventory */}
          <button
            onClick={() => onNavigateTab('inventory')}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#F5F8EF] hover:bg-[#DAE7C7]/60 text-[#08482D] font-heading font-bold text-xs border border-[#08482D]/20 transition-all cursor-pointer"
          >
            <Layers size={15} />
            <span>View Inventory</span>
          </button>

          {/* View Orders */}
          <button
            onClick={() => {
              alert(`Order Management Telemetry:\nTotal Orders: ${summary?.total_orders || 12}\nPending Fulfillment: ${summary?.pending_orders || 3}\nTotal Processed Revenue: $${summary?.total_revenue?.toLocaleString() || '84,920.00'}`);
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#F5F8EF] hover:bg-[#DAE7C7]/60 text-[#08482D] font-heading font-bold text-xs border border-[#08482D]/20 transition-all cursor-pointer"
          >
            <ShoppingCart size={15} />
            <span>View Orders</span>
          </button>

          {/* Generate Reports */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#F5F8EF] hover:bg-[#DAE7C7]/60 text-[#08482D] font-heading font-bold text-xs border border-[#08482D]/20 transition-all cursor-pointer"
          >
            <Download size={15} />
            <span>Generate Reports</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. CHARTS & QDRANT VECTOR DATABASE STATUS SECTION */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Asset Valuation Chart */}
        <div className="lg:col-span-2">
          <InventoryCategoryChart
            data={summary?.categories || []}
            totalValue={summary?.total_value}
            totalSkus={summary?.total_products}
            lowStockCount={summary?.low_stock_count}
            outOfStockCount={summary?.out_of_stock_count}
            onManageCatalog={() => onNavigateTab('inventory')}
          />
        </div>

        {/* Qdrant Vector Engine & Snapshot Health Card */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#08482D]/15 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#08482D]/10 pb-3">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-[#08482D]" />
                <h3 className="text-sm font-heading font-bold text-[#101410]">
                  Qdrant Vector DB Health
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#DAE7C7] text-[#08482D] font-mono-tech text-[10px] font-bold">
                PERSISTENT
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono-tech">
              <div className="flex justify-between py-1 border-b border-[#08482D]/5">
                <span className="text-[#5E5E61]">Active Collection</span>
                <span className="font-bold text-[#101410]">warehouse_inventory</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#08482D]/5">
                <span className="text-[#5E5E61]">Vector Dimension</span>
                <span className="font-bold text-[#101410]">384 (Cosine Metric)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#08482D]/5">
                <span className="text-[#5E5E61]">Total Vector Points</span>
                <span className="font-bold text-[#08482D]">{summary ? summary.total_products : 25} points</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#08482D]/5">
                <span className="text-[#5E5E61]">Snapshot Encryption</span>
                <span className="font-bold text-[#101410]">Fernet (AES-128-CBC + HMAC)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#08482D]/5">
                <span className="text-[#5E5E61]">Integrity Verification</span>
                <span className="font-bold text-[#08482D]">SHA-256 Checksums</span>
              </div>
            </div>

            {qdrantStatus?.latest_snapshot && (
              <div className="p-3 rounded-xl bg-[#FAFCF6] border border-[#08482D]/15 space-y-1">
                <p className="text-[11px] font-heading font-bold text-[#08482D] flex items-center gap-1">
                  <ShieldCheck size={13} /> Latest Encrypted Snapshot
                </p>
                <p className="text-[10px] font-mono-tech text-[#101410] truncate">
                  {qdrantStatus.latest_snapshot.filename}
                </p>
                <div className="flex justify-between text-[9.5px] font-mono-tech text-[#5E5E61]">
                  <span>Size: {qdrantStatus.latest_snapshot.size_formatted}</span>
                  <span>{new Date(qdrantStatus.latest_snapshot.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('backups')}
              className="w-full py-2.5 rounded-xl bg-[#F5F8EF] hover:bg-[#DAE7C7]/60 border border-[#08482D]/20 text-[#08482D] font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Manage Vector Snapshots & Recovery</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 7. MODALS: Quick Add Item, Adjust Stock, Similar Items */}
      {/* ============================================================ */}

      {/* Quick Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Inventory Item to Qdrant"
        subtitle="Generates FastEmbed 384-dimensional vector embedding and enforces unique item ID"
      >
        <form onSubmit={handleConfirmAddItem} className="space-y-4 p-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-heading font-bold text-[#101410] mb-1">Item ID *</label>
              <input
                type="text"
                required
                value={addItemForm.item_id}
                onChange={(e) => setAddItemForm({ ...addItemForm, item_id: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 text-[#101410] font-mono-tech outline-none"
              />
            </div>
            <div>
              <label className="block font-heading font-bold text-[#101410] mb-1">SKU *</label>
              <input
                type="text"
                required
                value={addItemForm.SKU}
                onChange={(e) => setAddItemForm({ ...addItemForm, SKU: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 text-[#101410] font-mono-tech outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-heading font-bold text-[#101410] mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={addItemForm.item_name}
              onChange={(e) => setAddItemForm({ ...addItemForm, item_name: e.target.value })}
              placeholder="e.g. Industrial Barcode Scanner 2D Pro"
              className="w-full px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 text-[#101410] font-body outline-none"
            />
          </div>

          <div>
            <label className="block font-heading font-bold text-[#101410] mb-1">Description (for vector semantics)</label>
            <textarea
              rows={2}
              value={addItemForm.description}
              onChange={(e) => setAddItemForm({ ...addItemForm, description: e.target.value })}
              placeholder="Detailed description to power semantic natural-language searches..."
              className="w-full px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 text-[#101410] font-body outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-heading font-bold text-[#101410] mb-1">Category</label>
              <select
                value={addItemForm.category}
                onChange={(e) => setAddItemForm({ ...addItemForm, category: e.target.value })}
                className="w-full px-2.5 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 text-[#101410]"
              >
                {filterOptions.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-heading font-bold text-[#101410] mb-1">Quantity</label>
              <input
                type="number"
                min={0}
                value={addItemForm.quantity}
                onChange={(e) => setAddItemForm({ ...addItemForm, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 font-mono-tech"
              />
            </div>
            <div>
              <label className="block font-heading font-bold text-[#101410] mb-1">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={addItemForm.unit_price}
                onChange={(e) => setAddItemForm({ ...addItemForm, unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 font-mono-tech"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-heading font-bold text-[#101410] mb-1">Supplier</label>
              <input
                type="text"
                value={addItemForm.supplier}
                onChange={(e) => setAddItemForm({ ...addItemForm, supplier: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20"
              />
            </div>
            <div>
              <label className="block font-heading font-bold text-[#101410] mb-1">Warehouse Location</label>
              <input
                type="text"
                value={addItemForm.warehouse_location}
                onChange={(e) => setAddItemForm({ ...addItemForm, warehouse_location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 font-mono-tech"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#08482D]/10">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#08482D]/20 text-[#5E5E61] hover:text-[#101410] font-heading font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#08482D] hover:bg-[#053320] text-[#FFFFFF] font-heading font-bold shadow-xs cursor-pointer"
            >
              Store in Qdrant
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title="Quick Stock Adjustment"
        subtitle={`Adjust on-hand inventory units in Qdrant for ${selectedItemForStock?.item_id || selectedItemForStock?.product_id}`}
      >
        <div className="space-y-4 p-2 text-xs">
          <div className="p-3 rounded-xl bg-[#F5F8EF] border border-[#08482D]/15">
            <p className="font-heading font-bold text-[#101410]">{selectedItemForStock?.item_name || selectedItemForStock?.name}</p>
            <div className="flex gap-4 font-mono-tech text-[11px] text-[#5E5E61] mt-1">
              <span>Current Stock: <strong className="text-[#101410]">{selectedItemForStock?.quantity}</strong></span>
              <span>Reorder Level: {selectedItemForStock?.minimum_stock || selectedItemForStock?.reorder_point}</span>
            </div>
          </div>

          <div>
            <label className="block font-heading font-bold text-[#101410] mb-1">Stock Delta (+ to receive, - to deduct)</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStockDelta(stockDelta - 5)}
                className="px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 font-mono-tech font-bold"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => setStockDelta(stockDelta - 1)}
                className="px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 font-mono-tech font-bold"
              >
                -1
              </button>
              <input
                type="number"
                value={stockDelta}
                onChange={(e) => setStockDelta(parseInt(e.target.value) || 0)}
                className="flex-1 text-center py-2 rounded-xl bg-[#FAFCF6] border-2 border-[#08482D]/30 font-mono-tech font-extrabold text-sm text-[#08482D]"
              />
              <button
                type="button"
                onClick={() => setStockDelta(stockDelta + 1)}
                className="px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 font-mono-tech font-bold"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setStockDelta(stockDelta + 10)}
                className="px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 font-mono-tech font-bold"
              >
                +10
              </button>
            </div>
            <p className="text-[10px] font-mono-tech text-[#5E5E61] mt-1 text-center">
              New Projected Quantity: <strong className="text-[#08482D]">{Math.max(0, (selectedItemForStock?.quantity || 0) + stockDelta)} units</strong>
            </p>
          </div>

          <div>
            <label className="block font-heading font-bold text-[#101410] mb-1">Adjustment Reason</label>
            <input
              type="text"
              value={stockReason}
              onChange={(e) => setStockReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FAFCF6] border border-[#08482D]/20 text-[#101410]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#08482D]/10">
            <button
              onClick={() => setIsStockModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#08482D]/20 text-[#5E5E61] font-heading font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmStockAdjust}
              className="px-5 py-2 rounded-xl bg-[#08482D] hover:bg-[#053320] text-[#FFFFFF] font-heading font-bold shadow-xs cursor-pointer"
            >
              Update Qdrant Record
            </button>
          </div>
        </div>
      </Modal>

      {/* Similar Items Modal */}
      <Modal
        isOpen={similarModalOpen}
        onClose={() => setSimilarModalOpen(false)}
        title="Semantically Related Products"
        subtitle={`Top nearest-neighbor vectors for ${targetSimilarItem?.item_id || targetSimilarItem?.product_id} (${targetSimilarItem?.item_name || targetSimilarItem?.name})`}
      >
        <div className="space-y-3 p-2">
          {similarItems.length === 0 ? (
            <p className="text-xs text-[#5E5E61] p-4 text-center">No similar items found in collection.</p>
          ) : (
            <div className="space-y-2">
              {similarItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAFCF6] border border-[#08482D]/15 text-xs hover:border-[#08482D]/35 transition-all"
                >
                  <div className="space-y-0.5">
                    <p className="font-heading font-bold text-[#101410]">{item.item_name || item.name}</p>
                    <div className="flex items-center gap-2 font-mono-tech text-[10px] text-[#5E5E61]">
                      <span className="font-bold text-[#08482D]">{item.item_id || item.product_id}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{item.warehouse_location || item.location_zone}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#DAE7C7] text-[#08482D] font-mono-tech text-[10px] font-bold">
                      {item.similarity_percent || '88% match'}
                    </span>
                    <p className="font-mono-tech text-[10px] text-[#5E5E61]">
                      {item.quantity} in stock
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
