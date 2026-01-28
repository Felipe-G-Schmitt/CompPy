
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

  const profit = (product.precoVenda || 0) - (product.precoCusto || 0);

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200/60 transition-colors">
      {/* Badge da Loja e Preço em Dólar */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {product.loja || 'LOJA'}
          </span>
        </div>
        <div className="bg-slate-900 px-3 py-1 rounded-xl shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 mr-1.5 uppercase">USD</span>
          <span className="text-sm font-black text-white leading-none">{formatUSD(product.valorDolar)}</span>
        </div>
      </div>
      
      {/* Anúncio - Agora SEMpre completo (sem line-clamp) */}
      <h3 className="text-[15px] font-bold text-slate-800 leading-tight mb-4">
        {product.anuncio || 'Produto sem descrição'}
      </h3>

      {/* Grid de Preços em Real */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
          <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Custo (BRL)</span>
          <span className="text-sm font-black text-slate-700">{formatBRL(product.precoCusto)}</span>
        </div>
        
        <div className="bg-emerald-500/5 rounded-2xl p-3.5 border border-emerald-500/10">
          <span className="block text-[9px] text-emerald-500 font-bold uppercase mb-1 tracking-wider">Venda (BRL)</span>
          <span className="text-sm font-black text-emerald-700">{formatBRL(product.precoVenda)}</span>
        </div>
      </div>

      {/* Rodapé do Card com Lucro Bruto */}
      <div className="flex justify-between items-center pt-3 border-t border-slate-50">
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Lucro Bruto</span>
          <span className="text-sm font-black text-emerald-600">
            +{formatBRL(profit)}
          </span>
        </div>
        
        {/* Botão removido conforme solicitado */}
        <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg">
           <span className="text-[10px] font-bold text-indigo-600 uppercase">Margem:</span>
           <span className="text-[10px] font-black text-indigo-700">
             {product.precoCusto > 0 ? (((product.precoVenda / product.precoCusto) - 1) * 100).toFixed(1) : 0}%
           </span>
        </div>
      </div>
    </div>
  );
};
