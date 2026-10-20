const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const DEBUG_HTML = true; // salva o HTML recebido quando nenhum item é encontrado

const lojasPermitidas = [
  "megaeletronicos.com",
  "atacadoconnect.com",
  "nissei.com",
  "bestshop.com"
];

// O link da loja (a.btn-store-redirect) sumiu do HTML, então filtramos pelo NOME da loja (alt da imagem)
const nomesPermitidos = ["mega eletronicos", "mega eletro", "atacado connect", "nissei", "best shop"];
const normalizar = t =>
  (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

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

// ---------- helpers de log ----------
const ts = () => new Date().toISOString().split("T")[1].replace("Z", "");
const log = (...a) => console.log(`[${ts()}]`, ...a);
const warn = (...a) => console.warn(`[${ts()}] ⚠️ `, ...a);
const err = (...a) => console.error(`[${ts()}] ❌`, ...a);

function formatarNomeLoja(url) {
  return url
    .replace(/^https?:\/\//, "")
    .replace("www.", "")
    .split("/")[0]
    .split(".")[0]
    .replace(/(^|\s)\S/g, l => l.toUpperCase());
}

async function buscarCotacaoDolar() {
  const apiUrl = "https://economia.awesomeapi.com.br/json/last/USD-BRL";
  log("💱 Buscando cotação do dólar:", apiUrl);

  const inicio = Date.now();
  const response = await axios.get(apiUrl, { timeout: 10000 });
  log(`💱 Resposta da API em ${Date.now() - inicio}ms | status ${response.status}`);
  log("💱 Corpo bruto:", JSON.stringify(response.data));

  const dolar = parseFloat(response.data?.USDBRL?.bid);
  log("💱 bid parseado:", dolar);

  if (!dolar || isNaN(dolar)) {
    throw new Error("Não foi possível obter a cotação do dólar");
  }

  const dolarFinal = dolar + 0.15;
  log(`💱 Dólar: ${dolar.toFixed(2)} → com taxa: ${dolarFinal.toFixed(2)}`);
  return dolarFinal;
}

async function buscarPrecos(url, dolarFinal, idx) {
  log(`\n━━━━━ [${idx + 1}/${urls.length}] ${url}`);

  const inicio = Date.now();
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "pt-BR,pt;q=0.9"
    },
    timeout: 15000,
    validateStatus: () => true // não lança erro em 403/404/etc, a gente loga
  });

  const html = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
  log(`🌐 status ${response.status} | ${Date.now() - inicio}ms | ${html.length} bytes`);
  log("🌐 content-type:", response.headers["content-type"]);
  log("🌐 server:", response.headers["server"], "| cf-ray:", response.headers["cf-ray"] || "-");

  if (response.status !== 200) {
    warn(`Status diferente de 200 (${response.status}). Possível bloqueio ou URL mudou.`);
    log("🌐 Início do corpo:", html.slice(0, 300).replace(/\s+/g, " "));
    return [];
  }

  const htmlLower = html.toLowerCase();
  if (
    htmlLower.includes("captcha") ||
    htmlLower.includes("cloudflare") ||
    htmlLower.includes("just a moment") ||
    htmlLower.includes("access denied")
  ) {
    warn("Resposta parece ser página de bloqueio/captcha/Cloudflare!");
  }

  const $ = cheerio.load(html);
  log("📄 <title>:", $("title").text().trim());

  const itens = $(".promocao-produtos-item-text");
  log(`🔎 Elementos '.promocao-produtos-item-text': ${itens.length}`);

  // Diagnóstico: se o seletor principal não achou nada, testa alternativas
  if (itens.length === 0) {
    warn("Seletor principal retornou 0. Testando seletores alternativos...");
    const candidatos = [
      ".promocao-produtos-item",
      ".promocao-item-nome",
      ".promocao-item-preco-oferta",
      "a.btn-store-redirect",
      "img.store-image",
      "[class*='promocao']",
      "[class*='produto']",
      "[class*='preco']",
      "[class*='store']"
    ];
    candidatos.forEach(sel => log(`   ${sel} → ${$(sel).length}`));

    // lista classes que contêm "promo" / "preco" / "store" pra achar o novo nome
    const classes = new Set();
    $("[class]").each((_, el) => {
      ($(el).attr("class") || "").split(/\s+/).forEach(c => {
        if (/promo|preco|price|store|loja|produto|item/i.test(c)) classes.add(c);
      });
    });
    log("   Classes parecidas encontradas:", [...classes].slice(0, 50).join(", ") || "(nenhuma)");

    if (DEBUG_HTML) {
      const arq = path.join(__dirname, `debug-${idx + 1}.html`);
      fs.writeFileSync(arq, html);
      log(`💾 HTML salvo em ${arq} para inspeção`);
    }
    return [];
  }

  const dados = [];
  const descartes = { semAnuncio: 0, semPreco: 0, semLink: 0, lojaNaoPermitida: 0, precoInvalido: 0 };
  const lojasVistas = {};

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

    const lojaLink = container.find("a.btn-store-redirect").first().attr("href");
    const lojaNome = container.find("img.store-image").first().attr("alt");

    log(
      `  #${i + 1} anuncio="${anuncio.slice(0, 50)}" | preco="${precoTexto}" | link="${(lojaLink || "").slice(0, 60)}" | alt="${lojaNome}"`
    );

    if (!anuncio) { descartes.semAnuncio++; log(`     ↳ descartado: sem anúncio`); return; }
    if (!precoTexto) { descartes.semPreco++; log(`     ↳ descartado: sem preço`); return; }
    if (!lojaNome || !lojaNome.trim()) { descartes.semLink++; log(`     ↳ descartado: sem nome da loja (img.store-image alt)`); return; }

    const nomeNorm = normalizar(lojaNome);
    lojasVistas[lojaNome.trim()] = (lojasVistas[lojaNome.trim()] || 0) + 1;

    if (!nomesPermitidos.some(n => nomeNorm.includes(n))) {
      descartes.lojaNaoPermitida++;
      log(`     ↳ descartado: loja não permitida (${lojaNome})`);
      return;
    }

    const precoDolar = parseFloat(
      precoTexto.replace("US$", "").replace(".", "").replace(",", ".")
    );

    if (isNaN(precoDolar)) {
      descartes.precoInvalido++;
      log(`     ↳ descartado: preço inválido após parse ("${precoTexto}")`);
      return;
    }

    const precoCusto = precoDolar * 1.085 * dolarFinal;
    const precoCustoIpad = precoDolar * 1.18 * dolarFinal;
    const titulo = anuncio.toLowerCase();
    let precoVenda = precoCusto;
    let regra = "nenhuma (preço = custo)";

    if (
      titulo.includes("iphone 13") ||
      titulo.includes("iphone 14") ||
      titulo.includes("iphone 15") ||
      titulo.includes("iphone 16")
    ) {
      precoVenda = precoCusto * 1.15;
      regra = "iPhone 13-16 (+15%)";
    } else if (titulo.includes("ipad")) {
      precoVenda = precoCustoIpad * 1.2;
      regra = "iPad (custo 1.18 + 20%)";
    } else if (titulo.includes("iphone 17 pro max")) {
      precoVenda = precoCusto + 1000;
      regra = "iPhone 17 Pro Max (+R$1000)";
    } else if (titulo.includes("iphone 17 pro") || titulo.includes("iphone 17")) {
      precoVenda = precoCusto + 800;
      regra = "iPhone 17 / Pro (+R$800)";
    }

    log(
      `     ✔ aceito | US$ ${precoDolar} | custo R$ ${precoCusto.toFixed(2)} | venda R$ ${precoVenda.toFixed(2)} | regra: ${regra}`
    );

    dados.push({
      anuncio,
      loja: lojaNome.trim(),
      valorDolar: precoDolar,
      precoCusto: Number(precoCusto.toFixed(2)),
      precoVenda: Number(precoVenda.toFixed(2))
    });
  });

  log(`📊 Resumo da URL: ${dados.length} aceitos de ${itens.length}`);
  log("📊 Descartes:", JSON.stringify(descartes));
  log("📊 Lojas vistas:", JSON.stringify(lojasVistas));

  return dados;
}

(async () => {
  const t0 = Date.now();
  log("🚀 Iniciando scraping");
  log("Node:", process.version, "| axios:", require("axios/package.json").version);

  try {
    const dolarFinal = await buscarCotacaoDolar();

    let produtos = [];
    const falhas = [];

    for (let i = 0; i < urls.length; i++) {
      try {
        const resultado = await buscarPrecos(urls[i], dolarFinal, i);
        produtos = produtos.concat(resultado);
        log(`➕ Total acumulado: ${produtos.length}`);
      } catch (e) {
        // Um erro numa URL não derruba o resto
        err(`Falha na URL ${i + 1}:`, e.code || "", e.message);
        if (e.response) log("   status:", e.response.status);
        falhas.push(urls[i]);
      }
    }

    const jsonFinal = {
      atualizadoEm: new Date().toISOString(),
      cotacaoDolar: dolarFinal,
      totalProdutos: produtos.length,
      produtos
    };

    const caminho = path.join(__dirname, "precos.json");
    log("💾 Gravando em:", caminho);

    if (produtos.length === 0) {
      warn("Nenhum produto encontrado — NÃO sobrescrevendo precos.json para não perder o último bom.");
    } else {
      fs.writeFileSync(caminho, JSON.stringify(jsonFinal, null, 2));
      log("✅ precos.json atualizado com dólar automático");
    }

    log(`🏁 Fim em ${((Date.now() - t0) / 1000).toFixed(1)}s | produtos: ${produtos.length} | URLs com falha: ${falhas.length}`);
    if (falhas.length) log("URLs com falha:", falhas);
  } catch (erro) {
    err("Erro geral no scraping:", erro.message);
    console.error(erro.stack);
  }
})();