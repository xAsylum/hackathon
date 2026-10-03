import React from 'react';
import { Layers, FileCode2, BookOpen } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="logo-group">
        <div className="logo-badge">
          <Layers size={26} />
        </div>
        <div className="title-wrap">
          <h1>Hackathon Dev Stack</h1>
          <p>React + FastAPI + SQLite with Docker Compose</p>
        </div>
      </div>

      <div className="quick-links">
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="link-btn"
          id="btn-swagger-docs"
        >
          <BookOpen size={16} />
          <span>Swagger Docs</span>
        </a>
        <a
          href="http://localhost:8000/redoc"
          target="_blank"
          rel="noopener noreferrer"
          className="link-btn"
          id="btn-redoc"
        >
          <FileCode2 size={16} />
          <span>ReDoc</span>
        </a>
      </div>
    </header>
  );
};
