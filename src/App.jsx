import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Organization from './pages/organization';
import MasterData from './pages/master-data';
import Procurement from './pages/procurement';
import Receiving from './pages/receiving';
import Inventory from './pages/inventory';
import StockTransfers from './pages/transfers';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="organization/*" element={<Organization />} />
            <Route path="master-data/*" element={<MasterData />} />
            <Route path="procurement/*" element={<Procurement />} />
            <Route path="receiving/*" element={<Receiving />} />
            <Route path="inventory/*" element={<Inventory />} />
            <Route path="transfers/*" element={<StockTransfers />} />
            {/* Phase 5+ Routes will go here */}
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
