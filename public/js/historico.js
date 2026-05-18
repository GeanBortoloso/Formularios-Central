/**
 * Histórico Page - Lista, filtra e gerencia solicitações
 */
document.addEventListener('DOMContentLoaded', () => {
  let currentPage = 1;

  const tipoLabels = { EPI: 'EPI', LIMPEZA: 'Limpeza', USO_CONSUMO: 'Uso e Consumo' };
  const statusLabels = { PENDENTE: 'Pendente', APROVADO: 'Aprovado', RECUSADO: 'Recusado' };

  async function loadData(page = 1) {
    const tipo = document.getElementById('filtroTipo').value;
    const status = document.getElementById('filtroStatus').value;
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;

    const params = new URLSearchParams({ page, limit: 15 });
    if (tipo) params.set('tipo', tipo);
    if (status) params.set('status', status);
    if (dataInicio) params.set('data_inicio', dataInicio);
    if (dataFim) params.set('data_fim', dataFim);

    try {
      const res = await fetch(`/api/solicitacoes?${params}`);
      const data = await res.json();

      if (data.success) {
        renderTable(data.data);
        renderPagination(data.pagination);
        currentPage = data.pagination.page;
      }
    } catch (err) {
      showToast('Erro ao carregar dados.', 'error');
    }
  }

  function renderTable(rows) {
    const tbody = document.getElementById('historicoBody');
    const empty = document.getElementById('emptyState');
    const table = document.getElementById('tableWrap');

    if (rows.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    table.style.display = 'block';
    empty.style.display = 'none';

    tbody.innerHTML = rows.map((s) => {
      const date = new Date(s.created_at || s.createdAt).toLocaleDateString('pt-BR');
      const statusClass = s.status.toLowerCase();

      // Build action buttons based on current status
      let statusActions = '';
      if (s.status === 'PENDENTE') {
        statusActions = `
          <button class="btn btn-status btn-aprovar" onclick="updateStatus(${s.id}, 'APROVADO')" title="Aprovar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            Aprovar
          </button>
          <button class="btn btn-status btn-recusar" onclick="updateStatus(${s.id}, 'RECUSADO')" title="Recusar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Recusar
          </button>`;
      } else if (s.status === 'APROVADO') {
        statusActions = `
          <button class="btn btn-status btn-reverter" onclick="updateStatus(${s.id}, 'PENDENTE')" title="Reverter para pendente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            Reverter
          </button>`;
      } else if (s.status === 'RECUSADO') {
        statusActions = `
          <button class="btn btn-status btn-reverter" onclick="updateStatus(${s.id}, 'PENDENTE')" title="Reverter para pendente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            Reverter
          </button>`;
      }

      let anexoAction = '';
      if (s.anexo_url) {
        anexoAction = `
          <a href="${s.anexo_url}" target="_blank" class="btn btn-status btn-pdf" title="Ver Imagem Anexada">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Anexo
          </a>`;
      }

      return `<tr>
        <td style="font-weight:600;color:var(--text-primary)">${s.numero_pedido}</td>
        <td>${tipoLabels[s.tipo] || s.tipo}</td>
        <td>${s.solicitante}</td>
        <td>${s.setor}</td>
        <td style="text-align:center">${s.itens ? s.itens.length : 0}</td>
        <td>${date}</td>
        <td><span class="badge badge-${statusClass}">${statusLabels[s.status]}</span></td>
        <td>
          <div class="action-group">
            ${statusActions}
            ${anexoAction}
            <a href="/api/solicitacoes/${s.id}/pdf" class="btn btn-status btn-pdf" title="Baixar PDF" download="${s.numero_pedido}.pdf">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              PDF
            </a>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  // Update status function (global scope)
  window.updateStatus = async (id, newStatus) => {
    const labels = { APROVADO: 'aprovar', RECUSADO: 'recusar', PENDENTE: 'reverter para pendente' };
    const confirmMsg = `Deseja ${labels[newStatus]} esta solicitação?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/solicitacoes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Status atualizado para "${statusLabels[newStatus]}"!`, 'success');
        loadData(currentPage);
      } else {
        showToast(data.message || 'Erro ao atualizar status.', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão com o servidor.', 'error');
    }
  };

  function renderPagination(p) {
    const container = document.getElementById('pagination');
    if (p.totalPages <= 1) { container.innerHTML = ''; return; }

    let html = '';
    for (let i = 1; i <= p.totalPages; i++) {
      const active = i === p.page ? 'btn-primary' : 'btn-secondary';
      html += `<button class="btn btn-sm ${active}" onclick="goToPage(${i})">${i}</button>`;
    }
    container.innerHTML = html;
  }

  window.goToPage = (page) => loadData(page);

  document.getElementById('btnFiltrar').addEventListener('click', () => loadData(1));

  // Load on page ready
  loadData();
});

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
}
