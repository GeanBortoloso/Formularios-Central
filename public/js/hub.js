/**
 * Hub Page - Cards de navegação para os formulários
 */
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('cardsGrid');

  const formularios = [
    {
      tipo: 'EPI',
      titulo: 'Solicitação de EPI',
      descricao: 'Equipamentos de Proteção Individual: luvas, óculos, capacetes, botas e demais itens de segurança.',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    },
    {
      tipo: 'MERCADO',
      titulo: 'Mercado',
      descricao: 'Produtos de limpeza, café, produtos de copa e afins.',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11"/></svg>`,
    },
    {
      tipo: 'USO_CONSUMO',
      titulo: 'Uso e Consumo',
      descricao: 'Materiais de escritório, papelaria, itens de copa e outros materiais de consumo geral.',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
    },
  ];

  formularios.forEach((form) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => window.location.href = `formulario.html?tipo=${form.tipo}`;
    card.innerHTML = `
      <div class="card-icon">${form.icon}</div>
      <h3>${form.titulo}</h3>
      <p>${form.descricao}</p>
    `;
    grid.appendChild(card);
  });
});
