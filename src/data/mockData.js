import { calcularAcertoMes, mesKeyDe } from '../utils/calculations';

const HOJE = new Date();
const DIA_HOJE = HOJE.getDate();
const pad = (n) => String(n).padStart(2, '0');

const dataNoMes = (deslocamento, dia) => {
  const ref = new Date(HOJE.getFullYear(), HOJE.getMonth() + deslocamento, 1);
  const ultimoDia = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  return `${ref.getFullYear()}-${pad(ref.getMonth() + 1)}-${pad(Math.min(dia, ultimoDia))}`;
};
const dataPaga = (dia) => dataNoMes(0, Math.min(dia, DIA_HOJE));
const dataPendente = (dia) => dataNoMes(0, Math.max(dia, DIA_HOJE + 1));

let sequencia = 0;
const proximoId = (prefixo) => `${prefixo}-${String(++sequencia).padStart(3, '0')}`;

export const FORMAS_PAGAMENTO = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Alimentação (CAJU/VR/VA)'];
export const STATUS_LANCAMENTO = ['Pago', 'Pendente'];
export const TIPOS_LANCAMENTO = ['Fixo', 'Variável'];
export const REGRAS_DIVISAO = [
  { id: 'proporcional', label: 'Proporcional à renda' },
  { id: 'igualitario', label: '50% / 50%' },
  { id: 'customizado', label: 'Percentual customizado' },
];

export const PESSOAS = [
  { id: 'nathalia', nome: 'Nathalia', inicial: 'N', cor: '#ec4899' },
  { id: 'alisson', nome: 'Alisson', inicial: 'A', cor: '#6366f1' },
];

export const RENDAS = [
  { id: 'renda-001', pessoaId: 'nathalia', descricao: 'Salário CLT', valor: 2767.31, ativa: true },
  { id: 'renda-002', pessoaId: 'nathalia', descricao: 'Caju (benefício)', valor: 500.0, ativa: true },
  { id: 'renda-003', pessoaId: 'alisson', descricao: 'Salário CLT', valor: 4000.0, ativa: true },
  { id: 'renda-004', pessoaId: 'alisson', descricao: 'Freelances (eventual)', valor: 600.0, ativa: false },
];

export const CONFIGURACOES = {
  regraDivisao: { tipo: 'proporcional', percentualNathalia: 50 },
  limiarAtencaoOrcamento: 0.8,
};

export const CATEGORIAS = [
  { id: 'moradia', nome: 'Moradia', emoji: '🏠', tipoPadrao: 'Fixo', pertenceCasaPadrao: true, cor: '#6366f1' },
  { id: 'luz-agua', nome: 'Luz/Água', emoji: '💡', tipoPadrao: 'Fixo', pertenceCasaPadrao: true, cor: '#f59e0b' },
  { id: 'mercado', nome: 'Mercado', emoji: '🛒', tipoPadrao: 'Variável', pertenceCasaPadrao: true, cor: '#10b981' },
  { id: 'transporte', nome: 'Transporte', emoji: '🚗', tipoPadrao: 'Fixo', pertenceCasaPadrao: true, cor: '#0ea5e9' },
  { id: 'alimentacao', nome: 'Alimentação / Delivery', emoji: '🍽️', tipoPadrao: 'Variável', pertenceCasaPadrao: true, cor: '#f97316' },
  { id: 'filha-familia', nome: 'Filha / Família', emoji: '👶', tipoPadrao: 'Variável', pertenceCasaPadrao: true, cor: '#ec4899' },
  { id: 'saude', nome: 'Saúde', emoji: '💊', tipoPadrao: 'Variável', pertenceCasaPadrao: true, cor: '#ef4444' },
  { id: 'lazer', nome: 'Lazer & Passeios', emoji: '🎉', tipoPadrao: 'Variável', pertenceCasaPadrao: true, cor: '#8b5cf6' },
  { id: 'pessoal-nathalia', nome: 'Pessoal Nathalia', emoji: '🛍️', tipoPadrao: 'Variável', pertenceCasaPadrao: false, cor: '#d946ef' },
  { id: 'pessoal-alisson', nome: 'Pessoal Alisson', emoji: '🎮', tipoPadrao: 'Variável', pertenceCasaPadrao: false, cor: '#14b8a6' },
];

export const TETOS_ORCAMENTO = [
  { categoriaId: 'moradia', valor: 2000 },
  { categoriaId: 'luz-agua', valor: 400 },
  { categoriaId: 'mercado', valor: 1100 },
  { categoriaId: 'transporte', valor: 450 },
  { categoriaId: 'alimentacao', valor: 500 },
  { categoriaId: 'filha-familia', valor: 600 },
  { categoriaId: 'saude', valor: 250 },
  { categoriaId: 'lazer', valor: 350 },
  { categoriaId: 'pessoal-nathalia', valor: 300 },
  { categoriaId: 'pessoal-alisson', valor: 300 },
];

export const CONTAS_RECORRENTES = [
  { id: 'rec-aluguel', descricao: 'Aluguel', valor: 1600.0, categoriaId: 'moradia', diaVencimento: 5, pagoPorPadrao: 'alisson', formaPagamento: 'Pix', ativa: true },
  { id: 'rec-condominio', descricao: 'Condomínio', valor: 380.0, categoriaId: 'moradia', diaVencimento: 10, pagoPorPadrao: 'nathalia', formaPagamento: 'Boleto', ativa: true },
  { id: 'rec-luz', descricao: 'Conta de luz', valor: 168.4, categoriaId: 'luz-agua', diaVencimento: 12, pagoPorPadrao: 'nathalia', formaPagamento: 'Boleto', ativa: true },
  { id: 'rec-agua', descricao: 'Conta de água', valor: 92.3, categoriaId: 'luz-agua', diaVencimento: 15, pagoPorPadrao: 'alisson', formaPagamento: 'Boleto', ativa: true },
  { id: 'rec-internet', descricao: 'Internet fibra', valor: 119.9, categoriaId: 'luz-agua', diaVencimento: 18, pagoPorPadrao: 'alisson', formaPagamento: 'Cartão de Crédito', ativa: true },
  { id: 'rec-bilhete', descricao: 'Recarga Bilhete Único', valor: 180.0, categoriaId: 'transporte', diaVencimento: 3, pagoPorPadrao: 'nathalia', formaPagamento: 'Pix', ativa: true },
  { id: 'rec-seguro-carro', descricao: 'Seguro do carro', valor: 220.0, categoriaId: 'transporte', diaVencimento: 20, pagoPorPadrao: 'alisson', formaPagamento: 'Cartão de Crédito', ativa: true },
  { id: 'rec-natacao', descricao: 'Natação da filha', valor: 190.0, categoriaId: 'filha-familia', diaVencimento: 8, pagoPorPadrao: 'nathalia', formaPagamento: 'Pix', tipo: 'Fixo', ativa: true },
  { id: 'rec-streaming', descricao: 'Streaming (Netflix + Spotify)', valor: 79.8, categoriaId: 'lazer', diaVencimento: 22, pagoPorPadrao: 'nathalia', formaPagamento: 'Cartão de Crédito', tipo: 'Fixo', ativa: true },
];

const lanc = (dados) => {
  const categoria = CATEGORIAS.find((c) => c.id === dados.categoriaId);
  return {
    id: proximoId('lan'),
    tipo: categoria.tipoPadrao,
    pertenceCasa: categoria.pertenceCasaPadrao,
    formaPagamento: 'Pix',
    recorrenteId: null,
    observacao: '',
    ...dados,
  };
};

const LANCAMENTOS_MES_ANTERIOR = [
  lanc({ descricao: 'Aluguel', valor: 1600.0, categoriaId: 'moradia', status: 'Pago', data: dataNoMes(-1, 5), pagoPor: 'alisson', recorrenteId: 'rec-aluguel' }),
  lanc({ descricao: 'Condomínio', valor: 380.0, categoriaId: 'moradia', status: 'Pago', data: dataNoMes(-1, 10), pagoPor: 'nathalia', formaPagamento: 'Boleto', recorrenteId: 'rec-condominio' }),
  lanc({ descricao: 'Conta de luz', valor: 151.75, categoriaId: 'luz-agua', status: 'Pago', data: dataNoMes(-1, 12), pagoPor: 'nathalia', formaPagamento: 'Boleto', recorrenteId: 'rec-luz' }),
  lanc({ descricao: 'Conta de água', valor: 88.1, categoriaId: 'luz-agua', status: 'Pago', data: dataNoMes(-1, 15), pagoPor: 'alisson', formaPagamento: 'Boleto', recorrenteId: 'rec-agua' }),
  lanc({ descricao: 'Internet fibra', valor: 119.9, categoriaId: 'luz-agua', status: 'Pago', data: dataNoMes(-1, 18), pagoPor: 'alisson', formaPagamento: 'Cartão de Crédito', recorrenteId: 'rec-internet' }),
  lanc({ descricao: 'Compra do mês - supermercado', valor: 698.45, categoriaId: 'mercado', status: 'Pago', data: dataNoMes(-1, 4), pagoPor: 'nathalia', formaPagamento: 'Caju (VR/VA)' }),
  lanc({ descricao: 'Reposição - atacadão', valor: 312.6, categoriaId: 'mercado', status: 'Pago', data: dataNoMes(-1, 19), pagoPor: 'alisson', formaPagamento: 'Cartão de Débito' }),
  lanc({ descricao: 'Recarga Bilhete Único', valor: 180.0, categoriaId: 'transporte', status: 'Pago', data: dataNoMes(-1, 3), pagoPor: 'nathalia', recorrenteId: 'rec-bilhete' }),
  lanc({ descricao: 'Seguro do carro', valor: 220.0, categoriaId: 'transporte', status: 'Pago', data: dataNoMes(-1, 20), pagoPor: 'alisson', formaPagamento: 'Cartão de Crédito', recorrenteId: 'rec-seguro-carro' }),
  lanc({ descricao: 'Combustível', valor: 160.0, categoriaId: 'transporte', tipo: 'Variável', status: 'Pago', data: dataNoMes(-1, 14), pagoPor: 'alisson', formaPagamento: 'Cartão de Débito' }),
  lanc({ descricao: 'Jantar delivery', valor: 142.8, categoriaId: 'alimentacao', status: 'Pago', data: dataNoMes(-1, 11), pagoPor: 'nathalia', formaPagamento: 'Cartão de Crédito' }),
  lanc({ descricao: 'Natação da filha', valor: 190.0, categoriaId: 'filha-familia', tipo: 'Fixo', status: 'Pago', data: dataNoMes(-1, 8), pagoPor: 'nathalia', recorrenteId: 'rec-natacao' }),
  lanc({ descricao: 'Farmácia', valor: 64.3, categoriaId: 'saude', status: 'Pago', data: dataNoMes(-1, 21), pagoPor: 'alisson', formaPagamento: 'Cartão de Débito' }),
  lanc({ descricao: 'Passeio no parque + lanche', valor: 210.0, categoriaId: 'lazer', status: 'Pago', data: dataNoMes(-1, 26), pagoPor: 'alisson', formaPagamento: 'Cartão de Crédito' }),
  lanc({ descricao: 'Streaming (Netflix + Spotify)', valor: 79.8, categoriaId: 'lazer', tipo: 'Fixo', status: 'Pago', data: dataNoMes(-1, 22), pagoPor: 'nathalia', formaPagamento: 'Cartão de Crédito', recorrenteId: 'rec-streaming' }),
  lanc({ descricao: 'Roupas e acessórios', valor: 189.9, categoriaId: 'pessoal-nathalia', status: 'Pago', data: dataNoMes(-1, 17), pagoPor: 'nathalia', formaPagamento: 'Cartão de Crédito' }),
  lanc({ descricao: 'Jogo na Steam', valor: 120.0, categoriaId: 'pessoal-alisson', status: 'Pago', data: dataNoMes(-1, 24), pagoPor: 'alisson', formaPagamento: 'Cartão de Crédito' }),
];

const LANCAMENTOS_MES_ATUAL = [
  lanc({ descricao: 'Aluguel', valor: 1600.0, categoriaId: 'moradia', status: 'Pago', data: dataPaga(5), pagoPor: 'alisson', recorrenteId: 'rec-aluguel' }),
  lanc({ descricao: 'Condomínio', valor: 380.0, categoriaId: 'moradia', status: 'Pago', data: dataPaga(10), pagoPor: 'nathalia', formaPagamento: 'Boleto', recorrenteId: 'rec-condominio' }),
  lanc({ descricao: 'Conta de luz', valor: 168.4, categoriaId: 'luz-agua', status: 'Pago', data: dataPaga(12), pagoPor: 'nathalia', formaPagamento: 'Boleto', recorrenteId: 'rec-luz' }),
  lanc({ descricao: 'Recarga Bilhete Único', valor: 180.0, categoriaId: 'transporte', status: 'Pago', data: dataPaga(3), pagoPor: 'nathalia', recorrenteId: 'rec-bilhete' }),
  lanc({ descricao: 'Combustível', valor: 150.0, categoriaId: 'transporte', tipo: 'Variável', status: 'Pago', data: dataPaga(6), pagoPor: 'alisson', formaPagamento: 'Cartão de Débito' }),
  lanc({ descricao: 'Compra do mês - supermercado', valor: 612.38, categoriaId: 'mercado', status: 'Pago', data: dataPaga(4), pagoPor: 'nathalia', formaPagamento: 'Caju (VR/VA)' }),
  lanc({ descricao: 'Hortifruti / feira', valor: 87.5, categoriaId: 'mercado', status: 'Pago', data: dataPaga(8), pagoPor: 'alisson', formaPagamento: 'Dinheiro' }),
  lanc({ descricao: 'Jantar delivery', valor: 74.9, categoriaId: 'alimentacao', status: 'Pago', data: dataPaga(7), pagoPor: 'nathalia', formaPagamento: 'Cartão de Crédito' }),
  lanc({ descricao: 'Pizza de sábado', valor: 96.0, categoriaId: 'alimentacao', status: 'Pago', data: dataPaga(9), pagoPor: 'alisson', formaPagamento: 'Cartão de Crédito' }),
  lanc({ descricao: 'Natação da filha', valor: 190.0, categoriaId: 'filha-familia', tipo: 'Fixo', status: 'Pago', data: dataPaga(8), pagoPor: 'nathalia', recorrenteId: 'rec-natacao' }),
  lanc({ descricao: 'Roupas da filha', valor: 129.9, categoriaId: 'filha-familia', status: 'Pago', data: dataPaga(11), pagoPor: 'nathalia', formaPagamento: 'Cartão de Crédito' }),
  lanc({ descricao: 'Farmácia', valor: 87.6, categoriaId: 'saude', status: 'Pago', data: dataPaga(6), pagoPor: 'alisson', formaPagamento: 'Cartão de Débito' }),
  lanc({ descricao: 'Consulta pediatra', valor: 250.0, categoriaId: 'saude', status: 'Pago', data: dataPaga(12), pagoPor: 'nathalia', observacao: 'Particular, sem reembolso' }),
  lanc({ descricao: 'Cinema + pipoca', valor: 94.0, categoriaId: 'lazer', status: 'Pago', data: dataPaga(9), pagoPor: 'alisson', formaPagamento: 'Cartão de Crédito' }),
  lanc({ descricao: 'Salão / manicure', valor: 120.0, categoriaId: 'pessoal-nathalia', status: 'Pago', data: dataPaga(7), pagoPor: 'nathalia', formaPagamento: 'Cartão de Débito' }),
  lanc({ descricao: 'Livro novo', valor: 49.9, categoriaId: 'pessoal-nathalia', status: 'Pago', data: dataPaga(10), pagoPor: 'nathalia', formaPagamento: 'Cartão de Crédito' }),
  lanc({ descricao: 'Jogo na Steam', valor: 89.9, categoriaId: 'pessoal-alisson', status: 'Pago', data: dataPaga(5), pagoPor: 'alisson', formaPagamento: 'Cartão de Crédito' }),
  lanc({ descricao: 'Barbeiro', valor: 55.0, categoriaId: 'pessoal-alisson', status: 'Pago', data: dataPaga(8), pagoPor: 'alisson', formaPagamento: 'Dinheiro' }),
  lanc({ descricao: 'Conta de água', valor: 92.3, categoriaId: 'luz-agua', status: 'Pendente', data: dataPendente(15), pagoPor: 'alisson', formaPagamento: 'Boleto', recorrenteId: 'rec-agua' }),
  lanc({ descricao: 'Internet fibra', valor: 119.9, categoriaId: 'luz-agua', status: 'Pendente', data: dataPendente(18), pagoPor: 'alisson', formaPagamento: 'Cartão de Crédito', recorrenteId: 'rec-internet' }),
  lanc({ descricao: 'Seguro do carro', valor: 220.0, categoriaId: 'transporte', status: 'Pendente', data: dataPendente(20), pagoPor: 'alisson', formaPagamento: 'Cartão de Crédito', recorrenteId: 'rec-seguro-carro' }),
  lanc({ descricao: 'Streaming (Netflix + Spotify)', valor: 79.8, categoriaId: 'lazer', tipo: 'Fixo', status: 'Pendente', data: dataPendente(22), pagoPor: 'nathalia', formaPagamento: 'Cartão de Crédito', recorrenteId: 'rec-streaming' }),
  lanc({ descricao: 'Compra quinzenal - supermercado', valor: 450.0, categoriaId: 'mercado', status: 'Pendente', data: dataPendente(19), pagoPor: 'nathalia', formaPagamento: 'Caju (VR/VA)' }),
  lanc({ descricao: 'Passeio de fim de semana', valor: 200.0, categoriaId: 'lazer', status: 'Pendente', data: dataPendente(25), pagoPor: 'alisson', formaPagamento: 'Cartão de Crédito', observacao: 'Planejado' }),
];

export const LANCAMENTOS = [...LANCAMENTOS_MES_ANTERIOR, ...LANCAMENTOS_MES_ATUAL];

const MES_ANTERIOR_KEY = mesKeyDe(dataNoMes(-1, 1));
const acertoAnterior = calcularAcertoMes(LANCAMENTOS, CONFIGURACOES.regraDivisao, RENDAS, MES_ANTERIOR_KEY);

export const ACERTOS = {
  [MES_ANTERIOR_KEY]: {
    quitado: true,
    quitadoEm: dataNoMes(0, 1),
    totalCasa: acertoAnterior.totalCasa,
    valor: acertoAnterior.transferencia?.valor ?? 0,
    de: acertoAnterior.transferencia?.de ?? null,
    para: acertoAnterior.transferencia?.para ?? null,
  },
};

const somaAportes = (aportes) => Math.round(aportes.reduce((acc, a) => acc + Math.round(a.valor * 100), 0)) / 100;

const APORTES_BUENOS_AIRES = Array.from({ length: 6 }, (_, i) => {
  const data = dataNoMes(-(6 - i), 5);
  return [
    { id: `ap-ba-n-${i + 1}`, pessoaId: 'nathalia', valor: 404.63, data, observacao: 'Caixinha Nubank' },
    { id: `ap-ba-a-${i + 1}`, pessoaId: 'alisson', valor: 495.37, data, observacao: 'Caixinha Nubank' },
  ];
}).flat();

const META_BUENOS_AIRES = {
  id: 'meta-buenos-aires',
  titulo: 'Viagem em Família para Buenos Aires',
  emoji: '✈️',
  descricao: 'Primeira viagem internacional com a nossa filha. 7 dias entre San Telmo, Palermo e passeio de dia inteiro.',
  valorAlvo: 12000,
  saldoInicial: 0,
  valorAcumulado: somaAportes(APORTES_BUENOS_AIRES),
  dataAlvo: dataNoMes(10, 20),
  regraAporte: 'proporcional',
  percentualNathalia: 50,
  status: 'ativa',
  criadaEm: dataNoMes(-6, 1),
  aportes: APORTES_BUENOS_AIRES,
  subOrcamento: [
    { id: 'sub-ba-1', descricao: 'Passagens aéreas (3 pessoas)', planejado: 4800, realizado: 2400 },
    { id: 'sub-ba-2', descricao: 'Hospedagem (7 noites)', planejado: 3200, realizado: 800 },
    { id: 'sub-ba-3', descricao: 'Passeios e ingressos', planejado: 1200, realizado: 0 },
    { id: 'sub-ba-4', descricao: 'Alimentação', planejado: 1800, realizado: 0 },
    { id: 'sub-ba-5', descricao: 'Seguro viagem', planejado: 450, realizado: 450 },
    { id: 'sub-ba-6', descricao: 'Transfer e transporte local', planejado: 550, realizado: 0 },
  ],
  checklist: [
    { id: 'chk-ba-1', titulo: 'Renovar passaporte da filha', responsavelId: 'nathalia', prazo: dataNoMes(-1, 25), concluido: true },
    { id: 'chk-ba-2', titulo: 'Comprar passagens aéreas', responsavelId: 'alisson', prazo: dataNoMes(1, 10), concluido: false },
    { id: 'chk-ba-3', titulo: 'Reservar hospedagem (pagar sinal)', responsavelId: 'nathalia', prazo: dataNoMes(2, 5), concluido: false },
    { id: 'chk-ba-4', titulo: 'Contratar seguro viagem', responsavelId: 'alisson', prazo: dataNoMes(-1, 28), concluido: true },
    { id: 'chk-ba-5', titulo: 'Montar roteiro dia a dia', responsavelId: 'nathalia', prazo: dataNoMes(5, 15), concluido: false },
    { id: 'chk-ba-6', titulo: 'Comprar pesos argentinos / definir câmbio', responsavelId: 'alisson', prazo: dataNoMes(9, 25), concluido: false },
  ],
};

const APORTES_RESERVA = Array.from({ length: 12 }, (_, i) => {
  const data = dataNoMes(-(12 - i), 10);
  return [
    { id: `ap-re-n-${i + 1}`, pessoaId: 'nathalia', valor: 400, data, observacao: 'CDB Liquidez Diária' },
    { id: `ap-re-a-${i + 1}`, pessoaId: 'alisson', valor: 400, data, observacao: 'CDB Liquidez Diária' },
  ];
}).flat();

const META_RESERVA = {
  id: 'meta-reserva-emergencia',
  titulo: 'Reserva de Emergência',
  emoji: '🛡️',
  descricao: 'Colchão para imprevistos: 6 meses do custo fixo da casa, em CDB com liquidez diária.',
  valorAlvo: 24000,
  saldoInicial: 0,
  valorAcumulado: somaAportes(APORTES_RESERVA),
  dataAlvo: dataNoMes(24, 10),
  regraAporte: 'igualitario',
  percentualNathalia: 50,
  status: 'ativa',
  criadaEm: dataNoMes(-12, 1),
  aportes: APORTES_RESERVA,
  subOrcamento: [
    { id: 'sub-re-1', descricao: 'Fase 1 - 3 meses de custo fixo', planejado: 12000, realizado: 9600 },
    { id: 'sub-re-2', descricao: 'Fase 2 - 6 meses de custo fixo', planejado: 12000, realizado: 0 },
  ],
  checklist: [
    { id: 'chk-re-1', titulo: 'Abrir CDB com liquidez diária', responsavelId: 'alisson', prazo: dataNoMes(-12, 15), concluido: true },
    { id: 'chk-re-2', titulo: 'Automatizar o aporte mensal no dia 10', responsavelId: 'nathalia', prazo: dataNoMes(-11, 1), concluido: true },
    { id: 'chk-re-3', titulo: 'Fechar a Fase 1 (3 meses de custo fixo)', responsavelId: 'alisson', prazo: dataNoMes(4, 10), concluido: false },
    { id: 'chk-re-4', titulo: 'Revisar o valor do aporte a cada 6 meses', responsavelId: 'nathalia', prazo: dataNoMes(5, 10), concluido: false },
  ],
};

export const METAS = [META_BUENOS_AIRES, META_RESERVA];

export function criarEstadoInicial() {
  return JSON.parse(
    JSON.stringify({
      pessoas: PESSOAS,
      rendas: RENDAS,
      configuracoes: CONFIGURACOES,
      categorias: CATEGORIAS,
      tetosOrcamento: TETOS_ORCAMENTO,
      contasRecorrentes: CONTAS_RECORRENTES,
      lancamentos: LANCAMENTOS,
      acertos: ACERTOS,
      metas: METAS,
    })
  );
}
