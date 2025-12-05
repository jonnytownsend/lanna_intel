import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <main className={`
        flex-1 h-full relative transition-all duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'md:ml-80' : 'md:ml-20'}
      `}>
        <Dashboard activeTab={activeTab} />
      </main>
    </div>
  );
};

export default App;
