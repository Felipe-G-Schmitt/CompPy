const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const lojasPermitidas = [
  "megaeletronicos.com",
  "atacadoconnect.com",
  "nissei.com",
  "bestshop.com"
];

const urls = [
  "https://www.comprasparaguai.com.br/celular-apple-iphone-13-128gb_36398/?ordem=menor-preco",
  "https://www.comprasparaguai.com.br/celular-apple-iphone-14-128gb_43627/?ordem=menor-preco",
  "https://mobile.comprasparaguai.com.br/celular-apple-iphone-15-128gb_48875/?ordem=menor-preco",
  "https://mobile.comprasparaguai.com.br/celular-apple-iphone-16-128gb_55869/?ordem=menor-preco",
  "https://mobile.comprasparaguai.com.br/celular-apple-iphone-17-256gb_63988/?ordem=menor-preco",
  "https://www.comprasparaguai.com.br/celular-apple-iphone-17-pro-256gb_63989/?ordem=menor-preco",
  "https://www.comprasparaguai.com.br/celular-apple-iphone-17-pro-512gb_63990/?ordem=menor-preco",
  "https://www.comprasparaguai.com.br/celular-apple-iphone-17-pro-max-256gb_64041/?ordem=menor-preco",
  "https://www.comprasparaguai.com.br/celular-apple-iphone-17-pro-max-512gb_64042/?ordem=menor-preco",
  "https://www.comprasparaguai.com.br/tablet-apple-ipad-11a-geracao-2025-128gb-11_59111/?ordem=menor-preco",
  "https://www.comprasparaguai.com.br/tablet-apple-ipad-11a-geracao-2025-128gb-11-5g_66624/?ordem=menor-preco"
];

function formatarNomeLoja(url) {
  return url
    .replace(/^https?:\/\//, "")
    .replace("www.", "")
    .split("/")[0]
    .split(".")[0]
    .replace(/(^|\s)\S/g, l => l.toUpperCase());
}

async function buscarCotacaoDolar() {
  const response = await axios.get(
    "https://economia.awesomeapi.com.br/json/last/USD-BRL",
    { timeout: 10000 }
  );

  const dolar = parseFloat(response.data?.USDBRL?.bid);

  if (!dolar || isNaN(dolar)) {
    throw new Error("Não foi possível obter a cotação do dólar");
  }

  const dolarFinal = dolar + 0.15;

  console.log(
    `💱 Dólar: ${dolar.toFixed(2)} → com taxa: ${dolarFinal.toFixed(2)}`
  );

  return dolarFinal;
}

async function buscarPrecos(url, dolarFinal) {
  console.log(`\n🔎 Buscando: ${url}`);

  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "pt-BR,pt;q=0.9"
    },
    timeout: 15000
  });

  console.log(`   ↳ HTTP ${response.status} | HTML recebido: ${response.data.length} chars`);

  const $ = cheerio.load(response.data);
  const dados = [];

  const itens = $(".promocao-produtos-item-text");
  console.log(`   ↳ Itens encontrados (.promocao-produtos-item-text): ${itens.length}`);

  if (itens.length === 0) {
    // Se zero itens, o seletor provavelmente mudou. Loga alguns sinais do HTML.
    console.log(`   ⚠️  Nenhum item. Diagnóstico do HTML:`);
    console.log(`      - contém "promocao-produtos-item-text"? ${response.data.includes("promocao-produtos-item-text")}`);
    console.log(`      - contém "promocao-item-preco-oferta"? ${response.data.includes("promocao-item-preco-oferta")}`);
    console.log(`      - contém "store-image"? ${response.data.includes("store-image")}`);
    console.log(`      - contém "captcha" / "cloudflare"? ${/captcha|cloudflare|cf-browser/i.test(response.data)}`);
    console.log(`      - <title>: ${$("title").text().trim().slice(0, 120)}`);
  }

  itens.each((i, el) => {
    const container = $(el);

    const anuncio = container
      .find(".promocao-item-nome a")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const precoTexto = container
      .find(".promocao-item-preco-oferta strong")
      .first()
      .text()
      .trim();

    const lojaLink = container
      .find("img.store-image")
      .closest("a")
      .attr("href");

    console.log(
      `   [item ${i}] anuncio=${anuncio ? "OK" : "VAZIO"} | preco="${precoTexto || "VAZIO"}" | loja=${lojaLink || "VAZIO"}`
    );

    if (!anuncio || !precoTexto || !lojaLink) {
      console.log(`      ✗ descartado: campo obrigatório vazio`);
      return;
    }
    if (!lojasPermitidas.some(l => lojaLink.includes(l))) {
      console.log(`      ✗ descartado: loja não permitida`);
      return;
    }

    const precoDolar = parseFloat(
      precoTexto.replace("US$", "").replace(".", "").replace(",", ".")
    );

    const precoCusto = precoDolar * 1.085 * dolarFinal;
    const precoCustoIpad = precoDolar * 1.18 * dolarFinal;
    const titulo = anuncio.toLowerCase();
    let precoVenda = precoCusto;

    if (
      titulo.includes("iphone 13") ||
      titulo.includes("iphone 14") ||
      titulo.includes("iphone 15") ||
      titulo.includes("iphone 16")
    ) {
      precoVenda = precoCusto * 1.15;
    } 
    else if (titulo.includes("ipad")) {
      precoVenda = precoCustoIpad * 1.2;
    } 
    else if (titulo.includes("iphone 17 pro max")) {
      precoVenda = precoCusto + 1000;
    } 
    else if (
      titulo.includes("iphone 17 pro") ||
      titulo.includes("iphone 17")
    ) {
      precoVenda = precoCusto + 800;
    }

    console.log(`      ✓ aceito: ${anuncio} → US$ ${precoDolar}`);

    dados.push({
      anuncio,
      loja: formatarNomeLoja(lojaLink),
      valorDolar: precoDolar,
      precoCusto: Number(precoCusto.toFixed(2)),
      precoVenda: Number(precoVenda.toFixed(2))
    });
  });

  console.log(`   ↳ Aceitos nesta URL: ${dados.length}`);
  return dados;
}

(async () => {
  try {
    const dolarFinal = await buscarCotacaoDolar();

    let produtos = [];

    for (const url of urls) {
      try {
        const resultado = await buscarPrecos(url, dolarFinal);
        produtos = produtos.concat(resultado);
      } catch (e) {
        console.error(`   ❌ Falha nesta URL: ${e.response?.status || ""} ${e.message}`);
      }
    }

    const jsonFinal = {
      atualizadoEm: new Date().toISOString(),
      cotacaoDolar: dolarFinal,
      totalProdutos: produtos.length,
      produtos
    };

    const caminho = path.join(__dirname, "precos.json");
    fs.writeFileSync(caminho, JSON.stringify(jsonFinal, null, 2));

    console.log(`\n✅ precos.json atualizado — ${produtos.length} produtos no total`);
  } catch (erro) {
    console.error("❌ Erro no scraping:", erro.message);
  }
})();