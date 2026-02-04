const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 NECESSÁRIO para POST funcionar
app.use(express.json({ limit: "5mb" }));

// 🔹 Health check
app.get("/", (_, res) => {
  res.send("API de preços online 🚀");
});

// 🔹 Retorna os preços
app.get("/api/precos", (req, res) => {
  const caminho = path.join(__dirname, "precos.json");

  if (!fs.existsSync(caminho)) {
    return res.status(404).json({
      erro: "Arquivo ainda não gerado",
      dica: "Envie dados para /api/atualizar primeiro"
    });
  }

  const dados = JSON.parse(fs.readFileSync(caminho, "utf-8"));
  res.json(dados);
});

// 🔹 Atualiza o JSON (chamado pelo scraping local)
app.post("/api/atualizar", (req, res) => {
  const caminho = path.join(__dirname, "precos.json");

  fs.writeFileSync(caminho, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});
