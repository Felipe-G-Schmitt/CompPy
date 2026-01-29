
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
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('Todas');

  const fetchRealtimeDollar = async () => {
    try {
      // Inicialização segura conforme diretrizes
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Retorne apenas o valor numérico da cotação do dólar para real brasileiro (USD/BRL) agora. Exemplo: 5.85.',
        config: { 
          tools: [{ googleSearch: {} }] 
        },
      });
      
      const match = response.text?.match(/\d+[.,]\d+/);
      if (match) {
        const val = parseFloat(match[0].replace(',', '.'));
        setRealtimeQuote(val);
        return val;
      }
    } catch (err) {
      console.error("Gemini Falhou:", err);
    }
    return null;
  };

  const identifyColorHex = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes('midnight') || t.includes('black') || t.includes('preto')) return '#2B2B2B';
    if (t.includes('starlight') || t.includes('white') || t.includes('branco') || t.includes('silver') || t.includes('prata')) return '#F5F5F5';
    if (t.includes('azul') || t.includes('blue') || t.includes('ultramarine') || t.includes('ultramarino') || t.includes('deep blue') || t.includes('azul nevoa') || t.includes('azul intenso')) return '#4D97FF';
    if (t.includes('rosa') || t.includes('pink') || t.includes('lavander') || t.includes('lavanda')) return '#FF8EF3';
    if (t.includes('green') || t.includes('verde') || t.includes('teal') || t.includes('salvia') || t.includes('sage')) return '#0BD867';
    if (t.includes('yellow')) return '#FFDC5B';
    if (t.includes('cosmic orange') || t.includes('laranja cosmico') || t.includes('laranja')) return '#FFA84F';
    return '#E0E0E0';
  };

  const normalizeTitleInternally = (title: string): string => {
    if (!title.toLowerCase().includes('iphone')) return title;
    let result = "Apple iPhone";
    const modelMatch = title.match(/(?:iphone\s+)?(\d+(?:\s*(?:pro\s*max|pro|plus|mini|se))?)/i);
    const model = modelMatch ? modelMatch[1].trim() : "";
    if (model) result += " " + model;
    const storageRamMatch = title.match(/(\d+(?:GB|TB))(?:\/(\d+GB))?/i);
    if (storageRamMatch) {
      const storage = storageRamMatch[1].toUpperCase();
      const ram = storageRamMatch[2] ? `/${storageRamMatch[2].toUpperCase()}` : "";
      result += ` ${storage}${ram}`;
    }
    let color = "";
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      const potentialColor = parts[parts.length - 1].trim().split(' ')[0];
      color = potentialColor;
    } else {
      const colorKeywords = ['midnight', 'black', 'preto', 'starlight', 'white', 'branco', 'silver', 'prata', 'azul', 'blue', 'ultramarine', 'ultramarino', 'deep blue', 'azul nevoa', 'azul intenso', 'rosa', 'pink', 'lavander', 'lavanda', 'green', 'verde', 'teal', 'salvia', 'sage', 'yellow', 'cosmic orange', 'laranja'];
      for (const cw of colorKeywords) {
        if (new RegExp(`\\b${cw}\\b`, 'i').test(title)) { color = cw; break; }
      }
    }
    if (color) result += " " + color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
    const obsMatch = title.match(/\(([^)]+)\)/);
    if (obsMatch) result += ` (${obsMatch[1]})`;
    return result.replace(/\s+/g, ' ').trim();
  };

  const processProductsInternally = (products: Product[]) => {
    setProcessing(true);
    const updated = products.map(p => ({
      ...p,
      anuncio: normalizeTitleInternally(p.anuncio),
      corHex: identifyColorHex(p.anuncio)
    }));
    setProcessing(false);
    return updated;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const apiUrl = 'https://comppyrender.onrender.com/api/precos';
    
    // Lista de estratégias para contornar CORS e instabilidades
    const strategies = [
      { url: apiUrl, type: 'direct' },
      { url: `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}&t=${Date.now()}`, type: 'allorigins' },
      { url: `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`, type: 'corsproxy' }
    ];

    for (const strategy of strategies) {
      try {
        const res = await fetch(strategy.url);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        
        let json;
        if (strategy.type === 'allorigins') {
          const proxyRes = await res.json();
          json = JSON.parse(proxyRes.contents);
        } else {
          json = await res.json();
        }

        if (json && json.produtos) {
          const processed = processProductsInternally(json.produtos);
          setData({ ...json, produtos: processed });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn(`Falha na estratégia ${strategy.type}:`, err);
      }
    }

    setError('Servidor temporariamente indisponível. Tente sincronizar novamente.');
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
      const matchesSearch = p.anuncio.toLowerCase().includes(query) || p.loja.toLowerCase().includes(query);
      const matchesStore = selectedStore === 'Todas' || p.loja === selectedStore;
      return matchesSearch && matchesStore;
    });
  }, [data, searchQuery, selectedStore]);

  const stores = useMemo(() => {
    if (!data) return ['Todas'];
    const unique = Array.from(new Set(data.produtos.map(p => p.loja).filter(Boolean)));
    return ['Todas', ...unique];
  }, [data]);

  if (loading && !data) return <Loader />;

  return (
    <div className="min-h-screen bg-slate-50 safe-bottom">
      <Header cotacaoApi={data?.cotacaoDolar || 0} cotacaoRealtime={realtimeQuote} lastUpdate={data?.atualizadoEm} />
      
      <main className="px-4 pt-5 pb-12 space-y-5 max-w-2xl mx-auto">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <StoreTabs stores={stores} selected={selectedStore} onSelect={setSelectedStore} />

        {/* Card Informativo de Regras */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Regras de Negócio</h4>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black text-indigo-500 uppercase block mb-1">Modelos Base</span>
              <p className="text-[11px] text-slate-600 font-bold">Do iPhone 13 ao 16, todos são 128GB</p>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cálculo de Custo</span>
                <p className="text-[10px] text-slate-500 font-medium bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                  dolar + 8% * dolar referencia <br/>
                  <span className="text-[9px] opacity-70">(dolar para real + 0,15)</span>
                </p>
              </div>

              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cálculo de Lucro</span>
                <ul className="text-[10px] text-slate-500 font-medium space-y-1.5">
                  <li className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span>iPhone 13 ao 16</span>
                    <span className="font-bold text-slate-700">custo * 1,15</span>
                  </li>
                  <li className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span>iPhone 17 ao 17 Pro</span>
                    <span className="font-bold text-slate-700">custo + 800,00</span>
                  </li>
                  <li className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span>iPhone 17 Pro Max</span>
                    <span className="font-bold text-slate-700">custo + 1000,00</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-slate-200/50 px-2 py-1 rounded-md text-slate-500">
              {filteredProducts.length} ITENS
            </span>
            {processing && (
              <span className="flex items-center gap-1 text-indigo-500 text-[10px] font-bold animate-pulse">
                <span className="w-1 h-1 bg-indigo-500 rounded-full"></span> ORGANIZANDO
              </span>
            )}
          </div>
          <button onClick={() => { fetchData(); fetchRealtimeDollar(); }} className="text-[10px] text-indigo-600 font-black uppercase tracking-widest active:opacity-50">
            Sincronizar
          </button>
        </div>

        {error ? (
          <div className="bg-white border border-red-100 p-8 rounded-[32px] text-center shadow-sm">
            <p className="text-slate-500 text-xs mb-6">{error}</p>
            <button onClick={fetchData} className="bg-indigo-600 text-white w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest">Tentar Novamente</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((p, idx) => <ProductCard key={idx} product={p} />)}
            {!filteredProducts.length && <p className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nenhum item encontrado</p>}
          </div>
        )}
      </main>
    </div>
  );
}
