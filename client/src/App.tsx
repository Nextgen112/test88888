import React, { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import PublicFiles from "@/pages/PublicFiles";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status with the server
    fetch('/api/auth/status', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.authenticated || false);
        setIsLoading(false);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsLoading(false);
      });
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Call logout endpoint to destroy session
    fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include' 
    }).then(() => {
      setIsAuthenticated(false);
    }).catch(() => {
      setIsAuthenticated(false);
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
      <Route path="/admin">
        {isAuthenticated ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
      </Route>
      <Route path="/">
        <PublicFiles />
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
