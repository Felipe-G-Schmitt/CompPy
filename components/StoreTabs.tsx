
import React from 'react';

interface StoreTabsProps {
  stores: string[];
  selected: string;
  onSelect: (store: string) => void;
}

export const StoreTabs: React.FC<StoreTabsProps> = ({ stores, selected, onSelect }) => {
  return (
    <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar -mx-4 px-4 snap-x">
      {stores.map((store) => (
        <button
          key={store}
          onClick={() => onSelect(store)}
          className={`
            snap-start whitespace-nowrap px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all active:scale-95
            ${selected === store 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 ring-4 ring-indigo-600/10' 
              : 'bg-white text-slate-500 border border-slate-200'}
          `}
        >
          {store}
        </button>
      ))}
    </div>
  );
};
