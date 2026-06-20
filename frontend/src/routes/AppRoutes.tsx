import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';

import Dashboard from '../pages/Dashboard';

import Register from '../pages/Register';
import Orders from '../pages/Orders';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import Suppliers from '../pages/Suppliers';
import Shoes from '../pages/Shoes';
import Customers from '../pages/Customers';
import Employees from '../pages/Employees';
import Login from '../pages/login';

// Dummy component for pages we haven't built yet
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col items-center justify-center space-y-4">
    <h2 className="text-3xl font-black text-slate-800">{title} Module</h2>
    <p className="text-slate-500 font-medium bg-slate-100 px-4 py-2 rounded-lg">Coming soon: Development is in progress...</p>
  </div>
);

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login/>} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register/>} 
        />

        {/* Private Routes enclosed in Layout */}
        <Route element={<Layout />}>
          
          {/* Admin, Staff, Cashier */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'CASHIER']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
          </Route>

          {/* Admin, Staff */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
            <Route path="/shoes" element={<Shoes />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/payments" element={<PlaceholderPage title="Payments" />} />
          </Route>

          {/* Admin Only */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/employees" element={<Employees />} />
            <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
          </Route>

        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
