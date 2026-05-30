/**
 * Formulário Page - Lógica de criação de solicitações
 */
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const tipo = params.get('tipo') || 'EPI';
  document.getElementById('tipoSolicitacao').value = tipo;

  const tipoLabels = {
    EPI: { titulo: 'Solicitação de EPI', sub: 'Equipamentos de Proteção Individual' },
    USO_CONSUMO: { titulo: 'Uso e Consumo', sub: 'Materiais de escritório e consumo geral' },
  };

  const info = tipoLabels[tipo] || tipoLabels.EPI;
  document.getElementById('pageTitle').textContent = info.titulo;
  document.getElementById('pageSubtitle').textContent = info.sub;
  document.getElementById('breadcrumbTipo').textContent = info.titulo;

  // Items table logic
  let itemCount = 0;
  const tbody = document.getElementById('itensTableBody');

  function addItemRow() {
    itemCount++;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-num" style="color:var(--text-muted);font-weight:600;">${itemCount}</td>
      <td><input type="text" class="form-control item-desc" placeholder="Descrição do item" required></td>
      <td class="col-qtd"><input type="number" class="form-control item-qtd" min="1" value="1" required></td>
      <td class="col-un">
        <select class="form-control item-un">
          <option value="un">un</option>
          <option value="par">par</option>
          <option value="cx">cx</option>
          <option value="pct">pct</option>
          <option value="kg">kg</option>
          <option value="lt">lt</option>
          <option value="mt">mt</option>
          <option value="rl">rl</option>
        </select>
      </td>
      <td class="col-obs"><input type="text" class="form-control item-obs" placeholder="Obs..."></td>
      <td class="col-act">
        <button type="button" class="btn btn-danger btn-icon btn-remove-item" title="Remover item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);

    tr.querySelector('.btn-remove-item').addEventListener('click', () => {
      if (tbody.children.length > 1) {
        tr.remove();
        renumberRows();
      } else {
        showToast('É necessário pelo menos um item.', 'error');
      }
    });
  }

  function renumberRows() {
    Array.from(tbody.children).forEach((tr, i) => {
      tr.querySelector('.col-num').textContent = i + 1;
    });
    itemCount = tbody.children.length;
  }

  // Start with one row
  addItemRow();
  document.getElementById('btnAddItem').addEventListener('click', addItemRow);

  // Form submission
  document.getElementById('solicitacaoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Enviando...';

    const solicitante = document.getElementById('solicitante').value.trim();
    const filial = document.getElementById('filial').value;
    const setor = document.getElementById('setor').value;
    const justificativa = document.getElementById('justificativa').value.trim();

    if (!solicitante || !filial || !setor) {
      showToast('Preencha nome, filial e setor do solicitante.', 'error');
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      return;
    }

    const itens = [];
    let hasError = false;
    tbody.querySelectorAll('tr').forEach((tr) => {
      const desc = tr.querySelector('.item-desc').value.trim();
      const qtd = parseInt(tr.querySelector('.item-qtd').value, 10);
      const un = tr.querySelector('.item-un').value;
      const obs = tr.querySelector('.item-obs').value.trim();
      if (!desc || !qtd || qtd < 1) hasError = true;
      itens.push({ descricao: desc, quantidade: qtd, unidade: un, observacao: obs || null });
    });

    if (hasError || itens.length === 0) {
      showToast('Preencha a descrição e quantidade de todos os itens.', 'error');
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      return;
    }

    try {
      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('filial', filial);
      formData.append('solicitante', solicitante);
      formData.append('setor', setor);
      formData.append('justificativa', justificativa);
      formData.append('itens', JSON.stringify(itens)); // Pass itens as a JSON string

      const anexoInput = document.getElementById('anexos');
      if (anexoInput.files.length > 0) {
        for (let i = 0; i < anexoInput.files.length; i++) {
          formData.append('anexos', anexoInput.files[i]);
        }
      }

      const res = await fetch('/api/solicitacoes', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const modal = document.getElementById('successModal');
        document.getElementById('modalMessage').textContent =
          `Pedido ${data.data.numero_pedido} registrado com sucesso.`;
        const btnPdf = document.getElementById('btnDownloadPDF');
        btnPdf.href = `/api/solicitacoes/${data.data.id}/pdf`;
        btnPdf.setAttribute('download', `${data.data.numero_pedido}.pdf`);
        modal.classList.add('active');
      } else {
        const msgs = data.errors ? data.errors.join('\n') : data.message;
        showToast(msgs, 'error');
      }
    } catch (err) {
      showToast('Erro de conexão com o servidor.', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = originalHTML;
  });

  // Close modal on overlay click
  document.getElementById('successModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.target.classList.remove('active');
  });
});

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
}
