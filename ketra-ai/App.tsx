import React, { useState } from 'react';
import type { View } from './types';
import ChatView from './components/ChatView';
import ImageView from './components/ImageView';
import { ChatIcon, ImageIcon, KetraLogo } from './components/icons';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('chat');

  const renderView = () => {
    switch (activeView) {
      case 'chat':
        return <ChatView />;
      case 'image':
        return <ImageView />;
      default:
        return <ChatView />;
    }
  };

  const NavButton: React.FC<{ view: View; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
        activeView === view
          ? 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30'
          : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0a0a0a] text-gray-200 font-sans">
      <header className="flex items-center justify-between p-4 border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <KetraLogo className="h-8 w-8 text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold text-white tracking-wider">KETRA</h1>
            <p className="text-xs text-gray-500">Exagemism Core: EEE.EE3.2</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 p-1 bg-gray-800/50 rounded-lg">
          <NavButton view="chat" label="Bate-papo" icon={<ChatIcon className="h-5 w-5" />} />
          <NavButton view="image" label="Gerar Imagem" icon={<ImageIcon className="h-5 w-5" />} />
        </nav>
      </header>
      <main className="flex-1 flex flex-col">
        {renderView()}
      </main>
      <footer className="p-4 text-center text-xs text-gray-500 border-t border-gray-800/50 bg-gray-900/20">
        desenvolvido no brasil por sebast NG 2025
      </footer>
    </div>
  );
};

export default App;