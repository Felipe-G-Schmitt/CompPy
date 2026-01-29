
import React from 'react';

interface StoreTabsProps {
  stores: string[];
  selected: string;
  onSelect: (store: string) => void;
}

export const StoreTabs: React.FC<StoreTabsProps> = ({ stores, selected, onSelect }) => {
  return (
    <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar -mx-4 px-4 snap-x">
      {stores.map((store) => (
        <button
          key={store}
          onClick={() => onSelect(store)}
          className={`
            snap-start whitespace-nowrap px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-95 border
            ${selected === store 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 border-indigo-600' 
              : 'bg-white text-slate-500 border-slate-200'}
          `}
        >
          {store}
        </button>
      ))}
    </div>
  );
};
