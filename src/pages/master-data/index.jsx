import React, { useState } from 'react';
import Categories from './Categories';
import Items from './Items';
import Vendors from './Vendors';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('items');

  const tabs = [
    { id: 'items', name: 'Items' },
    { id: 'categories', name: 'Categories' },
    { id: 'vendors', name: 'Vendors' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'items' && <Items />}
        {activeTab === 'categories' && <Categories />}
        {activeTab === 'vendors' && <Vendors />}
      </div>
    </div>
  );
}
