/* ── CRM ────────────────────────────────────────────── */

const SEED_CLIENTES = [
  { id: 'c1', nome: 'Ricardo Mendes',     email: 'ricardo.mendes@exemplo.com',    custodia: 4_200_000, ultima: '2026-04-10', tag: 'private' },
  { id: 'c2', nome: 'Helena Vasconcelos',  email: 'helena.v@exemplo.com',          custodia: 2_850_000, ultima: '2026-04-08', tag: 'varejo+' },
  { id: 'c3', nome: 'Bruno Tavares',       email: 'b.tavares@exemplo.com',         custodia: 1_120_000, ultima: '2026-03-29', tag: 'varejo' },
  { id: 'c4', nome: 'Amanda Pires',        email: 'amanda.pires@exemplo.com',      custodia: 6_780_000, ultima: '2026-04-12', tag: 'private' },
  { id: 'c5', nome: 'Carlos Pedroso',      email: 'c.pedroso@exemplo.com',         custodia: 890_000,   ultima: '2026-03-22', tag: 'varejo' },
  { id: 'c6', nome: 'Júlia Moraes',        email: 'julia.moraes@exemplo.com',      custodia: 3_400_000, ultima: '2026-04-01', tag: 'varejo+' },
  { id: 'c7', nome: 'Sérgio Albuquerque',  email: 'sergio.alb@exemplo.com',        custodia: 9_150_000, ultima: '2026-04-11', tag: 'private' },
];

function getClientes() {
  let list = loadJSON(STORE.clientes, null);
  if (!list) {
    list = SEED_CLIENTES.slice();
    saveJSON(STORE.clientes, list);
  }
  return list;
}

function saveClientes(list) { saveJSON(STORE.clientes, list); }

function renderClientesTable(filter = '') {
  const tbody = document.getElementById('clientes-tbody');
  const list = getClientes().filter(c =>
    !filter || c.nome.toLowerCase().includes(filter.toLowerCase()) || c.email.toLowerCase().includes(filter.toLowerCase())
  );
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem">nenhum cliente encontrado</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td><strong>${c.nome}</strong></td>
      <td style="color:var(--muted)">${c.email}</td>
      <td>${fmtBRLk(c.custodia)}</td>
      <td style="color:var(--muted)">${new Date(c.ultima).toLocaleDateString('pt-BR')}</td>
      <td><span class="tag">${c.tag}</span></td>
    </tr>
  `).join('');
}

function initCRM() {
  renderClientesTable();

  document.getElementById('search-clientes').addEventListener('input', (e) => {
    renderClientesTable(e.target.value);
  });

  const modal = document.getElementById('modal-cliente');
  document.getElementById('btn-novo-cliente').addEventListener('click', () => modal.classList.add('open'));
  document.getElementById('btn-cancel-cliente').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  document.getElementById('form-cliente').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const novo = {
      id: 'c' + Date.now(),
      nome: f.nome.value.trim(),
      email: f.email.value.trim(),
      custodia: Number(f.custodia.value) || 0,
      ultima: new Date().toISOString().slice(0, 10),
      tag: f.tag.value,
    };
    const list = getClientes();
    list.unshift(novo);
    saveClientes(list);
    f.reset();
    modal.classList.remove('open');
    renderClientesTable(document.getElementById('search-clientes').value);
  });
}
