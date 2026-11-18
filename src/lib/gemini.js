async function chamarGemini({ prompt, systemInstruction, json = false }) {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      systemInstruction,
      responseMimeType: json ? 'application/json' : undefined,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha ao consultar IA');
  return json ? JSON.parse(data.texto) : data.texto;
}

export async function analisarFinancasCasal({ resumoMes, evolucaoMensal, orcamentos, metasDetalhadas, mesSelecionado }) {
  const contexto = {
    mesSelecionado,
    receita: resumoMes.receita,
    totalPago: resumoMes.totalPago,
    totalPendente: resumoMes.totalPendente,
    saldoPrevisto: resumoMes.saldoPrevisto,
    comparativoMesAnterior: {
      gastoAnterior: evolucaoMensal.gastoAnterior,
      diferenca: evolucaoMensal.diferenca,
      percentual: evolucaoMensal.percentual,
    },
    orcamentosEmAlerta: orcamentos
      .filter((o) => o.status !== 'ok')
      .map((o) => ({ categoria: o.categoriaId, previsto: o.previsto, teto: o.teto })),
    metas: metasDetalhadas.map((m) => ({
      titulo: m.titulo,
      acumulado: m.progresso.valorAcumulado,
      alvo: m.progresso.valorAlvo,
      aporteNecessario: m.plano.aporteMensalNecessario,
    })),
  };

  return chamarGemini({
    systemInstruction:
      'Você é um consultor financeiro prático para o casal Nathalia e Alisson. Responda em português do Brasil, de forma direta, amigável e sem rodeios, em no máximo 3 tópicos curtos com valores em R$. Destaque se melhoraram em relação ao mês anterior, onde há risco de estourar o orçamento e uma ação prática para avançar nas metas.',
    prompt: `Analise o cenário financeiro atual do casal e dê recomendações objetivas:\n${JSON.stringify(contexto)}`,
  });
}

export async function interpretarLancamentoTexto(textoLivre, categorias, hojeISO) {
  const listaCats = categorias.map((c) => `${c.id} (${c.nome})`).join(', ');
  return chamarGemini({
    json: true,
    systemInstruction: `Extraia os dados de um lançamento financeiro em JSON com as chaves: descricao (string), valor (number), categoriaId (um dos IDs: ${listaCats}), data (YYYY-MM-DD, hoje é ${hojeISO}), pagoPor ("nathalia" ou "alisson"), formaPagamento ("Pix", "Crédito", "Débito" ou "Boleto"), status ("Pago" ou "Pendente").`,
    prompt: textoLivre,
  });
}
