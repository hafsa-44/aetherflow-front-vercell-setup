
// this new file 
import React from 'react';
import logoSvg from "../../../assets/logo.svg"


interface TopBarProps {
  onSearch?: (query: string) => void;
  userName?: string;
}

const TopBar: React.FC<TopBarProps> = ({ onSearch, userName }) => {
  const initial = userName?.trim()?.charAt(0)?.toUpperCase() || '?';
  return (
    <div className="topbar">
      <div className="topbar-left">
      
<div className="logo-mark" onClick={() => window.location.href = '/dashboard'} style={{ cursor: 'pointer' }}>
  <img src={logoSvg} width="28" height="28" alt="logo" style={{ display: "block" }} />
</div>       
 <span className="app-title">AetherFlow</span>
      </div>
      
    {/*  <div className="search-bar">
        <span className="search-icon">⌕</span>
        <input
          className="search-input"
          placeholder="search features/tasks"
          onChange={(e) => onSearch?.(e.target.value)}
        />
        <span className="search-kbd">⌘K</span>
      </div>*/}

      <div className="topbar-right">
       {/* <button className="topbar-icon" title="Settings">⚙</button>
        <button className="topbar-icon" title="Search">⌕</button>
       */}
        <div className="avatar" title={userName || 'User Profile'}>{initial}</div>
        {/*<span className="topbar-chevron">▾</span>*/}
      </div>
    </div>
  );
};

export default TopBar;