import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  ArrowUpDown,
  MapPin
} from 'lucide-react';
import { inventoryService } from '../services';
import { InventoryItem, UserRole } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface InventoryProps {
  userRole?: UserRole;
}

export const Inventory: React.FC<InventoryProps> = ({ userRole = 'staff' }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState<boolean>(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Cycle count receipt');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    product_id: '',
    name: '',
    category: 'Electronics',
    quantity: 50,
    unit_price: 199.99,
    supplier: '',
    reorder_point: 15,
    location_zone: 'Zone A-01-A',
    sku: '',
  });

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        inventoryService.getItems({
          category: selectedCategory,
          status: selectedStatus,
          search: searchQuery,
        }),
        inventoryService.getCategories(),
      ]);
      setItems(itemsRes.items || []);
      setCategories(catsRes.categories || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      product_id: `WHX-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: categories[0] || 'Electronics',
      quantity: 50,
      unit_price: 99.0,
      supplier: 'OmniSupply Corp',
      reorder_point: 15,
      location_zone: 'Zone A-02-A',
      sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      product_id: item.product_id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit_price: item.unit_price,
      supplier: item.supplier,
      reorder_point: item.reorder_point,
      location_zone: item.location_zone,
      sku: item.sku,
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryService.updateProduct(editingItem.id, formData);
      } else {
        await inventoryService.addProduct(formData);
      }
      setIsAddEditModalOpen(false);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleOpenAdjustStock = (item: InventoryItem) => {
    setAdjustingItem(item);
    setStockDelta(10);
    setAdjustReason('Physical inventory reconciliation');
    setIsAdjustStockModalOpen(true);
  };

  const handleConfirmAdjustStock = async () => {
    if (!adjustingItem) return;
    try {
      await inventoryService.adjustStock(adjustingItem.id, stockDelta, adjustReason);
      setIsAdjustStockModalOpen(false);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Error adjusting stock');
    }
  };

  const handleOpenDelete = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await inventoryService.deleteProduct(itemToDelete.id);
      setIsDeleteDialogOpen(false);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Error deleting product');
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvData = await inventoryService.exportInventory('csv');
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `warehousex_inventory_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export inventory CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold tracking-tight text-[#101410] flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-[#08482D]" />
            <span>Warehouse Inventory Management</span>
          </h2>
          <p className="text-xs font-mono-tech text-[#5E5E61] mt-1">
            Track asset locations, adjust stock allocations, configure reorder levels, and manage SKUs
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F8EF] border border-[#08482D]/18 text-xs font-mono-tech font-bold text-[#08482D] transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#08482D] hover:bg-[#063722] text-xs font-mono-tech font-bold text-white shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#08482D]/12 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#5E5E61] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Product ID, SKU, Name, Zone..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAFCF6] border border-[#08482D]/18 rounded-xl text-xs font-mono-tech text-[#101410] placeholder-[#A3A3A3] focus:outline-none focus:border-[#08482D]"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-[11px] font-mono-tech text-[#5E5E61] uppercase font-bold hidden sm:inline">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#FAFCF6] border border-[#08482D]/18 rounded-xl px-3 py-2 text-xs font-mono-tech font-medium text-[#101410] focus:outline-none focus:border-[#08482D] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-[11px] font-mono-tech text-[#5E5E61] uppercase font-bold hidden sm:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#FAFCF6] border border-[#08482D]/18 rounded-xl px-3 py-2 text-xs font-mono-tech font-medium text-[#101410] focus:outline-none focus:border-[#08482D] cursor-pointer"
            >
              <option value="all">All Stock Levels</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Overstocked">Overstocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="rounded-3xl border border-[#08482D]/12 bg-[#FFFFFF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-tech text-xs">
            <thead className="bg-[#FAFCF6] border-b border-[#08482D]/12 text-[#5E5E61] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Product ID & SKU</th>
                <th className="py-3.5 px-4">Item Name & Category</th>
                <th className="py-3.5 px-4">Storage Zone</th>
                <th className="py-3.5 px-4 text-right">Quantity</th>
                <th className="py-3.5 px-4 text-right">Unit Price</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#08482D]/8">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#5E5E61]">
                    <span className="animate-pulse">Loading warehouse inventory manifest...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#5E5E61]">
                    No items found matching current filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAF4] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#08482D]">
                      <div>{item.product_id}</div>
                      <div className="text-[10px] text-[#5E5E61]">{item.sku}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-[#101410]">{item.name}</div>
                      <div className="text-[10px] text-[#08482D] font-mono-tech font-bold">{item.category}</div>
                    </td>
                    <td className="py-3 px-4 text-[#5E5E61]">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#FAFCF6] border border-[#08482D]/15 text-[11px] font-bold text-[#101410]">
                        <MapPin className="w-3 h-3 text-[#08482D]" />
                        <span>{item.location_zone}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      <span className={item.quantity <= item.reorder_point ? 'text-[#DC2626] font-extrabold' : 'text-[#101410]'}>
                        {item.quantity}
                      </span>
                      <span className="text-[10px] text-[#5E5E61] block font-normal">Min: {item.reorder_point}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#101410] font-bold">
                      ${item.unit_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={item.stock_status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-[#5E5E61] text-[11px] truncate max-w-[140px]">
                      {item.supplier}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenAdjustStock(item)}
                          title="Adjust Stock Quantity (+/-)"
                          className="p-1.5 rounded-lg bg-[#F5F8EF] hover:bg-[#DAE7C7] text-[#08482D] border border-[#08482D]/15 transition-colors cursor-pointer"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Details"
                              className="p-1.5 rounded-lg bg-[#F5F8EF] hover:bg-[#E0F2FE] text-[#0369A1] border border-[#08482D]/15 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(item)}
                              title="Delete Product"
                              className="p-1.5 rounded-lg bg-[#F5F8EF] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#08482D]/15 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Product */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingItem ? `Edit Product: ${editingItem.product_id}` : 'Add New Inventory Product'}
        subtitle="Ensure product ID and warehouse bin assignment conform to facility layout"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 font-mono-tech text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#5E5E61] mb-1 font-bold">Product ID</label>
              <input
                type="text"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                required
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410] font-bold"
              />
            </div>
            <div>
              <label className="block text-[#5E5E61] mb-1 font-bold">SKU / Barcode</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410] font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#5E5E61] mb-1 font-bold">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410] font-bold font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#5E5E61] mb-1 font-bold">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410]"
              />
            </div>
            <div>
              <label className="block text-[#5E5E61] mb-1 font-bold">Warehouse Zone / Bin</label>
              <input
                type="text"
                value={formData.location_zone}
                onChange={(e) => setFormData({ ...formData, location_zone: e.target.value })}
                required
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#5E5E61] mb-1 font-bold">Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410] font-bold"
              />
            </div>
            <div>
              <label className="block text-[#5E5E61] mb-1 font-bold">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410] font-bold"
              />
            </div>
            <div>
              <label className="block text-[#5E5E61] mb-1 font-bold">Reorder Point</label>
              <input
                type="number"
                min="1"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: parseInt(e.target.value) || 10 })}
                required
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#5E5E61] mb-1 font-bold">Supplier / Vendor</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              required
              className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410]"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[#08482D]/12">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#08482D]/20 text-[#5E5E61] hover:bg-[#F5F8EF] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#08482D] hover:bg-[#063722] font-bold text-white shadow-sm cursor-pointer"
            >
              {editingItem ? 'Save Modifications' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Stock Adjustment (+/-) */}
      <Modal
        isOpen={isAdjustStockModalOpen}
        onClose={() => setIsAdjustStockModalOpen(false)}
        title={`Adjust Stock: ${adjustingItem?.product_id}`}
        subtitle={`Current Level: ${adjustingItem?.quantity} units (${adjustingItem?.name})`}
        maxWidth="md"
      >
        <div className="space-y-4 font-mono-tech text-xs">
          <div>
            <label className="block text-[#5E5E61] mb-1.5 font-bold">
              Quantity Delta (Positive to Add, Negative to Deduct)
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setStockDelta((prev) => prev - 10)}
                className="px-3 py-2 rounded-xl bg-[#F5F8EF] text-[#08482D] border border-[#08482D]/20 hover:bg-[#EAEFE2] cursor-pointer font-bold"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => setStockDelta((prev) => prev - 1)}
                className="px-3 py-2 rounded-xl bg-[#F5F8EF] text-[#08482D] border border-[#08482D]/20 hover:bg-[#EAEFE2] cursor-pointer font-bold"
              >
                -1
              </button>
              <input
                type="number"
                value={stockDelta}
                onChange={(e) => setStockDelta(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/30 rounded-xl text-center text-[#08482D] font-black text-sm"
              />
              <button
                type="button"
                onClick={() => setStockDelta((prev) => prev + 1)}
                className="px-3 py-2 rounded-xl bg-[#F5F8EF] text-[#08482D] border border-[#08482D]/20 hover:bg-[#EAEFE2] cursor-pointer font-bold"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setStockDelta((prev) => prev + 10)}
                className="px-3 py-2 rounded-xl bg-[#F5F8EF] text-[#08482D] border border-[#08482D]/20 hover:bg-[#EAEFE2] cursor-pointer font-bold"
              >
                +10
              </button>
            </div>
            <div className="text-[11px] text-[#5E5E61] mt-2 font-medium">
              Resulting Stock:{' '}
              <span className="font-bold text-[#08482D]">
                {Math.max(0, (adjustingItem?.quantity || 0) + stockDelta)} units
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[#5E5E61] mb-1 font-bold">Reason for Audit Log</label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-[#08482D]/12">
            <button
              type="button"
              onClick={() => setIsAdjustStockModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#08482D]/20 text-[#5E5E61] hover:bg-[#F5F8EF] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAdjustStock}
              className="px-5 py-2 rounded-xl bg-[#08482D] hover:bg-[#063722] font-bold text-white cursor-pointer shadow-sm"
            >
              Commit Stock Update
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Inventory Deletion"
        message={`Are you sure you want to permanently remove ${itemToDelete?.product_id} (${itemToDelete?.name}) from warehouse tracking? This action is logged in administrative audit history.`}
        confirmLabel="Delete Item"
        confirmVariant="danger"
      />
    </div>
  );
};
