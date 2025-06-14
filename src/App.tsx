import React from 'react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// 由于 React 已声明但未使用，移除该导入语句
// import React from 'react';
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import EditPayment from "@/pages/EditPayment";
import Admin from "@/pages/Admin";
import FinanceManagement from "@/pages/FinanceManagement";
import Home from "@/pages/Home";
import Report from "@/pages/Report";
import Process from "@/pages/Process";
import SpareParts from "@/pages/SpareParts";
import ServicePrice from "@/pages/ServicePrice";
import EditProcess from "@/pages/EditProcess";
import CustomerProfile from "@/pages/CustomerProfile";
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext<{
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
}>({
  isAuthenticated: false,
  setIsAuthenticated: (value: boolean) => {},
  logout: () => {},
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ 
        isAuthenticated, 
        setIsAuthenticated: (value: boolean) => setIsAuthenticated(value), 
        logout 
      }}>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-light dark:text-primary-dark">Property Repair</h1>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-600" />}
            </button>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<Report />} />
            <Route path="/process" element={<Process />} />
            <Route path="/process/:id" element={<Process />} />
            <Route path="/spare-parts" element={<SpareParts />} />
            <Route path="/service-price" element={<ServicePrice />} />
            <Route path="/customer-profile" element={<CustomerProfile />} />
            <Route path="/customer-profile/:id" element={<CustomerProfile />} />
            <Route path="/finance-management" element={<FinanceManagement />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/edit-payment/:id" element={<EditPayment />} />
            <Route path="/edit-process/:id" element={<EditProcess />} />
          </Routes>
        </main>
        
        <footer className="bg-white/80 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 py-6">
          <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400">
            <p>© 2023 Property Repair System. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </AuthContext.Provider>
  );
}
