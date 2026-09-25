import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  FileText, 
  Package, 
  ArrowRightLeft,
  Loader2
} from 'lucide-react';
import api from '../api/axios';

export default function Dashboard() {
  const [stats, setStats] = useState({
    prCount: 0,
    poCount: 0,
    grnCount: 0,
    transferCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // We will fetch real counts if endpoints are available
        // If not, we will just omit or show what is available.
        // For now, attempting to get lists and using their length.
        
        const [prs, pos, grns, transfers] = await Promise.all([
          api.get('/purchase-requests').catch(() => ({ data: { data: [] } })),
          api.get('/purchase-orders').catch(() => ({ data: { data: [] } })),
          api.get('/grns').catch(() => ({ data: { data: [] } })),
          api.get('/stock-transfers').catch(() => ({ data: { data: [] } }))
        ]);

        setStats({
          prCount: prs.data?.data?.length || 0,
          poCount: pos.data?.data?.length || 0,
          grnCount: grns.data?.data?.length || 0,
          transferCount: transfers.data?.data?.length || 0
        });
      } catch (error) {
        console.error("Error fetching dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const cards = [
    { name: 'Purchase Requests', value: stats.prCount, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/50' },
    { name: 'Purchase Orders', value: stats.poCount, icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/50' },
    { name: 'GRNs', value: stats.grnCount, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/50' },
    { name: 'Stock Transfers', value: stats.transferCount, icon: ArrowRightLeft, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-md ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {card.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {card.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Welcome to PIMS</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Select an option from the sidebar to start managing procurement and inventory.
        </p>
      </div>
    </div>
  );
}
