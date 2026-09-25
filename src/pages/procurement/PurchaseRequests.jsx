import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import api from '../../api/axios';

export default function PurchaseRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'create' | 'detail'
  
  // Data for form
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [stores, setStores] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  
  const [formData, setFormData] = useState({
    departmentId: '',
    branchId: '',
    storeId: '',
    purpose: '',
    requiredDate: '',
    remarks: '',
    items: [] // { itemId, requestedQuantity, estimatedUnitPrice, remarks }
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchFormData();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchase-requests');
      setRequests(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch purchase requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [deptRes, branchRes, storeRes, itemRes] = await Promise.all([
        api.get('/organization/departments'),
        api.get('/organization/branches'),
        api.get('/organization/stores'),
        api.get('/items')
      ]);
      setDepartments(deptRes.data.data || []);
      setBranches(branchRes.data.data || []);
      setStores(storeRes.data.data || []);
      setItemsList(itemRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch form reference data', err);
    }
  };

  const addItemToForm = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemId: '', requestedQuantity: 1, estimatedUnitPrice: '', remarks: '' }]
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        departmentId: parseInt(formData.departmentId),
        branchId: parseInt(formData.branchId),
        storeId: formData.storeId ? parseInt(formData.storeId) : undefined,
        items: formData.items.map(item => ({
          itemId: parseInt(item.itemId),
          requestedQuantity: parseInt(item.requestedQuantity),
          estimatedUnitPrice: item.estimatedUnitPrice ? parseFloat(item.estimatedUnitPrice) : null,
          remarks: item.remarks
        }))
      };
      
      await api.post('/purchase-requests', payload);
      setView('list');
      setFormData({
        departmentId: '', branchId: '', storeId: '', purpose: '', requiredDate: '', remarks: '', items: []
      });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save PR');
    } finally {
      setSaving(false);
    }
  };

  const submitPR = async (id) => {
    try {
      await api.post(`/purchase-requests/${id}/submit`);
      fetchRequests();
    } catch (err) {
      alert('Failed to submit PR');
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Purchase Request</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
              <select required value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Branch</label>
              <select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Store (Optional)</label>
              <select value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Select Store</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</label>
              <input type="text" required value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Required Date</label>
              <input type="date" value={formData.requiredDate} onChange={e => setFormData({...formData, requiredDate: e.target.value})} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Items</h3>
              <button type="button" onClick={addItemToForm} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                + Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-4 items-end bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Item</label>
                    <select required value={item.itemId} onChange={e => updateItem(index, 'itemId', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="">Select...</option>
                      {itemsList.map(i => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
                    </select>
                  </div>
                  <div className="w-full sm:w-24">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Qty</label>
                    <input type="number" min="1" required value={item.requestedQuantity} onChange={e => updateItem(index, 'requestedQuantity', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Est. Price</label>
                    <input type="number" step="0.01" value={item.estimatedUnitPrice} onChange={e => updateItem(index, 'estimatedUnitPrice', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Remarks</label>
                    <input type="text" value={item.remarks} onChange={e => updateItem(index, 'remarks', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 sm:text-sm h-10 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:text-red-700 mb-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {formData.items.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No items added. Click "+ Add Item" to add items to your request.</p>
              )}
            </div>
          </div>
          
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase Requests</h2>
        <button
          onClick={() => setView('create')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create PR
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PR Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No purchase requests found.
                </td>
              </tr>
            ) : (
              requests.map((pr) => (
                <tr key={pr.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{pr.requestNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{pr.purpose}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{pr.department?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(pr.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${pr.status === 'DRAFT' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
                      ${pr.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                      ${pr.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                      ${pr.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                    `}>
                      {pr.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    {pr.status === 'DRAFT' && (
                      <button onClick={() => submitPR(pr.id)} className="text-blue-600 hover:text-blue-900">Submit</button>
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
