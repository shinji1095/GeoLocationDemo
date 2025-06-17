import React, { useState } from 'react';
import Sidebar from './Sidebar';
import '../styles/layout.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true);   // ← 最初は閉じる

  return (
    <div className="layout-root">
      {/* ────────── ヘッダー ────────── */}
      <header className="app-header">
        <button onClick={() => setCollapsed(!collapsed)} className="menu-btn">
          {collapsed ? '☰' : '×'}
        </button>
        <h1 className="app-title">GPSアプリ</h1>
      </header>

      {/* ────── ヘッダーの下を flex row で分割 ────── */}
      <div className="body-wrapper">
        <Sidebar collapsed={collapsed} />       {/* サイドバー */}
        <main className="page-wrapper">         {/* メインエリア */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
