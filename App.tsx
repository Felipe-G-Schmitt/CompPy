
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ApiResponse, Product } from './types';
import { Header } from './components/Header';
import { StoreTabs } from './components/StoreTabs';
import { ProductCard } from './components/ProductCard';
import { SearchBar } from './components/SearchBar';
import { Loader } from './components/Loader';

export default function App() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [realtimeQuote, setRealtimeQuote] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('Todas');

  const fetchRealtimeDollar = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Retorne apenas o valor numérico da cotação do dólar para real brasileiro (USD/BRL) agora. Exemplo: 5.85.',
        config: { tools: [{ googleSearch: {} }] },
      });
      
      const match = response.text?.match(/\d+[.,]\d+/);
      if (match) {
        const val = parseFloat(match[0].replace(',', '.'));
        setRealtimeQuote(val);
        console.log('%c[CAMBIO] Gemini:', 'color: #4f46e5; font-weight: bold', val);
        return val;
      }
    } catch (err) {
      console.error("[ERRO] Gemini Falhou:", err);
    }
    return null;
  };

  const processResponse = (rawJson: any, source: string) => {
    console.log(`%c[API] Resposta de ${source}:`, 'color: #10b981; font-weight: bold', rawJson);
    
    if (rawJson && rawJson.produtos && Array.isArray(rawJson.produtos)) {
      if (rawJson.produtos.length > 0) {
        const first = rawJson.produtos[0];
        console.log('%c[VALIDAÇÃO] Campos detectados no primeiro produto:', 'color: #f59e0b; font-weight: bold', {
          anuncio: first.anuncio,
          loja: first.loja,
          valorDolar: first.valorDolar,
          precoCusto: first.precoCusto,
          precoVenda: first.precoVenda
        });
      }
      setData(rawJson);
      setError(null);
      return true;
    }
    console.warn(`%c[AVISO] Dados de ${source} não possuem o formato esperado.`, 'color: #f59e0b');
    return false;
  };

  const fetchData = async () => {
    setLoading(true);
    const apiUrl = 'https://comppyrender.onrender.com/api/precos';
    
    const strategies = [
      {
        name: 'Direto',
        exec: async () => {
          const res = await fetch(apiUrl);
          if (!res.ok) throw new Error(`Status ${res.status}`);
          return await res.json();
        }
      },
      {
        name: 'AllOrigins Proxy',
        exec: async () => {
          const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}&t=${Date.now()}`);
          if (!res.ok) throw new Error(`Status ${res.status}`);
          const json = await res.json();
          return JSON.parse(json.contents);
        }
      },
      {
        name: 'CorsProxy.io',
        exec: async () => {
          const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(apiUrl)}`);
          if (!res.ok) throw new Error(`Status ${res.status}`);
          return await res.json();
        }
      }
    ];

    for (const strategy of strategies) {
      try {
        console.log(`%c[FETCH] Tentando via ${strategy.name}...`, 'color: #0ea5e9');
        const result = await strategy.exec();
        if (processResponse(result, strategy.name)) {
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.warn(`%c[FALHA] ${strategy.name}: ${err.message}`, 'color: #ef4444');
      }
    }

    setError('Não foi possível carregar os dados. O servidor da API pode estar offline.');
    setLoading(false);
  };

  useEffect(() => {
    fetchRealtimeDollar();
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    return data.produtos.filter((p) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (p.anuncio?.toLowerCase().includes(query)) || (p.loja?.toLowerCase().includes(query));
      const matchesStore = selectedStore === 'Todas' || p.loja === selectedStore;
      return matchesSearch && matchesStore;
    });
  }, [data, searchQuery, selectedStore]);

  const stores = useMemo(() => {
    if (!data) return ['Todas'];
    const uniqueStores = Array.from(new Set(data.produtos.map((p) => p.loja).filter(Boolean)));
    return ['Todas', ...uniqueStores];
  }, [data]);

  if (loading && !data) return <Loader />;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Header 
        cotacaoApi={data?.cotacaoDolar || 0} 
        cotacaoRealtime={realtimeQuote}
        lastUpdate={data?.atualizadoEm}
      />
      
      <main className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        
        <StoreTabs 
          stores={stores} 
          selected={selectedStore} 
          onSelect={setSelectedStore} 
        />

        <div className="flex justify-between items-center text-[10px] text-slate-400 mb-2 px-1">
          <span className="font-bold uppercase tracking-wider">
            {filteredProducts.length} ITENS LISTADOS
          </span>
          <button 
            onClick={() => { fetchData(); fetchRealtimeDollar(); }} 
            className="flex items-center gap-1 text-indigo-600 font-black hover:opacity-70"
          >
            SINCRONIZAR AGORA
          </button>
        </div>

        {error ? (
          <div className="bg-white border-2 border-slate-100 p-10 rounded-[40px] text-center shadow-xl shadow-slate-200/50">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-black text-lg mb-2">Erro de Conexão</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4">{error}</p>
            <button 
              onClick={fetchData}
              className="bg-indigo-600 text-white w-full py-4 rounded-2xl text-sm font-black shadow-lg shadow-indigo-200 active:scale-[0.97] transition-all"
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((product, idx) => (
              <ProductCard key={`${product.loja}-${idx}`} product={product} />
            ))}
            {filteredProducts.length === 0 && (
              <div className="py-20 text-center opacity-40">
                <p className="font-bold text-slate-500">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
