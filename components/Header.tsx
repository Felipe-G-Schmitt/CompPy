
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
    minimumFractionDigits: 2
  }).format(val);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return null;
    }
  };

  const formattedUpdate = formatDateTime(lastUpdate);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm pt-[env(safe-area-inset-top,0px)]">
      {/* Barra de Atualização Superior */}
      {formattedUpdate && (
        <div className="bg-indigo-600 py-1.5 px-4 text-center">
          <p className="text-[10px] font-black text-white uppercase tracking-wider">
            Última Atualização: <span className="opacity-90">{formattedUpdate}</span>
          </p>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-base font-black tracking-tighter text-slate-900 uppercase">COMPPY</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-emerald-600 uppercase">Live USD</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 shadow-inner">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Dólar Comercial</p>
            <p className="text-base font-black text-slate-900">
              {cotacaoRealtime ? formatBRL(cotacaoRealtime) : '---'}
            </p>
          </div>
          <div className="bg-indigo-600/5 p-2.5 rounded-2xl border border-indigo-600/10">
            <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Dólar Referência</p>
            <p className="text-base font-black text-indigo-600">
              {cotacaoApi > 0 ? formatBRL(cotacaoApi) : '---'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
