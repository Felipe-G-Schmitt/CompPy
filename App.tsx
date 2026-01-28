
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
  const [normalizing, setNormalizing] = useState(false);
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
        return val;
      }
    } catch (err) {
      console.error("Gemini Falhou:", err);
    }
    return null;
  };

  const normalizeAndColorizeProducts = async (products: Product[]) => {
    setNormalizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const productsToProcess = products.filter(p => p.anuncio.toLowerCase().includes('iphone'));
      
      if (productsToProcess.length === 0) {
        setNormalizing(false);
        return products;
      }

      const titles = productsToProcess.map(p => p.anuncio).join('\n');

      const prompt = `Sua função agora é DUPLA: Normalizar títulos e Identificar a COR HEX.

REGRAS DE NORMALIZAÇÃO:
1. Formato: Apple iPhone <MODELO> <ARMAZENAMENTO>/<RAM opcional> <COR> <OBSERVAÇÃO opcional>
2. Manter: "Apple iPhone", Modelo, Armazenamento, RAM (se explícito), Cor e Observações entre parênteses.
3. REMOVER: Códigos (A2633, etc), termos técnicos irrelevantes (Tela, MP, Esim), tamanho de tela.
4. Se houver hífen "-" separando a cor, manter apenas a cor após o hífen.

REGRAS DE IDENTIFICAÇÃO DE COR:
Identifique a COR presente no título original e retorne o HEX correspondente baseado neste mapeamento:
- Midnight, black, preto → #2B2B2B
- Starlight, white, branco, silver, prata → #F5F5F5
- Azul, blue, ultramarine, ultramarino, deep blue, azul nevoa, azul intenso → #4D97FF
- Rosa, pink, lavander, lavanda → #FF8EF3
- Green, verde, teal, salvia, sage → #0BD867
- Yellow → #FFDC5B
- Cosmic Orange, laranja cosmico, laranja → #FFA84F
- Outros/Não identificado → #E0E0E0

Para cada entrada, retorne exatamente: Título Normalizado | #HEX
Retorne uma linha por produto, na mesma ordem de entrada. Não explique nada.

ENTRADA:
${titles}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const lines = response.text?.trim().split('\n') || [];
      
      let processedIndex = 0;
      const updatedProducts = products.map(p => {
        if (p.anuncio.toLowerCase().includes('iphone') && lines[processedIndex]) {
          const line = lines[processedIndex].trim();
          processedIndex++;
          
          const parts = line.split('|');
          if (parts.length >= 2) {
            return { 
              ...p, 
              anuncio: parts[0].trim(), 
              corHex: parts[1].trim() 
            };
          }
        }
        return p;
      });

      setNormalizing(false);
      return updatedProducts;
    } catch (err) {
      console.error("Erro no processamento IA:", err);
      setNormalizing(false);
      return products;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const apiUrl = 'https://comppyrender.onrender.com/api/precos';
    
    const proxies = [
      apiUrl,
      `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}&t=${Date.now()}`,
      `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`
    ];

    for (const url of proxies) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        
        let json;
        if (url.includes('allorigins')) {
          const proxyRes = await res.json();
          json = JSON.parse(proxyRes.contents);
        } else {
          json = await res.json();
        }

        if (json && json.produtos) {
          setData(json);
          
          const processedProducts = await normalizeAndColorizeProducts(json.produtos);
          setData({ ...json, produtos: processedProducts });
          setError(null);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn(`Falha no fetch: ${url}`);
      }
    }

    setError('Não foi possível sincronizar os preços agora.');
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
    <div className="min-h-screen bg-slate-50 safe-bottom">
      <Header 
        cotacaoApi={data?.cotacaoDolar || 0} 
        cotacaoRealtime={realtimeQuote}
        lastUpdate={data?.atualizadoEm}
      />
      
      <main className="px-4 pt-5 pb-12 space-y-5 max-w-2xl mx-auto">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        
        <StoreTabs 
          stores={stores} 
          selected={selectedStore} 
          onSelect={setSelectedStore} 
        />

        <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span className="font-black uppercase tracking-widest bg-slate-200/50 px-2 py-1 rounded-md">
              {filteredProducts.length} ITENS ENCONTRADOS
            </span>
            {normalizing && (
              <span className="flex items-center gap-1 text-indigo-500 font-bold animate-pulse">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                IA PROCESSANDO...
              </span>
            )}
          </div>
          <button 
            onClick={() => { fetchData(); fetchRealtimeDollar(); }} 
            className="flex items-center gap-1 text-indigo-600 font-black uppercase tracking-tighter"
          >
            Sincronizar
          </button>
        </div>

        {error ? (
          <div className="bg-white border-2 border-slate-100 p-10 rounded-[40px] text-center shadow-sm">
            <p className="text-slate-500 text-sm mb-8">{error}</p>
            <button 
              onClick={fetchData}
              className="bg-indigo-600 text-white w-full py-4 rounded-2xl font-black"
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
              <div className="py-20 text-center opacity-30">
                <p className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Nenhum produto</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
