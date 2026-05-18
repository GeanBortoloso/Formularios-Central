const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Gera o PDF para uma solicitação
 * @param {Object} solicitacao - Dados da solicitação com itens
 * @param {Object} res - Response do Express (stream)
 */
const gerarPDF = async (solicitacao, res) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 50, right: 50 },
    info: {
      Title: `Solicitação ${solicitacao.numero_pedido}`,
      Author: process.env.COMPANY_NAME || 'Central Peças e Baterias',
    },
  });

  const companyName = process.env.COMPANY_NAME || 'Central Peças e Baterias';

  // Cores da marca
  const GOLD = [246, 180, 58];     // rgb(246, 180, 58)
  const CHARCOAL = [62, 68, 74];   // rgb(62, 68, 74)
  const LIGHT_GRAY = [240, 240, 240];
  const WHITE = [255, 255, 255];
  const BLACK = [30, 30, 30];

  // Tipo labels
  const tipoLabels = {
    EPI: 'Equipamento de Proteção Individual (EPI)',
    MERCADO: 'Mercadorias',
    USO_CONSUMO: 'Material de Uso e Consumo',
  };

  const statusLabels = {
    PENDENTE: 'Pendente',
    APROVADO: 'Aprovado',
    RECUSADO: 'Recusado',
  };

  // Stream para o response (headers já definidos no controller)
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // ===== HEADER =====
  const headerY = 40;

  // Tentar carregar a logo
  const logoPath = path.join(__dirname, '..', 'public', 'assets', 'logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, headerY, { width: 120 });
  }

  // Empresa + Título
  doc
    .fillColor(CHARCOAL)
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(companyName, 180, headerY + 5, { width: pageWidth - 130 });

  doc
    .fillColor(GOLD)
    .fontSize(11)
    .font('Helvetica')
    .text('SOLICITAÇÃO DE MATERIAIS', 180, headerY + 28, { width: pageWidth - 130 });

  // Linha dourada separadora
  doc
    .moveTo(50, headerY + 55)
    .lineTo(50 + pageWidth, headerY + 55)
    .strokeColor(GOLD)
    .lineWidth(2)
    .stroke();

  // ===== INFO BLOCK =====
  let currentY = headerY + 70;

  // Background cinza para info
  doc
    .rect(50, currentY, pageWidth, 85)
    .fillColor(LIGHT_GRAY)
    .fill();

  const infoLeftX = 60;
  const infoRightX = 310;

  doc.fillColor(CHARCOAL).font('Helvetica-Bold').fontSize(9);
  doc.text('Nº Pedido:', infoLeftX, currentY + 10);
  doc.text('Tipo:', infoLeftX, currentY + 28);
  doc.text('Status:', infoLeftX, currentY + 46);
  doc.text('Data:', infoLeftX, currentY + 64);

  doc.text('Solicitante:', infoRightX, currentY + 10);
  doc.text('Setor:', infoRightX, currentY + 28);

  doc.font('Helvetica').fontSize(9).fillColor(BLACK);
  doc.text(solicitacao.numero_pedido, infoLeftX + 65, currentY + 10);
  doc.text(tipoLabels[solicitacao.tipo] || solicitacao.tipo, infoLeftX + 65, currentY + 28);
  doc.text(statusLabels[solicitacao.status] || solicitacao.status, infoLeftX + 65, currentY + 46);

  const dataFormatada = new Date(solicitacao.created_at || solicitacao.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(dataFormatada, infoLeftX + 65, currentY + 64);

  doc.text(solicitacao.solicitante, infoRightX + 70, currentY + 10);
  doc.text(solicitacao.setor, infoRightX + 70, currentY + 28);

  currentY += 100;

  // ===== TABELA DE ITENS =====
  doc
    .fillColor(CHARCOAL)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('ITENS SOLICITADOS', 50, currentY);

  currentY += 20;

  // Cabeçalho da tabela
  const colWidths = {
    num: 30,
    descricao: pageWidth - 180,
    qtd: 50,
    unidade: 50,
    obs: 50,
  };

  // Header row background
  doc
    .rect(50, currentY, pageWidth, 22)
    .fillColor(CHARCOAL)
    .fill();

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8);

  let colX = 55;
  doc.text('#', colX, currentY + 6, { width: colWidths.num, align: 'center' });
  colX += colWidths.num;
  doc.text('DESCRIÇÃO', colX, currentY + 6, { width: colWidths.descricao });
  colX += colWidths.descricao;
  doc.text('QTD', colX, currentY + 6, { width: colWidths.qtd, align: 'center' });
  colX += colWidths.qtd;
  doc.text('UN', colX, currentY + 6, { width: colWidths.unidade, align: 'center' });
  colX += colWidths.unidade;
  doc.text('OBS', colX, currentY + 6, { width: colWidths.obs, align: 'center' });

  currentY += 22;

  // Linhas dos itens
  const itens = solicitacao.itens || [];
  itens.forEach((item, index) => {
    const rowBg = index % 2 === 0 ? WHITE : LIGHT_GRAY;

    doc
      .rect(50, currentY, pageWidth, 20)
      .fillColor(rowBg)
      .fill();

    doc.fillColor(BLACK).font('Helvetica').fontSize(8);

    colX = 55;
    doc.text(String(index + 1), colX, currentY + 6, { width: colWidths.num, align: 'center' });
    colX += colWidths.num;
    doc.text(item.descricao, colX, currentY + 6, { width: colWidths.descricao });
    colX += colWidths.descricao;
    doc.text(String(item.quantidade), colX, currentY + 6, { width: colWidths.qtd, align: 'center' });
    colX += colWidths.qtd;
    doc.text(item.unidade, colX, currentY + 6, { width: colWidths.unidade, align: 'center' });
    colX += colWidths.unidade;
    doc.text(item.observacao || '-', colX, currentY + 6, { width: colWidths.obs, align: 'center' });

    currentY += 20;
  });

  // Borda da tabela
  doc
    .rect(50, currentY - (itens.length * 20) - 22, pageWidth, (itens.length * 20) + 22)
    .strokeColor(CHARCOAL)
    .lineWidth(0.5)
    .stroke();

  currentY += 15;

  // ===== JUSTIFICATIVA =====
  if (solicitacao.justificativa) {
    doc
      .fillColor(CHARCOAL)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('JUSTIFICATIVA', 50, currentY);

    currentY += 18;

    doc
      .rect(50, currentY, pageWidth, 50)
      .fillColor(LIGHT_GRAY)
      .fill();

    doc
      .fillColor(BLACK)
      .font('Helvetica')
      .fontSize(9)
      .text(solicitacao.justificativa, 60, currentY + 8, {
        width: pageWidth - 20,
        height: 40,
      });

    currentY += 65;
  }

  // ===== ASSINATURA =====
  currentY += 20;

  // Linha separadora
  doc
    .moveTo(50, currentY)
    .lineTo(50 + pageWidth, currentY)
    .strokeColor(LIGHT_GRAY)
    .lineWidth(1)
    .stroke();

  currentY += 20;

  // Assinatura do solicitante
  doc
    .moveTo(80, currentY + 25)
    .lineTo(260, currentY + 25)
    .strokeColor(CHARCOAL)
    .lineWidth(0.5)
    .stroke();

  doc
    .fillColor(CHARCOAL)
    .font('Helvetica')
    .fontSize(8)
    .text('Assinatura do Solicitante', 80, currentY + 28, { width: 180, align: 'center' });

  // Assinatura do aprovador
  doc
    .moveTo(320, currentY + 25)
    .lineTo(500, currentY + 25)
    .strokeColor(CHARCOAL)
    .lineWidth(0.5)
    .stroke();

  doc
    .fillColor(CHARCOAL)
    .font('Helvetica')
    .fontSize(8)
    .text('Assinatura do Aprovador', 320, currentY + 28, { width: 180, align: 'center' });

  currentY += 45;

  doc
    .fillColor(CHARCOAL)
    .font('Helvetica')
    .fontSize(8)
    .text('Data: ____/____/________', 80, currentY);

  doc.text('Data: ____/____/________', 320, currentY);

  // ===== RODAPÉ (posicionado dinamicamente) =====
  currentY += 30;

  doc
    .moveTo(50, currentY)
    .lineTo(50 + pageWidth, currentY)
    .strokeColor(GOLD)
    .lineWidth(1)
    .stroke();

  doc
    .fillColor(GOLD)
    .font('Helvetica')
    .fontSize(7)
    .text(
      `${companyName} — Documento gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}`,
      50,
      currentY + 6,
      { width: pageWidth, align: 'center' }
    );

  // ===== ANEXOS (UMA PÁGINA POR IMAGEM) =====
  const anexos = solicitacao.anexo_url;
  if (anexos && Array.isArray(anexos) && anexos.length > 0) {
    for (let i = 0; i < anexos.length; i++) {
      try {
        const response = await fetch(anexos[i]);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        doc.addPage();

        doc
          .fillColor(CHARCOAL)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(`ANEXO ${i + 1} DE ${anexos.length}`, 50, 40, { align: 'center' });

        doc.image(buffer, 50, 80, {
          fit: [pageWidth, doc.page.height - 150],
          align: 'center',
          valign: 'center'
        });

        // Rodapé da página do anexo
        doc
          .moveTo(50, doc.page.height - 50)
          .lineTo(50 + pageWidth, doc.page.height - 50)
          .strokeColor(GOLD)
          .lineWidth(1)
          .stroke();

        doc
          .fillColor(GOLD)
          .font('Helvetica')
          .fontSize(7)
          .text(
            `${companyName} — Anexo ${i + 1} referente ao pedido ${solicitacao.numero_pedido}`,
            50,
            doc.page.height - 44,
            { width: pageWidth, align: 'center' }
          );

      } catch (err) {
        console.error(`Erro ao baixar anexo ${i + 1} para o PDF:`, err);
      }
    }
  }

  doc.end();
};

module.exports = { gerarPDF };
