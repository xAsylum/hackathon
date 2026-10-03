import React from 'react';
import { Server, Database, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { HealthResponse } from '../api/client';

interface StatusCardProps {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
}

export const StatusCards: React.FC<StatusCardProps> = ({ health, loading, error }) => {
  const isBackendOnline = !!health && !error;
  const isDbOnline = health?.database === 'healthy';

  return (
    <div className="status-grid">
      {/* Frontend Status */}
      <div className="card">
        <div className="status-card-header">
          <Globe size={22} color="#6366f1" />
          <span className="status-badge online">
            <CheckCircle2 size={12} /> Active
          </span>
        </div>
        <h3 className="status-title">Frontend</h3>
        <p className="status-subtitle">React + Vite (Port 5173)</p>
      </div>

      {/* Backend Status */}
      <div className="card">
        <div className="status-card-header">
          <Server size={22} color="#a855f7" />
          <span className={`status-badge ${isBackendOnline ? 'online' : 'offline'}`}>
            {isBackendOnline ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {loading ? 'Checking...' : isBackendOnline ? 'Connected' : 'Offline'}
          </span>
        </div>
        <h3 className="status-title">FastAPI Backend</h3>
        <p className="status-subtitle">
          {isBackendOnline ? 'Uvicorn Hot-Reloading (Port 8000)' : error || 'Connecting...'}
        </p>
      </div>

      {/* SQLite Status */}
      <div className="card">
        <div className="status-card-header">
          <Database size={22} color="#ec4899" />
          <span className={`status-badge ${isDbOnline ? 'online' : 'offline'}`}>
            {isDbOnline ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {loading ? 'Checking...' : isDbOnline ? 'Ready' : 'Not Connected'}
          </span>
        </div>
        <h3 className="status-title">SQLite Database</h3>
        <p className="status-subtitle">
          {isDbOnline ? 'Persisted Volume: backend/data/app.db' : 'Waiting for connection'}
        </p>
      </div>
    </div>
  );
};
