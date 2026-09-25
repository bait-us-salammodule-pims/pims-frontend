import React, { useState, useEffect } from 'react';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list');
  
  const [quotations, setQuotations] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  
  const [formData, setFormData] = useState({
    quotationId: '',
    vendorId: '',
    purchaseRequestId: '',
    expectedDeliveryDate: '',
    deliveryAddress: '',
    paymentTerms: '',
    remarks: '',
    items: [] 
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchFormData();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchase-orders');
      setOrders(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [quoteRes, itemRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/items')
      ]);
      setQuotations(quoteRes.data.data?.filter(q => q.status === 'SELECTED') || []);
      setItemsList(itemRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch form reference data', err);
    }
  };

  const handleQuotationSelect = async (quoteId) => {
    setFormData({ ...formData, quotationId: quoteId });
    if (!quoteId) return;
    try {
      const res = await api.get(`/quotations/${quoteId}`);
      const quote = res.data.data;
      const quoteItems = quote.items || [];
      setFormData(prev => ({
        ...prev,
        quotationId: quoteId,
        vendorId: quote.vendorId,
        purchaseRequestId: quote.purchaseRequestId,
        items: quoteItems.map(i => ({
          itemId: i.itemId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          remarks: ''
        }))
      }));
    } catch (error) {
      console.error('Failed to fetch quotation details', error);
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
        quotationId: parseInt(formData.quotationId),
        vendorId: parseInt(formData.vendorId),
        purchaseRequestId: parseInt(formData.purchaseRequestId),
        items: formData.items.map(item => ({
          itemId: parseInt(item.itemId),
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          remarks: item.remarks
        }))
      };
      
      await api.post('/purchase-orders', payload);
      setView('list');
      setFormData({
        quotationId: '', vendorId: '', purchaseRequestId: '', expectedDeliveryDate: '', deliveryAddress: '', paymentTerms: '', remarks: '', items: []
      });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save PO');
    } finally {
      setSaving(false);
    }
  };

  const issuePO = async (id) => {
    try {
      await api.post(`/purchase-orders/${id}/issue`);
      fetchOrders();
    } catch (err) {
      alert('Failed to issue PO');
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Purchase Order</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quotation (Selected)</label>
              <select required value={formData.quotationId} onChange={e => handleQuotationSelect(e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Select Quotation</option>
                {quotations.map(q => <option key={q.id} value={q.id}>{q.quotationNumber} - {q.vendor?.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expected Delivery Date</label>
              <input type="date" value={formData.expectedDeliveryDate} onChange={e => setFormData({...formData, expectedDeliveryDate: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Terms</label>
              <input type="text" value={formData.paymentTerms} onChange={e => setFormData({...formData, paymentTerms: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Address</label>
              <input type="text" value={formData.deliveryAddress} onChange={e => setFormData({...formData, deliveryAddress: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Remarks</label>
              <input type="text" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          
          {formData.items.length > 0 && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Items (From Quotation)</h3>
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
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Qty</label>
                        <input type="number" min="1" required value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                      <div className="w-full sm:w-32">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Unit Price</label>
                        <input type="number" step="0.01" required value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
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
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase Orders</h2>
        <button
          onClick={() => setView('create')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create PO
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PO Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              orders.map((po) => (
                <tr key={po.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{po.orderNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{po.vendor?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(po.orderDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${po.status === 'DRAFT' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
                      ${po.status === 'ISSUED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                      ${po.status === 'PARTIALLY_RECEIVED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
                      ${po.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                      ${po.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                    `}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    {po.status === 'DRAFT' && (
                      <button onClick={() => issuePO(po.id)} className="text-blue-600 hover:text-blue-900">Issue</button>
                    )}
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
