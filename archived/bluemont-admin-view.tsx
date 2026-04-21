// ARCHIVED — este componente será usado em admin.bluemont.com.br
// Contém: visão operacional completa da empresa (AUM, clientes, receita, ROA, mix, diversificação)
// Não deletar — mover para projeto bluemont-admin quando criado
//
// Código original preservado nos arquivos irmãos:
//   ./bluemont.html        — markup da aba (upload CSVs + 4 seções)
//   ./bluemont.js          — orquestrador (STATE, ECharts, init)
//   ./bluemont-parse.js    — parser de CSV Positivador/Diversificação (PapaParse)
//   ./bluemont-agg.js      — agregações: timeseries, mixAtual, Lorenz+HHI, churn, cross-sell, etc.
//
// Dependências externas via CDN: echarts, papaparse.
// Fontes de dados: XP Positivador (41 cols, snapshots mensais) + Diversificação (14 cols, ~27k rows).
//
// Para ressuscitar no bluemont-admin:
//   1. converter HTML → JSX (divs/sections permanecem, remover <html>/<head>)
//   2. converter vanilla JS em hooks React (useState pra STATE, useEffect pra init)
//   3. manter ECharts via wrapper (ex: echarts-for-react) ou importar direto
//   4. substituir inputs de upload por fetch direto do Supabase (tabelas equivalentes)

export default function BluemontAdminView() {
  return null; // placeholder — ver arquivos irmãos para restauração
}
