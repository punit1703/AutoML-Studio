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
  const [projectId, setProjectId] = useState<string | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(null);

  useEffect(() => {
    // Load from local storage on mount
    const savedToken = localStorage.getItem('access_token');
    const savedProjectId = localStorage.getItem('project_id');
    const savedDatasetId = localStorage.getItem('dataset_id');

    if (savedToken) setTokenState(savedToken);
    if (savedProjectId) setProjectId(savedProjectId);
    if (savedDatasetId) setDatasetId(savedDatasetId);
  }, []);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('access_token', newToken);
    } else {
      localStorage.removeItem('access_token');
    }
  };

  // Sync to local storage
  useEffect(() => {
    if (projectId) localStorage.setItem('project_id', projectId);
    else localStorage.removeItem('project_id');
  }, [projectId]);

  useEffect(() => {
    if (datasetId) localStorage.setItem('dataset_id', datasetId);
    else localStorage.removeItem('dataset_id');
  }, [datasetId]);

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
