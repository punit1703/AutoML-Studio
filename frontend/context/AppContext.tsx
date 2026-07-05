"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  datasetId: string | null;
  setDatasetId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [projectId, setProjectIdState] = useState<string | null>(null);
  const [datasetId, setDatasetIdState] = useState<string | null>(null);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('access_token', newToken);
    } else {
      localStorage.removeItem('access_token');
    }
  };

  const setProjectId = (id: string | null) => {
    setProjectIdState(id);
    if (id) localStorage.setItem('project_id', id);
    else localStorage.removeItem('project_id');
  };

  const setDatasetId = (id: string | null) => {
    setDatasetIdState(id);
    if (id) localStorage.setItem('dataset_id', id);
    else localStorage.removeItem('dataset_id');
  };

  useEffect(() => {
    // Load from local storage on mount
    const savedToken = localStorage.getItem('access_token');
    const savedProjectId = localStorage.getItem('project_id');
    const savedDatasetId = localStorage.getItem('dataset_id');

    if (savedToken) setTokenState(savedToken);
    if (savedProjectId) setProjectIdState(savedProjectId);
    if (savedDatasetId) setDatasetIdState(savedDatasetId);
  }, []);

  return (
    <AppContext.Provider value={{ token, setToken, projectId, setProjectId, datasetId, setDatasetId }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
