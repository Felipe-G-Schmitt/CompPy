
import React from 'react';

interface HeaderProps {
  cotacaoApi: number;
  cotacaoRealtime: number | null;
  lastUpdate?: string;
}

export const Header: React.FC<HeaderProps> = ({ cotacaoApi, cotacaoRealtime, lastUpdate }) => {
  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 3
  }).format(val);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return null;
    }
  };

  const formattedUpdate = formatDateTime(lastUpdate);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      {/* Barra de Atualização Superior */}
      {formattedUpdate && (
        <div className="bg-indigo-600/5 border-b border-indigo-600/10 py-1 text-center">
          <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-[0.1em]">
            Base de dados atualizada em: <span className="font-black">{formattedUpdate}</span>
          </p>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-lg font-black tracking-tighter text-slate-900 uppercase">COMPPY</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">LIVE USD</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Câmbio Mercado (Gemini)</p>
            <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
              {cotacaoRealtime ? formatBRL(cotacaoRealtime) : (
                <span className="text-slate-200 animate-pulse">---</span>
              )}
            </p>
          </div>
          <div className="h-8 w-[1px] bg-slate-100"></div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Câmbio de Referência</p>
            <p className="text-lg font-black text-indigo-600 leading-none">
              {cotacaoApi > 0 ? formatBRL(cotacaoApi) : '---'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
