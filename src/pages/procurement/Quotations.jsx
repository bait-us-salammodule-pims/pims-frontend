import React, { useState, useEffect } from 'react';
import { Plus, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import api from '../../api/axios';

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list'); // list | create | detail
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  
  const [formData, setFormData] = useState({
    purchaseRequestId: '',
    vendorId: '',
    validUntil: '',
    remarks: '',
    items: [] 
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuotations();
    fetchFormData();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotations');
      setQuotations(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [prRes, vendorRes, itemRes] = await Promise.all([
        api.get('/purchase-requests'),
        api.get('/vendors'),
        api.get('/items')
      ]);
      setPurchaseRequests(prRes.data.data?.filter(pr => pr.status === 'APPROVED') || []);
      setVendors(vendorRes.data.data || []);
      setItemsList(itemRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch form reference data', err);
    }
  };

  const handlePrSelect = async (prId) => {
    setFormData({ ...formData, purchaseRequestId: prId });
    if (!prId) return;
    try {
      const res = await api.get(`/purchase-requests/${prId}`);
      const prItems = res.data.data.items || [];
      setFormData(prev => ({
        ...prev,
        purchaseRequestId: prId,
        items: prItems.map(i => ({
          itemId: i.itemId,
          quantity: i.requestedQuantity,
          unitPrice: '',
          remarks: ''
        }))
      }));
    } catch (error) {
      console.error('Failed to fetch PR details', error);
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
        purchaseRequestId: parseInt(formData.purchaseRequestId),
        vendorId: parseInt(formData.vendorId),
        items: formData.items.map(item => ({
          itemId: parseInt(item.itemId),
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          remarks: item.remarks
        }))
      };
      
      await api.post('/quotations', payload);
      setView('list');
      setFormData({
        purchaseRequestId: '', vendorId: '', validUntil: '', remarks: '', items: []
      });
      fetchQuotations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const submitQuotation = async (id) => {
    try {
      await api.post(`/quotations/${id}/submit`);
      fetchQuotations();
    } catch (err) {
      alert('Failed to submit Quotation');
    }
  };

  const selectQuotation = async (id) => {
    try {
      await api.post(`/quotations/${id}/select`);
      fetchQuotations();
      if (selectedQuotation && selectedQuotation.id === id) {
        viewDetails(id); // refresh details
      }
    } catch (err) {
      alert('Failed to select Quotation');
    }
  };

  const viewDetails = async (id) => {
    try {
      const res = await api.get(`/quotations/${id}`);
      setSelectedQuotation(res.data.data);
      setView('detail');
    } catch (err) {
      alert('Failed to fetch quotation details');
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  if (view === 'detail' && selectedQuotation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quotation Details: {selectedQuotation.quotationNumber}</h2>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><strong className="text-gray-500">Vendor:</strong> <span className="ml-2 text-gray-900 dark:text-white">{selectedQuotation.vendor?.name}</span></div>
            <div><strong className="text-gray-500">PR Number:</strong> <span className="ml-2 text-gray-900 dark:text-white">{selectedQuotation.purchaseRequest?.requestNumber}</span></div>
            <div><strong className="text-gray-500">Date:</strong> <span className="ml-2 text-gray-900 dark:text-white">{new Date(selectedQuotation.quotationDate).toLocaleDateString()}</span></div>
            <div><strong className="text-gray-500">Valid Until:</strong> <span className="ml-2 text-gray-900 dark:text-white">{selectedQuotation.validUntil ? new Date(selectedQuotation.validUntil).toLocaleDateString() : 'N/A'}</span></div>
            <div><strong className="text-gray-500">Status:</strong> <span className="ml-2 text-gray-900 dark:text-white font-bold">{selectedQuotation.status}</span></div>
            <div><strong className="text-gray-500">Remarks:</strong> <span className="ml-2 text-gray-900 dark:text-white">{selectedQuotation.remarks || 'None'}</span></div>
          </div>
          
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unit Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedQuotation.items?.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.item?.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{parseFloat(item.unitPrice).toFixed(2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{parseFloat(item.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {selectedQuotation.status === 'SUBMITTED' && (
            <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
              <button onClick={() => selectQuotation(selectedQuotation.id)} className="px-4 py-2 shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                Select Quotation (Award)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Quotation</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purchase Request (Approved)</label>
              <select required value={formData.purchaseRequestId} onChange={e => handlePrSelect(e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Select PR</option>
                {purchaseRequests.map(pr => <option key={pr.id} value={pr.id}>{pr.requestNumber} - {pr.purpose}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vendor</label>
              <select required value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Select Vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valid Until</label>
              <input type="date" value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Remarks</label>
              <input type="text" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          
          {formData.items.length > 0 && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quotation Items</h3>
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quotations</h2>
        <button
          onClick={() => setView('create')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Quotation
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quote No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PR No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {quotations.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No quotations found.
                </td>
              </tr>
            ) : (
              quotations.map((quote) => (
                <tr key={quote.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{quote.quotationNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{quote.vendor?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{quote.purchaseRequest?.requestNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(quote.quotationDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${quote.status === 'DRAFT' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
                      ${quote.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                      ${quote.status === 'SELECTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                      ${quote.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                    `}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    {quote.status === 'DRAFT' && (
                      <button onClick={() => submitQuotation(quote.id)} className="text-blue-600 hover:text-blue-900">Submit</button>
                    )}
                    <button onClick={() => viewDetails(quote.id)} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">View</button>
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
