/* ── Serviços / Oportunidades ───────────────────────── */

const CATEGORIAS = [
  { id: 'credito',    label: 'crédito' },
  { id: 'seguros',    label: 'seguros' },
  { id: 'imoveis',    label: 'imóveis' },
  { id: 'consorcios', label: 'consórcios' },
  { id: 'cambio',     label: 'câmbio' },
  { id: 'outro',      label: 'outro' },
];

function getOpps() { return loadJSON(STORE.oportunidades, []); }
function saveOpps(list) { saveJSON(STORE.oportunidades, list); }

function populateClientesSelect() {
  const sel = document.getElementById('f-opp-cliente');
  const clientes = loadJSON(STORE.clientes, []);
  if (clientes.length === 0) {
    sel.innerHTML = '<option value="">— nenhum cliente cadastrado —</option>';
    return;
  }
  sel.innerHTML = clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function populateCategoriaSelect() {
  const sel = document.getElementById('f-opp-categoria');
  sel.innerHTML = CATEGORIAS.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
}

function renderOpps() {
  const list = getOpps();
  const clientes = loadJSON(STORE.clientes, []);
  const nomeCliente = id => (clientes.find(c => c.id === id)?.nome) || 'cliente removido';
  const wrap = document.getElementById('opps-list');

  if (list.length === 0) {
    wrap.innerHTML = `<p style="color:var(--muted);padding:1.5rem 0">nenhuma oportunidade cadastrada ainda. use o formulário acima.</p>`;
    return;
  }

  wrap.innerHTML = CATEGORIAS.map(cat => {
    const items = list.filter(o => o.categoria === cat.id);
    if (items.length === 0) return '';
    return `
      <div class="cat-group">
        <h3>${cat.label} <span class="count">${items.length}</span></h3>
        ${items.map(o => `
          <div class="opp-card">
            <div>
              <div class="opp-main">${nomeCliente(o.clienteId)} — ${o.descricao || '<em style="color:var(--muted)">sem descrição</em>'}</div>
              <div class="opp-meta">${new Date(o.data).toLocaleDateString('pt-BR')}</div>
            </div>
            <div style="display:flex;align-items:center;gap:0.6rem">
              <span class="opp-value">${fmtBRLk(Number(o.valor) || 0)}</span>
              <button class="opp-del" data-id="${o.id}" title="remover">×</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');

  wrap.querySelectorAll('.opp-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      saveOpps(getOpps().filter(o => o.id !== id));
      renderOpps();
    });
  });
}

function initServicos() {
  populateClientesSelect();
  populateCategoriaSelect();
  renderOpps();

  document.getElementById('form-opp').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const nova = {
      id: 'o' + Date.now(),
      clienteId: f.cliente.value,
      categoria: f.categoria.value,
      valor: Number(f.valor.value) || 0,
      descricao: f.descricao.value.trim(),
      data: new Date().toISOString(),
    };
    if (!nova.clienteId) { alert('cadastre um cliente antes.'); return; }
    const list = getOpps();
    list.unshift(nova);
    saveOpps(list);
    f.reset();
    renderOpps();
  });
}
