import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { criarEstadoInicial } from '../data/mockData';
import {
  arredondar,
  calcularAcertoMes,
  calcularGastosPorCategoria,
  calcularMetaCompleta,
  calcularProgressoTodosOrcamentos,
  calcularProporcaoRenda,
  calcularProximosVencimentos,
  calcularResumoMensal,
  gerarId,
  gerarLancamentosRecorrentes,
  hojeISO,
  mesKeyDe,
  mesKeyHoje,
  obterPercentuaisDivisao,
  simularAporte,
  somarValores,
  sugerirClassificacao,
} from '../utils/calculations';

const STORAGE_KEY = 'casal-financas:estado';
const SCHEMA_VERSION = 1;
const CHAVES_LISTA = ['pessoas', 'rendas', 'categorias', 'tetosOrcamento', 'contasRecorrentes', 'lancamentos', 'metas'];

function criarEstadoDeFabrica() {
  return { ...criarEstadoInicial(), perfilAtivo: 'nathalia', mesSelecionado: mesKeyHoje() };
}

function carregarEstadoInicial() {
  const fabrica = criarEstadoDeFabrica();
  try {
    const bruto = window.localStorage.getItem(STORAGE_KEY);
    if (!bruto) return fabrica;
    const salvo = JSON.parse(bruto);
    if (salvo?.versao !== SCHEMA_VERSION || typeof salvo.dados !== 'object' || !salvo.dados) return fabrica;
    const dados = salvo.dados;
    const valido =
      CHAVES_LISTA.every((chave) => Array.isArray(dados[chave])) &&
      typeof dados.configuracoes === 'object' &&
      typeof dados.acertos === 'object';
    if (!valido) return fabrica;
    return { ...fabrica, ...dados, mesSelecionado: mesKeyHoje() };
  } catch {
    return fabrica;
  }
}

function salvarEstado(estado) {
  try {
    const { mesSelecionado, ...dados } = estado;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ versao: SCHEMA_VERSION, salvoEm: new Date().toISOString(), dados }));
  } catch {}
}

const trocarPorId = (lista, id, atualizar) => lista.map((item) => (item.id === id ? atualizar(item) : item));
const removerPorId = (lista, id) => lista.filter((item) => item.id !== id);

function normalizarMeta(meta) {
  const saldoInicial = Number(meta.saldoInicial) || 0;
  return {
    ...meta,
    saldoInicial,
    valorAcumulado: arredondar(saldoInicial + somarValores(meta.aportes || [], (a) => a.valor)),
  };
}

function alterarMeta(state, metaId, atualizar) {
  return { ...state, metas: trocarPorId(state.metas, metaId, (meta) => normalizarMeta(atualizar(meta))) };
}

function normalizarLancamento(entrada, state) {
  const sugestao = sugerirClassificacao(entrada.categoriaId, state.categorias);
  return {
    id: entrada.id ?? gerarId('lan'),
    descricao: String(entrada.descricao ?? '').trim(),
    valor: arredondar(Math.abs(Number(entrada.valor) || 0)),
    categoriaId: entrada.categoriaId,
    tipo: entrada.tipo ?? sugestao.tipo,
    pertenceCasa: entrada.pertenceCasa ?? sugestao.pertenceCasa,
    status: entrada.status === 'Pago' ? 'Pago' : 'Pendente',
    data: entrada.data || hojeISO(),
    pagoPor: entrada.pagoPor || state.perfilAtivo,
    formaPagamento: entrada.formaPagamento || 'Pix',
    recorrenteId: entrada.recorrenteId ?? null,
    observacao: entrada.observacao ?? '',
  };
}

export const ACOES = {
  SET_PERFIL: 'SET_PERFIL',
  SET_MES: 'SET_MES',
  LANCAMENTO_ADD: 'LANCAMENTO_ADD',
  LANCAMENTO_UPDATE: 'LANCAMENTO_UPDATE',
  LANCAMENTO_DELETE: 'LANCAMENTO_DELETE',
  LANCAMENTO_STATUS: 'LANCAMENTO_STATUS',
  RECORRENTES_GERAR: 'RECORRENTES_GERAR',
  RENDA_ADD: 'RENDA_ADD',
  RENDA_UPDATE: 'RENDA_UPDATE',
  RENDA_TOGGLE: 'RENDA_TOGGLE',
  RENDA_DELETE: 'RENDA_DELETE',
  REGRA_DIVISAO_SET: 'REGRA_DIVISAO_SET',
  TETO_SET: 'TETO_SET',
  RECORRENTE_ADD: 'RECORRENTE_ADD',
  RECORRENTE_UPDATE: 'RECORRENTE_UPDATE',
  RECORRENTE_DELETE: 'RECORRENTE_DELETE',
  ACERTO_QUITAR: 'ACERTO_QUITAR',
  ACERTO_REABRIR: 'ACERTO_REABRIR',
  META_ADD: 'META_ADD',
  META_UPDATE: 'META_UPDATE',
  META_DELETE: 'META_DELETE',
  APORTE_ADD: 'APORTE_ADD',
  APORTE_DELETE: 'APORTE_DELETE',
  SUBITEM_SAVE: 'SUBITEM_SAVE',
  SUBITEM_DELETE: 'SUBITEM_DELETE',
  TAREFA_ADD: 'TAREFA_ADD',
  TAREFA_TOGGLE: 'TAREFA_TOGGLE',
  TAREFA_DELETE: 'TAREFA_DELETE',
  RESETAR: 'RESETAR',
};

function reducer(state, { type, payload }) {
  switch (type) {
    case ACOES.SET_PERFIL:
      return { ...state, perfilAtivo: payload };
    case ACOES.SET_MES:
      return { ...state, mesSelecionado: payload };
    case ACOES.LANCAMENTO_ADD:
      return { ...state, lancamentos: [...state.lancamentos, normalizarLancamento(payload, state)] };
    case ACOES.LANCAMENTO_UPDATE:
      return {
        ...state,
        lancamentos: trocarPorId(state.lancamentos, payload.id, (l) => normalizarLancamento({ ...l, ...payload.patch, id: l.id }, state)),
      };
    case ACOES.LANCAMENTO_DELETE:
      return { ...state, lancamentos: removerPorId(state.lancamentos, payload) };
    case ACOES.LANCAMENTO_STATUS: {
      const { id, status, pagoPor, data } = payload;
      return {
        ...state,
        lancamentos: trocarPorId(state.lancamentos, id, (l) => ({
          ...l,
          status: status === 'Pago' ? 'Pago' : 'Pendente',
          pagoPor: pagoPor ?? l.pagoPor,
          data: data ?? l.data,
        })),
      };
    }
    case ACOES.RECORRENTES_GERAR: {
      const novos = gerarLancamentosRecorrentes(state.contasRecorrentes, state.lancamentos, payload, state.categorias);
      return novos.length ? { ...state, lancamentos: [...state.lancamentos, ...novos] } : state;
    }
    case ACOES.RENDA_ADD:
      return {
        ...state,
        rendas: [...state.rendas, { id: gerarId('renda'), pessoaId: payload.pessoaId, descricao: payload.descricao, valor: arredondar(payload.valor), ativa: payload.ativa !== false }],
      };
    case ACOES.RENDA_UPDATE:
      return {
        ...state,
        rendas: trocarPorId(state.rendas, payload.id, (r) => ({ ...r, ...payload.patch, valor: arredondar(payload.patch.valor ?? r.valor) })),
      };
    case ACOES.RENDA_TOGGLE:
      return { ...state, rendas: trocarPorId(state.rendas, payload, (r) => ({ ...r, ativa: !r.ativa })) };
    case ACOES.RENDA_DELETE:
      return { ...state, rendas: removerPorId(state.rendas, payload) };
    case ACOES.REGRA_DIVISAO_SET:
      return {
        ...state,
        configuracoes: { ...state.configuracoes, regraDivisao: { ...state.configuracoes.regraDivisao, ...payload } },
      };
    case ACOES.TETO_SET: {
      const { categoriaId, valor } = payload;
      const existe = state.tetosOrcamento.some((t) => t.categoriaId === categoriaId);
      const novoValor = arredondar(Math.max(0, valor));
      return {
        ...state,
        tetosOrcamento: existe
          ? state.tetosOrcamento.map((t) => (t.categoriaId === categoriaId ? { ...t, valor: novoValor } : t))
          : [...state.tetosOrcamento, { categoriaId, valor: novoValor }],
      };
    }
    case ACOES.RECORRENTE_ADD:
      return {
        ...state,
        contasRecorrentes: [...state.contasRecorrentes, { ativa: true, formaPagamento: 'Pix', pagoPorPadrao: state.perfilAtivo, ...payload, id: gerarId('rec'), valor: arredondar(payload.valor) }],
      };
    case ACOES.RECORRENTE_UPDATE:
      return {
        ...state,
        contasRecorrentes: trocarPorId(state.contasRecorrentes, payload.id, (c) => ({ ...c, ...payload.patch, valor: arredondar(payload.patch.valor ?? c.valor) })),
      };
    case ACOES.RECORRENTE_DELETE:
      return { ...state, contasRecorrentes: removerPorId(state.contasRecorrentes, payload) };
    case ACOES.ACERTO_QUITAR: {
      const acerto = calcularAcertoMes(state.lancamentos, state.configuracoes.regraDivisao, state.rendas, payload);
      return {
        ...state,
        acertos: {
          ...state.acertos,
          [payload]: {
            quitado: true,
            quitadoEm: hojeISO(),
            totalCasa: acerto.totalCasa,
            valor: acerto.transferencia?.valor ?? 0,
            de: acerto.transferencia?.de ?? null,
            para: acerto.transferencia?.para ?? null,
          },
        },
      };
    }
    case ACOES.ACERTO_REABRIR: {
      const { [payload]: _removido, ...restante } = state.acertos;
      return { ...state, acertos: restante };
    }
    case ACOES.META_ADD:
      return {
        ...state,
        metas: [
          ...state.metas,
          normalizarMeta({
            emoji: '🎯',
            descricao: '',
            regraAporte: 'proporcional',
            percentualNathalia: 50,
            status: 'ativa',
            criadaEm: hojeISO(),
            aportes: [],
            subOrcamento: [],
            checklist: [],
            ...payload,
            id: gerarId('meta'),
            valorAlvo: arredondar(payload.valorAlvo),
            saldoInicial: arredondar(payload.saldoInicial ?? payload.valorAcumulado ?? 0),
          }),
        ],
      };
    case ACOES.META_UPDATE:
      return alterarMeta(state, payload.id, (m) => ({ ...m, ...payload.patch }));
    case ACOES.META_DELETE:
      return { ...state, metas: removerPorId(state.metas, payload) };
    case ACOES.APORTE_ADD:
      return alterarMeta(state, payload.metaId, (m) => ({
        ...m,
        aportes: [...m.aportes, { id: gerarId('ap'), pessoaId: payload.aporte.pessoaId || state.perfilAtivo, valor: arredondar(Math.abs(payload.aporte.valor)), data: payload.aporte.data || hojeISO(), observacao: payload.aporte.observacao ?? '' }],
      }));
    case ACOES.APORTE_DELETE:
      return alterarMeta(state, payload.metaId, (m) => ({ ...m, aportes: removerPorId(m.aportes, payload.aporteId) }));
    case ACOES.SUBITEM_SAVE:
      return alterarMeta(state, payload.metaId, (m) => {
        const item = { ...payload.item, planejado: arredondar(payload.item.planejado), realizado: arredondar(payload.item.realizado ?? 0) };
        return item.id
          ? { ...m, subOrcamento: trocarPorId(m.subOrcamento, item.id, (atual) => ({ ...atual, ...item })) }
          : { ...m, subOrcamento: [...m.subOrcamento, { ...item, id: gerarId('sub') }] };
      });
    case ACOES.SUBITEM_DELETE:
      return alterarMeta(state, payload.metaId, (m) => ({ ...m, subOrcamento: removerPorId(m.subOrcamento, payload.itemId) }));
    case ACOES.TAREFA_ADD:
      return alterarMeta(state, payload.metaId, (m) => ({
        ...m,
        checklist: [...m.checklist, { id: gerarId('chk'), titulo: payload.tarefa.titulo, responsavelId: payload.tarefa.responsavelId || state.perfilAtivo, prazo: payload.tarefa.prazo || null, concluido: false }],
      }));
    case ACOES.TAREFA_TOGGLE:
      return alterarMeta(state, payload.metaId, (m) => ({
        ...m,
        checklist: trocarPorId(m.checklist, payload.tarefaId, (t) => ({ ...t, concluido: !t.concluido })),
      }));
    case ACOES.TAREFA_DELETE:
      return alterarMeta(state, payload.metaId, (m) => ({ ...m, checklist: removerPorId(m.checklist, payload.tarefaId) }));
    case ACOES.RESETAR:
      return { ...criarEstadoDeFabrica(), perfilAtivo: state.perfilAtivo };
    default:
      return state;
  }
}

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, carregarEstadoInicial);
  useEffect(() => { salvarEstado(state); }, [state]);
  const hoje = hojeISO();

  const derivados = useMemo(() => {
    const { lancamentos, rendas, configuracoes, categorias, tetosOrcamento, acertos, metas, mesSelecionado } = state;
    const lancamentosDoMes = lancamentos.filter((l) => mesKeyDe(l.data) === mesSelecionado).sort((a, b) => b.data.localeCompare(a.data));
    return {
      hoje,
      regraDivisao: configuracoes.regraDivisao,
      proporcaoRenda: calcularProporcaoRenda(rendas),
      percentuaisDivisao: obterPercentuaisDivisao(configuracoes.regraDivisao, rendas),
      lancamentosDoMes,
      resumoMes: calcularResumoMensal(lancamentos, rendas, mesSelecionado),
      acertoMes: calcularAcertoMes(lancamentos, configuracoes.regraDivisao, rendas, mesSelecionado, acertos[mesSelecionado] ?? null),
      orcamentos: calcularProgressoTodosOrcamentos(categorias, lancamentos, tetosOrcamento, mesSelecionado, configuracoes.limiarAtencaoOrcamento),
      gastosPorCategoria: calcularGastosPorCategoria(lancamentos, mesSelecionado),
      proximosVencimentos: calcularProximosVencimentos(lancamentos, hoje, 7),
      metasDetalhadas: metas.map((meta) => calcularMetaCompleta(meta, rendas, hoje)),
    };
  }, [state, hoje]);

  const acoes = useMemo(
    () => ({
      setPerfilAtivo: (pessoaId) => dispatch({ type: ACOES.SET_PERFIL, payload: pessoaId }),
      setMesSelecionado: (mesKey) => dispatch({ type: ACOES.SET_MES, payload: mesKey }),
      adicionarLancamento: (dados) => dispatch({ type: ACOES.LANCAMENTO_ADD, payload: dados }),
      atualizarLancamento: (id, patch) => dispatch({ type: ACOES.LANCAMENTO_UPDATE, payload: { id, patch } }),
      excluirLancamento: (id) => dispatch({ type: ACOES.LANCAMENTO_DELETE, payload: id }),
      marcarComoPago: (id, extras = {}) => dispatch({ type: ACOES.LANCAMENTO_STATUS, payload: { id, status: 'Pago', ...extras } }),
      marcarComoPendente: (id) => dispatch({ type: ACOES.LANCAMENTO_STATUS, payload: { id, status: 'Pendente' } }),
      gerarRecorrentesDoMes: (mesKey) => dispatch({ type: ACOES.RECORRENTES_GERAR, payload: mesKey }),
      adicionarRenda: (dados) => dispatch({ type: ACOES.RENDA_ADD, payload: dados }),
      atualizarRenda: (id, patch) => dispatch({ type: ACOES.RENDA_UPDATE, payload: { id, patch } }),
      alternarRendaAtiva: (id) => dispatch({ type: ACOES.RENDA_TOGGLE, payload: id }),
      excluirRenda: (id) => dispatch({ type: ACOES.RENDA_DELETE, payload: id }),
      definirRegraDivisao: (regra) => dispatch({ type: ACOES.REGRA_DIVISAO_SET, payload: regra }),
      definirTeto: (categoriaId, valor) => dispatch({ type: ACOES.TETO_SET, payload: { categoriaId, valor } }),
      adicionarContaRecorrente: (dados) => dispatch({ type: ACOES.RECORRENTE_ADD, payload: dados }),
      atualizarContaRecorrente: (id, patch) => dispatch({ type: ACOES.RECORRENTE_UPDATE, payload: { id, patch } }),
      excluirContaRecorrente: (id) => dispatch({ type: ACOES.RECORRENTE_DELETE, payload: id }),
      quitarAcerto: (mesKey) => dispatch({ type: ACOES.ACERTO_QUITAR, payload: mesKey }),
      reabrirAcerto: (mesKey) => dispatch({ type: ACOES.ACERTO_REABRIR, payload: mesKey }),
      criarMeta: (dados) => dispatch({ type: ACOES.META_ADD, payload: dados }),
      atualizarMeta: (id, patch) => dispatch({ type: ACOES.META_UPDATE, payload: { id, patch } }),
      excluirMeta: (id) => dispatch({ type: ACOES.META_DELETE, payload: id }),
      registrarAporte: (metaId, aporte) => dispatch({ type: ACOES.APORTE_ADD, payload: { metaId, aporte } }),
      removerAporte: (metaId, aporteId) => dispatch({ type: ACOES.APORTE_DELETE, payload: { metaId, aporteId } }),
      salvarItemSubOrcamento: (metaId, item) => dispatch({ type: ACOES.SUBITEM_SAVE, payload: { metaId, item } }),
      removerItemSubOrcamento: (metaId, itemId) => dispatch({ type: ACOES.SUBITEM_DELETE, payload: { metaId, itemId } }),
      adicionarTarefa: (metaId, tarefa) => dispatch({ type: ACOES.TAREFA_ADD, payload: { metaId, tarefa } }),
      alternarTarefa: (metaId, tarefaId) => dispatch({ type: ACOES.TAREFA_TOGGLE, payload: { metaId, tarefaId } }),
      removerTarefa: (metaId, tarefaId) => dispatch({ type: ACOES.TAREFA_DELETE, payload: { metaId, tarefaId } }),
      resetarDados: () => dispatch({ type: ACOES.RESETAR }),
    }),
    []
  );

  const getCategoria = useCallback((id) => state.categorias.find((c) => c.id === id) ?? null, [state.categorias]);
  const getPessoa = useCallback((id) => state.pessoas.find((p) => p.id === id) ?? null, [state.pessoas]);
  const simularMeta = useCallback(
    (metaId, aporteMensalSimulado) => {
      const meta = state.metas.find((m) => m.id === metaId);
      return meta ? simularAporte(meta, aporteMensalSimulado, state.rendas, hoje) : null;
    },
    [state.metas, state.rendas, hoje]
  );

  const value = useMemo(
    () => ({ ...state, ...derivados, ...acoes, getCategoria, getPessoa, simularMeta }),
    [state, derivados, acoes, getCategoria, getPessoa, simularMeta]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const contexto = useContext(FinanceContext);
  if (!contexto) throw new Error('useFinance deve ser usado dentro de <FinanceProvider>.');
  return contexto;
}
