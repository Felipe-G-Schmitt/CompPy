
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-[100]">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <h2 className="text-slate-500 font-medium text-sm animate-pulse">Sincronizando Preços...</h2>
    </div>
  );
};
