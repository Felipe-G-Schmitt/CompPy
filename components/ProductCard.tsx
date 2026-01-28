
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

  // Cor padrão se não houver identificação
  const accentColor = product.corHex || '#E0E0E0';
  
  // Determina se a cor é clara para ajustar contraste do texto no círculo
  const isLightColor = accentColor.toUpperCase() === '#F5F5F5' || accentColor.toUpperCase() === '#E0E0E0';

  return (
    <div 
      className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200/60 transition-all relative overflow-hidden"
      style={{ borderLeft: `6px solid ${accentColor}` }}
    >
      {/* Badge da Loja e Preço em Dólar */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full shadow-inner border border-black/5" 
            style={{ backgroundColor: accentColor }}
          ></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {product.loja || 'LOJA'}
          </span>
        </div>
        <div className="bg-slate-900 px-3 py-1 rounded-xl shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 mr-1.5 uppercase">USD</span>
          <span className="text-sm font-black text-white leading-none">{formatUSD(product.valorDolar)}</span>
        </div>
      </div>
      
      {/* Anúncio */}
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
        
        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
           <span className="text-[10px] font-bold text-slate-500 uppercase">Margem:</span>
           <span className="text-[10px] font-black text-indigo-600">
             {product.precoCusto > 0 ? (((product.precoVenda / product.precoCusto) - 1) * 100).toFixed(1) : 0}%
           </span>
        </div>
      </div>
    </div>
  );
};
