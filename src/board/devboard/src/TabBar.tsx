// import React from 'react';
// import { Tab } from './types';

// interface TabBarProps {
//   tabs: Tab[];
//   onTabClick: (id: string) => void;
//   onTabClose: (id: string) => void;
//   onThemeToggle: () => void;
//   theme: 'my-dark' | 'my-light';
// }

// const langIcon: Record<string, string> = {
//   python: '🐍',
//   javascript: '⚡',
//   typescript: '🔷',
//   css: '🎨',
//   html: '🌐',
// };

// const TabBar: React.FC<TabBarProps> = ({ tabs, onTabClick, onTabClose, onThemeToggle, theme }) => {
//   return (
//     <div className="tabs-row" style={{ display: 'flex', alignItems: 'center', background: theme === 'my-dark' ? '#0f172a' : '#f0f0f0' }}>
//       {tabs.map((tab) => (
//         <div
//           key={tab.id}
//           className={`tab ${tab.isActive ? 'active' : ''}`}
//           onClick={() => onTabClick(tab.id)}
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             padding: '6px 12px',
//             cursor: 'pointer',
//             background: tab.isActive ? (theme === 'my-dark' ? '#1e293b' : '#d0d0d0') : 'transparent',
//             borderRight: '1px solid #2c2f3a',
//             color: theme === 'my-dark' ? '#fff' : '#000'
//           }}
//         >
//           <span className="tab-icon" style={{ marginRight: 5 }}>{langIcon[tab.language] ?? '📄'}</span>
//           <span className="tab-name">{tab.filename}</span>
//           {tab.isModified && <span className="tab-modified" style={{ marginLeft: 5 }}>●</span>}
//           <button
//             className="tab-close"
//             onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
//             title="Close tab"
//             style={{ marginLeft: 8, cursor: 'pointer', background: 'transparent', border: 'none', color: theme === 'my-dark' ? '#fff' : '#000' }}
//           >
//             ✕
//           </button>
//         </div>
//       ))}
//       <div onClick={onThemeToggle} style={{ marginLeft: 'auto', padding: 10, cursor: 'pointer' }}>
//         {theme === 'my-dark' ? '🌙' : '☀️'}
//       </div>
//     </div>
//   );
// };

// export default TabBar;