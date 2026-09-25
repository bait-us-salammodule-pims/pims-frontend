import React, { useState, useEffect } from 'react';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';

export default function Receiving() {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list');
  
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  
  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    deliveryNoteNumber: '',
    remarks: '',
    items: [] 
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGrns();
    fetchFormData();
  }, []);

  const fetchGrns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/grns');
      setGrns(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch GRNs');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [poRes, itemRes] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/items')
      ]);
      setPurchaseOrders(poRes.data.data?.filter(po => po.status === 'ISSUED' || po.status === 'PARTIALLY_RECEIVED') || []);
      setItemsList(itemRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch form reference data', err);
    }
  };

  const handlePoSelect = async (poId) => {
    setFormData({ ...formData, purchaseOrderId: poId });
    if (!poId) return;
    try {
      const res = await api.get(`/purchase-orders/${poId}`);
      const po = res.data.data;
      const poItems = po.items || [];
      setFormData(prev => ({
        ...prev,
        purchaseOrderId: poId,
        items: poItems.map(i => ({
          purchaseOrderItemId: i.id,
          itemId: i.itemId,
          expectedQuantity: i.quantity - (i.receivedQuantity || 0),
          receivedQuantity: i.quantity - (i.receivedQuantity || 0),
          remarks: ''
        }))
      }));
    } catch (error) {
      console.error('Failed to fetch PO details', error);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        purchaseOrderId: parseInt(formData.purchaseOrderId),
        items: formData.items.map(item => ({
          purchaseOrderItemId: parseInt(item.purchaseOrderItemId),
          itemId: parseInt(item.itemId),
          receivedQuantity: parseInt(item.receivedQuantity),
          remarks: item.remarks
        }))
      };
      
      await api.post('/grns', payload);
      setView('list');
      setFormData({
        purchaseOrderId: '', deliveryNoteNumber: '', remarks: '', items: []
      });
      fetchGrns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save GRN');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  if (view === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Receive Goods (GRN)</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purchase Order</label>
              <select required value={formData.purchaseOrderId} onChange={e => handlePoSelect(e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Select PO</option>
                {purchaseOrders.map(po => <option key={po.id} value={po.id}>{po.orderNumber} - {po.vendor?.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Note Number</label>
              <input type="text" value={formData.deliveryNoteNumber} onChange={e => setFormData({...formData, deliveryNoteNumber: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Remarks</label>
              <input type="text" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          
          {formData.items.length > 0 && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Items Received</h3>
              <div className="space-y-4">
                {formData.items.map((item, index) => {
                  const itemDef = itemsList.find(i => i.id === item.itemId);
                  return (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 items-end bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Item</label>
                        <div className="mt-1 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-900 text-sm">
                          {itemDef?.name || 'Unknown Item'}
                        </div>
                      </div>
                      <div className="w-full sm:w-24">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Expected</label>
                        <div className="mt-1 py-2 px-3 border border-transparent text-sm">
                          {item.expectedQuantity}
                        </div>
                      </div>
                      <div className="w-full sm:w-32">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Received Qty</label>
                        <input type="number" min="0" max={item.expectedQuantity} required value={item.receivedQuantity} onChange={e => updateItem(index, 'receivedQuantity', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Remarks</label>
                        <input type="text" value={item.remarks} onChange={e => updateItem(index, 'remarks', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button type="button" onClick={() => setView('list')} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={saving || formData.items.length === 0} className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Create GRN'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Goods Received Notes (GRN)</h2>
        <button
          onClick={() => setView('create')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create GRN
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">GRN Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PO Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Received Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {grns.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No GRNs found.
                </td>
              </tr>
            ) : (
              grns.map((grn) => (
                <tr key={grn.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{grn.grnNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{grn.purchaseOrder?.orderNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(grn.receivedDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${grn.status === 'RECEIVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800'}
                    `}>
                      {grn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
