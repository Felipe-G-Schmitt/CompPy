
import React from 'react';

interface StoreTabsProps {
  stores: string[];
  selected: string;
  onSelect: (store: string) => void;
}

export const StoreTabs: React.FC<StoreTabsProps> = ({ stores, selected, onSelect }) => {
  return (
    <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar -mx-4 px-4">
      {stores.map((store) => (
        <button
          key={store}
          onClick={() => onSelect(store)}
          className={`
            whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all
            ${selected === store 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
              : 'bg-white text-slate-500 border border-slate-200'}
          `}
        >
          {store}
        </button>
      ))}
    </div>
  );
};
