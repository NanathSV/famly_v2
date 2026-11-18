export const IDS_PESSOAS = ['nathalia', 'alisson'];
export const NOMES_PESSOAS = { nathalia: 'Nathalia', alisson: 'Alisson' };
export const outraPessoa = (id) => (id === 'nathalia' ? 'alisson' : 'nathalia');

export function paraCentavos(valor) {
  return Math.round((Number(valor) || 0) * 100);
}
export function deCentavos(centavos) {
  return Math.round(centavos) / 100;
}
export function arredondar(valor) {
  return deCentavos(paraCentavos(valor));
}
export function somarValores(lista = [], seletor = (x) => x) {
  return deCentavos(lista.reduce((acc, item) => acc + paraCentavos(seletor(item)), 0));
}
export function formatarBRL(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);
}
export function formatarPercentual(fracao, casas = 2) {
  return `${((Number(fracao) || 0) * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })}%`;
}
export function parseBRL(texto) {
  if (typeof texto === 'number') return Number.isFinite(texto) ? texto : 0;
  const bruto = String(texto ?? '').trim();
  if (!bruto) return 0;
  let limpo;
  if (bruto.includes(',')) {
    limpo = bruto.replace(/[^\d,-]/g, '').replace(',', '.');
  } else {
    limpo = bruto.replace(/[^\d.-]/g, '');
  }
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : 0;
}
export function pluralizar(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}
export function gerarId(prefixo = 'id') {
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const dois = (n) => String(n).padStart(2, '0');
export function parseData(iso) {
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-').map(Number);
  return { ano, mes, dia: dia || 1 };
}
export function hojeISO(agora = new Date()) {
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`;
}
export function mesKeyHoje(agora = new Date()) {
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}`;
}
export function mesKeyDe(iso) {
  return String(iso).slice(0, 7);
}
export function somarMesesISO(iso, meses) {
  const { ano, mes, dia } = parseData(iso);
  const total = ano * 12 + (mes - 1) + meses;
  const novoAno = Math.floor(total / 12);
  const novoMes = total % 12;
  const ultimoDia = new Date(novoAno, novoMes + 1, 0).getDate();
  return `${novoAno}-${dois(novoMes + 1)}-${dois(Math.min(dia, ultimoDia))}`;
}
export function somarMesesMesKey(mesKey, meses) {
  return mesKeyDe(somarMesesISO(`${mesKey}-01`, meses));
}
export function nomeDoMes(mesKey) {
  const { ano, mes } = parseData(`${mesKey}-01`);
  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
export function formatarData(iso) {
  if (!iso) return '';
  const { ano, mes, dia } = parseData(iso);
  return `${dois(dia)}/${dois(mes)}/${ano}`;
}
export function diasEntre(isoA, isoB) {
  const a = parseData(isoA);
  const b = parseData(isoB);
  return Math.round((Date.UTC(b.ano, b.mes - 1, b.dia) - Date.UTC(a.ano, a.mes - 1, a.dia)) / 86400000);
}

export function calcularRendaAtiva(rendas = [], pessoaId) {
  return somarValores(rendas.filter((r) => r.ativa !== false && r.pessoaId === pessoaId), (r) => r.valor);
}
export function calcularProporcaoRenda(rendas = []) {
  const rendaNathalia = calcularRendaAtiva(rendas, 'nathalia');
  const rendaAlisson = calcularRendaAtiva(rendas, 'alisson');
  const total = arredondar(rendaNathalia + rendaAlisson);
  if (total <= 0) {
    return { nathalia: 0.5, alisson: 0.5, rendaNathalia, rendaAlisson, rendaTotal: total };
  }
  return {
    nathalia: rendaNathalia / total,
    alisson: rendaAlisson / total,
    rendaNathalia,
    rendaAlisson,
    rendaTotal: total,
  };
}
export function obterPercentuaisDivisao(regra, rendas = []) {
  const tipo = regra?.tipo || 'proporcional';
  if (tipo === 'igualitario') return { nathalia: 0.5, alisson: 0.5 };
  if (tipo === 'customizado') {
    const pct = Math.min(100, Math.max(0, Number(regra?.percentualNathalia)));
    const fracao = Number.isFinite(pct) ? pct / 100 : 0.5;
    return { nathalia: fracao, alisson: 1 - fracao };
  }
  const { nathalia, alisson } = calcularProporcaoRenda(rendas);
  return { nathalia, alisson };
}
export function dividirValor(valor, percentuais) {
  const centavos = paraCentavos(valor);
  const parteNathalia = Math.round(centavos * percentuais.nathalia);
  return { nathalia: deCentavos(parteNathalia), alisson: deCentavos(centavos - parteNathalia) };
}

export function montarMensagemAcerto(transferencia, totalCentavos = 1) {
  if (!transferencia) {
    return totalCentavos > 0
      ? 'Tudo certo: ninguém deve nada neste mês.'
      : 'Ainda não há gastos da casa pagos neste mês.';
  }
  return `${NOMES_PESSOAS[transferencia.de]} deve transferir ${formatarBRL(transferencia.valor)} para ${NOMES_PESSOAS[transferencia.para]}`;
}

export function calcularAcertoMes(lancamentos = [], regra, rendas = [], mesKey, acertoRegistrado = null) {
  const itens = lancamentos.filter((l) => l.pertenceCasa === true && l.status === 'Pago' && mesKeyDe(l.data) === mesKey);
  const pagoC = { nathalia: 0, alisson: 0 };
  itens.forEach((l) => {
    if (pagoC[l.pagoPor] !== undefined) pagoC[l.pagoPor] += paraCentavos(l.valor);
  });
  const totalC = pagoC.nathalia + pagoC.alisson;
  const percentuais = obterPercentuaisDivisao(regra, rendas);
  const devidoNathalia = Math.round(totalC * percentuais.nathalia);
  const devidoC = { nathalia: devidoNathalia, alisson: totalC - devidoNathalia };
  const saldoNathalia = pagoC.nathalia - devidoC.nathalia;
  const valorTransferenciaC = Math.abs(saldoNathalia);

  let transferencia = null;
  if (valorTransferenciaC > 0) {
    const de = saldoNathalia > 0 ? 'alisson' : 'nathalia';
    transferencia = { de, para: outraPessoa(de), valor: deCentavos(valorTransferenciaC) };
  }
  const quitado = acertoRegistrado?.quitado === true;
  const desatualizado = quitado && paraCentavos(acertoRegistrado.totalCasa) !== totalC;

  return {
    mesKey,
    quantidadeLancamentos: itens.length,
    totalCasa: deCentavos(totalC),
    percentuais,
    pago: { nathalia: deCentavos(pagoC.nathalia), alisson: deCentavos(pagoC.alisson) },
    devido: { nathalia: deCentavos(devidoC.nathalia), alisson: deCentavos(devidoC.alisson) },
    saldo: { nathalia: deCentavos(saldoNathalia), alisson: deCentavos(-saldoNathalia) },
    transferencia,
    mensagem: montarMensagemAcerto(transferencia, totalC),
    quitado,
    quitadoEm: quitado ? acertoRegistrado.quitadoEm : null,
    desatualizado,
  };
}

export function sugerirClassificacao(categoriaId, categorias = []) {
  const categoria = categorias.find((c) => c.id === categoriaId);
  return {
    tipo: categoria?.tipoPadrao ?? 'Variável',
    pertenceCasa: categoria?.pertenceCasaPadrao ?? false,
  };
}

export function calcularProgressoOrcamento(categoriaId, lancamentos = [], tetos = [], mesKey, limiarAtencao = 0.8) {
  const teto = tetos.find((t) => t.categoriaId === categoriaId)?.valor ?? 0;
  const doMes = lancamentos.filter((l) => l.categoriaId === categoriaId && mesKeyDe(l.data) === mesKey);
  const realizado = somarValores(doMes.filter((l) => l.status === 'Pago'), (l) => l.valor);
  const pendente = somarValores(doMes.filter((l) => l.status !== 'Pago'), (l) => l.valor);
  const previsto = arredondar(realizado + pendente);
  const percentualRealizado = teto > 0 ? realizado / teto : 0;
  const percentualPrevisto = teto > 0 ? previsto / teto : 0;

  let status = 'ok';
  if (teto <= 0) status = 'sem_teto';
  else if (percentualPrevisto > 1) status = 'estourado';
  else if (percentualPrevisto >= limiarAtencao) status = 'atencao';

  return {
    categoriaId,
    teto,
    realizado,
    pendente,
    previsto,
    restante: arredondar(teto - previsto),
    percentualRealizado,
    percentualPrevisto,
    status,
    estouroConfirmado: teto > 0 && realizado > teto,
  };
}

export function calcularProgressoTodosOrcamentos(categorias = [], lancamentos = [], tetos = [], mesKey, limiarAtencao = 0.8) {
  return categorias.map((c) => calcularProgressoOrcamento(c.id, lancamentos, tetos, mesKey, limiarAtencao));
}

export function calcularGastosPorCategoria(lancamentos = [], mesKey, incluirPendentes = false) {
  const mapa = {};
  lancamentos
    .filter((l) => mesKeyDe(l.data) === mesKey && (incluirPendentes || l.status === 'Pago'))
    .forEach((l) => {
      mapa[l.categoriaId] = (mapa[l.categoriaId] || 0) + paraCentavos(l.valor);
    });
  return Object.entries(mapa)
    .map(([categoriaId, centavos]) => ({ categoriaId, total: deCentavos(centavos) }))
    .sort((a, b) => b.total - a.total);
}

export function calcularResumoMensal(lancamentos = [], rendas = [], mesKey) {
  const doMes = lancamentos.filter((l) => mesKeyDe(l.data) === mesKey);
  const pagos = doMes.filter((l) => l.status === 'Pago');
  const pendentes = doMes.filter((l) => l.status !== 'Pago');
  const receita = somarValores(rendas.filter((r) => r.ativa !== false), (r) => r.valor);
  const totalPago = somarValores(pagos, (l) => l.valor);
  const totalPendente = somarValores(pendentes, (l) => l.valor);
  const totalPrevisto = arredondar(totalPago + totalPendente);

  const porPessoa = {};
  IDS_PESSOAS.forEach((id) => {
    porPessoa[id] = {
      pago: somarValores(pagos.filter((l) => l.pagoPor === id), (l) => l.valor),
      pendente: somarValores(pendentes.filter((l) => l.pagoPor === id), (l) => l.valor),
      renda: calcularRendaAtiva(rendas, id),
    };
  });

  return {
    mesKey,
    receita,
    totalPago,
    totalPendente,
    totalPrevisto,
    saldoRealizado: arredondar(receita - totalPago),
    saldoPrevisto: arredondar(receita - totalPrevisto),
    percentualComprometido: receita > 0 ? totalPrevisto / receita : 0,
    gastoCasaPago: somarValores(pagos.filter((l) => l.pertenceCasa), (l) => l.valor),
    gastoPessoalPago: somarValores(pagos.filter((l) => !l.pertenceCasa), (l) => l.valor),
    porPessoa,
  };
}

export function calcularProximosVencimentos(lancamentos = [], hoje = hojeISO(), dias = 7) {
  return lancamentos
    .filter((l) => l.status !== 'Pago')
    .map((l) => ({ ...l, diasParaVencer: diasEntre(hoje, l.data), atrasado: l.data < hoje }))
    .filter((l) => l.diasParaVencer <= dias)
    .sort((a, b) => a.data.localeCompare(b.data));
}

export function gerarLancamentosRecorrentes(contas = [], lancamentos = [], mesKey, categorias = []) {
  const { ano, mes } = parseData(`${mesKey}-01`);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return contas
    .filter((c) => c.ativa !== false)
    .filter((c) => !lancamentos.some((l) => l.recorrenteId === c.id && mesKeyDe(l.data) === mesKey))
    .map((c) => {
      const sugestao = sugerirClassificacao(c.categoriaId, categorias);
      return {
        id: gerarId('lan'),
        descricao: c.descricao,
        valor: arredondar(c.valor),
        categoriaId: c.categoriaId,
        tipo: c.tipo ?? sugestao.tipo,
        pertenceCasa: c.pertenceCasa ?? sugestao.pertenceCasa,
        status: 'Pendente',
        data: `${mesKey}-${dois(Math.min(c.diaVencimento || 1, ultimoDia))}`,
        pagoPor: c.pagoPorPadrao || 'nathalia',
        formaPagamento: c.formaPagamento || 'Pix',
        recorrenteId: c.id,
        observacao: '',
      };
    });
}

export function calcularAportesPorPessoa(meta) {
  const aportes = meta.aportes || [];
  const nathalia = somarValores(aportes.filter((a) => a.pessoaId === 'nathalia'), (a) => a.valor);
  const alisson = somarValores(aportes.filter((a) => a.pessoaId === 'alisson'), (a) => a.valor);
  return { nathalia, alisson, total: arredondar(nathalia + alisson) };
}

export function calcularProgressoMeta(meta) {
  const alvo = Number(meta.valorAlvo) || 0;
  const acumulado = Number(meta.valorAcumulado) || 0;
  const falta = Math.max(0, arredondar(alvo - acumulado));
  return {
    valorAlvo: alvo,
    valorAcumulado: acumulado,
    falta,
    percentual: alvo > 0 ? Math.min(1, acumulado / alvo) : 0,
    concluida: alvo > 0 && acumulado >= alvo,
  };
}

export function calcularMesesRestantes(dataAlvo, hoje = hojeISO()) {
  const a = parseData(hoje);
  const b = parseData(dataAlvo);
  let meses = (b.ano - a.ano) * 12 + (b.mes - a.mes);
  if (b.dia > a.dia) meses += 1;
  return Math.max(0, meses);
}

export function calcularPlanoReverso(meta, rendas = [], hoje = hojeISO()) {
  const { falta, concluida } = calcularProgressoMeta(meta);
  const mesesRestantes = calcularMesesRestantes(meta.dataAlvo, hoje);
  let situacao = 'em_andamento';
  if (concluida) situacao = 'concluida';
  else if (mesesRestantes === 0) situacao = 'prazo_vencido';

  let aporteMensalNecessario = 0;
  if (situacao === 'em_andamento') {
    aporteMensalNecessario = deCentavos(Math.ceil(paraCentavos(falta) / mesesRestantes));
  } else if (situacao === 'prazo_vencido') {
    aporteMensalNecessario = falta;
  }

  const percentuais = obterPercentuaisDivisao(
    { tipo: meta.regraAporte, percentualNathalia: meta.percentualNathalia },
    rendas
  );

  return {
    situacao,
    falta,
    mesesRestantes,
    dataAlvo: meta.dataAlvo,
    aporteMensalNecessario,
    percentuais,
    aporteMensalPorPessoa: dividirValor(aporteMensalNecessario, percentuais),
  };
}

export function simularAporte(meta, aporteMensalSimulado, rendas = [], hoje = hojeISO()) {
  const { falta, concluida } = calcularProgressoMeta(meta);
  const aporte = arredondar(Number(aporteMensalSimulado) || 0);
  const mesesPrazo = calcularMesesRestantes(meta.dataAlvo, hoje);
  const percentuais = obterPercentuaisDivisao(
    { tipo: meta.regraAporte, percentualNathalia: meta.percentualNathalia },
    rendas
  );
  const base = {
    aporteSimulado: aporte,
    divisaoAporte: dividirValor(aporte, percentuais),
    mesesPrazo,
    dataAlvo: meta.dataAlvo,
  };

  if (concluida) {
    return { ...base, status: 'concluida', mesesNecessarios: 0, dataEstimada: hoje, diferencaMeses: mesesPrazo, mensagem: 'Meta já concluída.' };
  }
  if (aporte <= 0) {
    return { ...base, status: 'sem_aporte', mesesNecessarios: null, dataEstimada: null, diferencaMeses: null, mensagem: 'Informe um aporte mensal maior que zero para simular.' };
  }

  const mesesNecessarios = Math.ceil(paraCentavos(falta) / paraCentavos(aporte));
  const dataEstimada = somarMesesISO(hoje, mesesNecessarios);
  const diferencaMeses = mesesPrazo - mesesNecessarios;

  let status = 'no_prazo';
  if (diferencaMeses > 0) status = 'antecipa';
  else if (diferencaMeses < 0) status = 'atrasa';

  let complemento = ' Exatamente no prazo.';
  if (status === 'antecipa') complemento = ` Isso antecipa a meta em ${pluralizar(diferencaMeses, 'mês', 'meses')}.`;
  if (status === 'atrasa') complemento = ` Isso atrasa a meta em ${pluralizar(Math.abs(diferencaMeses), 'mês', 'meses')}.`;

  return {
    ...base,
    status,
    mesesNecessarios,
    dataEstimada,
    diferencaMeses,
    mensagem: `Com ${formatarBRL(aporte)}/mês, a meta seria concluída em ${formatarData(dataEstimada)} (${pluralizar(mesesNecessarios, 'mês', 'meses')}).${complemento}`,
  };
}

export function calcularResumoSubOrcamento(meta) {
  const itens = (meta.subOrcamento || []).map((item) => {
    const planejado = Number(item.planejado) || 0;
    const realizado = Number(item.realizado) || 0;
    let status = 'parcial';
    if (realizado <= 0) status = 'pendente';
    else if (realizado > planejado) status = 'estourado';
    else if (realizado === planejado) status = 'completo';
    return {
      ...item,
      planejado,
      realizado,
      restante: arredondar(planejado - realizado),
      percentual: planejado > 0 ? Math.min(1, realizado / planejado) : 0,
      status,
    };
  });
  const totalPlanejado = somarValores(itens, (i) => i.planejado);
  const totalRealizado = somarValores(itens, (i) => i.realizado);
  return {
    itens,
    totalPlanejado,
    totalRealizado,
    totalRestante: arredondar(totalPlanejado - totalRealizado),
    percentualRealizado: totalPlanejado > 0 ? totalRealizado / totalPlanejado : 0,
    diferencaVsAlvo: arredondar(totalPlanejado - (Number(meta.valorAlvo) || 0)),
  };
}

export function calcularProgressoChecklist(checklist = [], hoje = hojeISO()) {
  const total = checklist.length;
  const concluidas = checklist.filter((t) => t.concluido).length;
  const atrasadas = checklist.filter((t) => !t.concluido && t.prazo && t.prazo < hoje);
  return {
    total,
    concluidas,
    pendentes: total - concluidas,
    percentual: total > 0 ? concluidas / total : 0,
    atrasadas,
  };
}

export function calcularMetaCompleta(meta, rendas = [], hoje = hojeISO()) {
  return {
    ...meta,
    progresso: calcularProgressoMeta(meta),
    plano: calcularPlanoReverso(meta, rendas, hoje),
    aportesPorPessoa: calcularAportesPorPessoa(meta),
    subOrcamentoResumo: calcularResumoSubOrcamento(meta),
    checklistResumo: calcularProgressoChecklist(meta.checklist, hoje),
  };
}
