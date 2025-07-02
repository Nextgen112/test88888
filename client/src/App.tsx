import React, { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import UserLogin from "@/pages/UserLogin";
import PublicFiles from "@/pages/PublicFiles";
import AddMyIP from "@/pages/AddMyIP";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status with the server
    fetch('/api/auth/status', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.authenticated || false);
        setUserRole(data.role || null);
        setIsLoading(false);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUserRole(null);
        setIsLoading(false);
      });
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    // Refresh to get user role
    window.location.reload();
  };

  const handleLogout = () => {
    // Call logout endpoint to destroy session
    fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include' 
    }).then(() => {
      setIsAuthenticated(false);
      setUserRole(null);
    }).catch(() => {
      setIsAuthenticated(false);
      setUserRole(null);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/vip.js">
        <PublicFiles />
      </Route>
      <Route path="/admin-login">
        {isAuthenticated && userRole === 'admin' ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        )}
      </Route>
      <Route path="/user-login">
        {isAuthenticated && userRole === 'user' ? (
          <AddMyIP />
        ) : (
          <UserLogin onLoginSuccess={handleLoginSuccess} />
        )}
      </Route>
      <Route path="/admin">
        {isAuthenticated && userRole === 'admin' ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        )}
      </Route>
      <Route path="/login">
        {isAuthenticated ? (
          userRole === 'admin' ? <Dashboard onLogout={handleLogout} /> : <AddMyIP />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
      </Route>
      <Route path="/">
        {!isAuthenticated ? (
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        ) : userRole === 'admin' ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <AddMyIP />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
