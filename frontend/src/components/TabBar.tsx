import React from 'react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  persistent?: boolean;
}

interface TabBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Tab[];
  isDark?: boolean;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, tabs, isDark = true }) => {
  return (
    <div className={`flex items-center space-x-0.5 backdrop-blur-xl border rounded-lg p-0.5 ${
      isDark 
        ? 'bg-gray-900/20 border-gray-700/20' 
        : 'bg-white/20 border-gray-400/30'
    }`}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            flex items-center space-x-1 px-2 py-1 rounded-md font-medium text-xs transition-all duration-200 whitespace-nowrap
            ${activeTab === tab.id 
              ? (isDark 
                  ? 'bg-white/20 text-white border border-white/30 shadow-lg' 
                  : 'bg-black/20 text-black border border-black/40 shadow-lg'
                )
              : (isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-white/10' 
                  : 'text-gray-700 hover:text-black hover:bg-black/10'
                )
            }
          `}
        >
          <div className="w-3 h-3 flex-shrink-0">
            {tab.icon}
          </div>
          <span className="font-medium hidden sm:inline">{tab.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default TabBar; 