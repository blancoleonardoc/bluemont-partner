/* ── Bluemont · parsers ──────────────────────────────
   Positivador  → 41 colunas, 1 linha = 1 cliente em 1 snapshot (mensal)
   Diversificação → 14 colunas, 1 linha = 1 posição ativo-a-ativo
   Encoding UTF-8 com BOM, separador vírgula, CRLF. */

const POSITIVADOR_COLS = 41;
const DIVERSIFICACAO_COLS = 14;

const POSITIVADOR_NUMERIC = [
  'Aplicação_Financeira_Declarada_Ajustada',
  'Receita_no_Mês','Receita_Bovespa','Receita_Futuros',
  'Receita_RF_Bancários','Receita_RF_Privados','Receita_RF_Públicos',
  'Captação_Bruta_em_M','Resgate_em_M','Captação_Líquida_em_M1',
  'Captação_TED','Captação_ST','Captação_OTA','Captação_RF','Captação_TD','Captação_PREV',
  'Net_em_M_1','Net_Em_M1',
  'Net_Renda_Fixa','Net_Fundos_Imobiliários','Net_Renda_Variável',
  'Net_Fundos','Net_Financeiro','Net_Previdência','Net_Outros',
  'Receita_Aluguel','Receita_Complemento_Pacote_Corretagem',
];

const DIVERSIFICACAO_NUMERIC = ['Quantidade','Net_Em_M'];

// dd/mm/yyyy → Date
function parseBRDate(s) {
  if (!s || typeof s !== 'string') return null;
  const [d, m, y] = s.trim().split('/');
  if (!y) return null;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

// "1234.56" ou "" → number (empty → 0)
function parseNum(s) {
  if (s === null || s === undefined || s === '') return 0;
  const n = parseFloat(String(s).replace(/\s/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// detecta o schema pelo header
function detectType(headers) {
  const n = headers.length;
  if (n === POSITIVADOR_COLS || headers.includes('Net_Em_M1')) return 'positivador';
  if (n === DIVERSIFICACAO_COLS || headers.includes('NOM_FATOR_RISCO')) return 'diversificacao';
  if (headers.includes('Data_de_Vencimento') && headers.includes('Emissor')) return 'diversificacao';
  return null;
}

// normaliza uma linha Positivador
function normalizePositivador(row) {
  const out = { ...row };
  for (const k of POSITIVADOR_NUMERIC) out[k] = parseNum(row[k]);
  out.Data_Posição = parseBRDate(row.Data_Posição);
  out.Data_Atualização = parseBRDate(row.Data_Atualização);
  out.Data_de_Cadastro = parseBRDate(row.Data_de_Cadastro);
  out.Data_de_Nascimento = parseBRDate(row.Data_de_Nascimento);
  out.ativou_flag = !!(row.Ativou_em_M_ && String(row.Ativou_em_M_).trim());
  out.evadiu_flag = !!(row.Evadiu_em_M_ && String(row.Evadiu_em_M_).trim());
  out.operou_bolsa  = !!(row.Operou_Bolsa_ && String(row.Operou_Bolsa_).trim());
  out.operou_fundo  = !!(row.Operou_Fundo_ && String(row.Operou_Fundo_).trim());
  out.operou_rf     = !!(row.Operou_Renda_Fixa_ && String(row.Operou_Renda_Fixa_).trim());
  return out;
}

function normalizeDiversificacao(row) {
  const out = { ...row };
  for (const k of DIVERSIFICACAO_NUMERIC) out[k] = parseNum(row[k]);
  out.Data_Posição = parseBRDate(row.Data_Posição);
  out.Data_Atualização = parseBRDate(row.Data_Atualização);
  out.Data_de_Vencimento = parseBRDate(row.Data_de_Vencimento);
  return out;
}

// parse um File com PapaParse, retorna {type, rows, meta}
function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      encoding: 'UTF-8',
      transformHeader: h => h.replace(/^\uFEFF/, '').trim(),
      complete: (res) => {
        const headers = res.meta.fields || [];
        const type = detectType(headers);
        if (!type) return reject(new Error('schema desconhecido: ' + headers.slice(0, 3).join(',')));
        if (res.data.length === 0) return reject(new Error('arquivo vazio'));
        const rows = type === 'positivador'
          ? res.data.map(normalizePositivador)
          : res.data.map(normalizeDiversificacao);
        const dataPos = rows[0]?.Data_Posição;
        resolve({ type, rows, dataPosicao: dataPos, filename: file.name });
      },
      error: reject,
    });
  });
}

// merge múltiplos positivadores em uma lista única, ordenada por Data_Posição
function mergePositivadores(datasets) {
  const all = [].concat(...datasets.map(d => d.rows));
  all.sort((a, b) => (a.Data_Posição?.getTime() || 0) - (b.Data_Posição?.getTime() || 0));
  return all;
}

// datas únicas de snapshot, ordenadas
function snapshotDates(rows) {
  const set = new Set();
  for (const r of rows) if (r.Data_Posição) set.add(r.Data_Posição.getTime());
  return [...set].sort((a, b) => a - b).map(t => new Date(t));
}

const fmtDateBR = (d) => d ? d.toLocaleDateString('pt-BR') : '—';
const fmtDateShort = (d) => d ? d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '') : '—';
