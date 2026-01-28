
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formatBRL = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const formatUSD = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 active:scale-[0.98] transition-all relative overflow-hidden">
      {/* Loja Badge */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
           <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            {product.loja || 'LOJA DESCONHECIDA'}
          </span>
        </div>
        <div className="bg-slate-900 px-3 py-1.5 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 mr-1.5">USD</span>
          <span className="text-sm font-black text-white">{formatUSD(product.valorDolar)}</span>
        </div>
      </div>
      
      {/* Anúncio */}
      <h3 className="text-base font-bold text-slate-800 leading-snug mb-6 line-clamp-2 min-h-[2.8rem]">
        {product.anuncio || 'Produto sem descrição'}
      </h3>

      {/* Preços: Custo e Venda */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Custo (BRL)</span>
          <span className="text-sm font-black text-slate-700">{formatBRL(product.precoCusto)}</span>
        </div>
        
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <span className="block text-[10px] text-emerald-500 font-bold uppercase mb-1 tracking-wider">Venda (BRL)</span>
          <span className="text-sm font-black text-emerald-700">{formatBRL(product.precoVenda)}</span>
        </div>
      </div>

      {/* Margem e Ações */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-50">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Lucro Bruto</span>
          <span className="text-xs font-black text-emerald-600">
            +{formatBRL((product.precoVenda || 0) - (product.precoCusto || 0))}
          </span>
        </div>
        
        <button className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 active:bg-indigo-600 active:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};
