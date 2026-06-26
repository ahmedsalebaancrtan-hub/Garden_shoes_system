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
import Payments from '../pages/Payments';
import Reports from '../pages/Reports';
import InvoiceReport from '../pages/InvoiceReport';
import Salaries from '../pages/Salaries';
import Users from '../pages/Users';

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
            <Route path="/payments" element={<Payments />} />
            <Route path="/invoice/:id" element={<InvoiceReport />} />
          </Route>

          {/* Admin, Staff */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
            <Route path="/shoes" element={<Shoes />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/salaries" element={<Salaries />} />
          </Route>

          {/* Admin Only */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/users" element={<Users />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
