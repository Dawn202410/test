import { Routes, Route } from "react-router-dom";
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
import { createContext, useState } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  setIsAuthenticated: (value: boolean) => {},
  logout: () => {},
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, logout }}
    >
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
    </AuthContext.Provider>
  );
}
