import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/layout.css';

interface Props {
  collapsed: boolean;
}
const Sidebar: React.FC<Props> = ({ collapsed }) => (
  <nav className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
    <ul>
      <li><Link to="/">ホーム</Link></li>
      <li><Link to="/navigation">ナビゲーション</Link></li>
      <li><Link to="/fetch">フェッチ</Link></li>
      <li><Link to="/classification">分類デモ(MobilenetV2)</Link></li>
      <li><Link to="/crosswalk">横断歩道支援</Link></li>
    </ul>
  </nav>
);

export default Sidebar;
