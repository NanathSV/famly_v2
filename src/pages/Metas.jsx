import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, CheckSquare, ListChecks, PiggyBank, Plus, Sliders, Square, Target, Trash2, Wallet } from 'lucide-react';
import { Avatar, Botao, Campo, Chip, EstadoVazio, Painel, ProgressBar, Segmented, Sheet, classeInput } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { formatarBRL, formatarData, formatarPercentual, hojeISO, parseBRL, pluralizar, somarMesesISO } from '../utils/calculations';

export default function Metas() {
  const { metasDetalhadas, criarMeta } = useFinance();
  const [metaAbertaId, setMetaAbertaId] = useState(null);
  const [modalNovaMeta, setModalNovaMeta] = useState(false);

  const metaSelecionada = metasDetalhadas.find((m) => m.id === metaAbertaId) || null;
  if (metaSelecionada) {
    return <MetaDetalhe meta={metaSelecionada} aoVoltar={() => setMetaAbertaId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Metas & Planos</h1>
          <p className="text-sm text-slate-500">Planejamento conjunto, caixinhas e cronograma do casal</p>
        </div>
        <Botao tamanho="sm" onClick={() => setModalNovaMeta(true)}>
          <Plus size={16} /> Nova meta
        </Botao>
      </div>

      {metasDetalhadas.length === 0 ? (
        <EstadoVazio
          icone={Target}
          titulo="Nenhuma meta criada ainda"
          texto="Criem juntos o próximo plano: viagem em família, reserva de emergência ou troca de carro."
          acao={<Botao onClick={() => setModalNovaMeta(true)}><Plus size={16} /> Criar primeira meta</Botao>}
        />
      ) : (
        <div className="space-y-4">
          {metasDetalhadas.map((meta) => {
            const { progresso, plano, checklistResumo } = meta;
            return (
              <div key={meta.id} onClick={() => setMetaAbertaId(meta.id)} className="cursor-pointer rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">{meta.emoji}</span>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">{meta.titulo}</h2>
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar size={13} /> Alvo: {formatarData(meta.dataAlvo)} ({pluralizar(plano.mesesRestantes, 'mês', 'meses')})
                      </p>
                    </div>
                  </div>
                  <Chip tom={progresso.concluida ? 'ok' : 'marca'}>{formatarPercentual(progresso.percentual, 0)}</Chip>
                </div>

                {meta.descricao && <p className="mt-3 text-sm text-slate-600">{meta.descricao}</p>}

                <div className="mt-4">
                  <ProgressBar fracao={progresso.percentual} tom={progresso.concluida ? 'ok' : 'marca'} />
                  <div className="mt-1.5 flex justify-between text-xs font-semibold tabular-nums">
                    <span className="text-brand-700">Guardado: {formatarBRL(progresso.valorAcumulado)}</span>
                    <span className="text-slate-600">Objetivo: {formatarBRL(progresso.valorAlvo)}</span>
                  </div>
                </div>

                {plano.situacao === 'em_andamento' && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-sm">
                      <span className="font-semibold text-slate-700">Aporte mensal ideal:</span>
                      <span className="font-extrabold tabular-nums text-slate-900">{formatarBRL(plano.aporteMensalNecessario)}/mês</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>Nathalia: <strong>{formatarBRL(plano.aporteMensalPorPessoa.nathalia)}</strong></span>
                      <span>Alisson: <strong>{formatarBRL(plano.aporteMensalPorPessoa.alisson)}</strong></span>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>Checklist: {checklistResumo.concluidas}/{checklistResumo.total} concluídas</span>
                  <span className="font-bold text-brand-700">Abrir planejamento →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NovaMetaModal aberto={modalNovaMeta} aoFechar={() => setModalNovaMeta(false)} aoCriar={(dados) => { criarMeta(dados); setModalNovaMeta(false); }} />
    </div>
  );
}

function MetaDetalhe({ meta, aoVoltar }) {
  const {
    perfilAtivo,
    simularMeta,
    registrarAporte,
    removerAporte,
    salvarItemSubOrcamento,
    removerItemSubOrcamento,
    adicionarTarefa,
    alternarTarefa,
    removerTarefa,
    excluirMeta,
  } = useFinance();

  const [aba, setAba] = useState('simulador');
  const [aporteSimulado, setAporteSimulado] = useState(() => meta.plano.aporteMensalNecessario || 500);

  useEffect(() => {
    setAporteSimulado(meta.plano.aporteMensalNecessario || 500);
  }, [meta.id, meta.plano.aporteMensalNecessario]);

  const [modalAporte, setModalAporte] = useState(false);
  const [novoAporte, setNovoAporte] = useState({ pessoaId: perfilAtivo, valor: '', data: hojeISO(), observacao: '' });
  const [modalSubItem, setModalSubItem] = useState(false);
  const [formSubItem, setFormSubItem] = useState({ id: null, descricao: '', planejado: '', realizado: '' });
  const [novaTarefaTitulo, setNovaTarefaTitulo] = useState('');
  const [novaTarefaResp, setNovaTarefaResp] = useState('nathalia');
  const [novaTarefaPrazo, setNovaTarefaPrazo] = useState('');

  const simulacao = simularMeta(meta.id, aporteSimulado);
  const maxSlider = Math.max(3000, Math.ceil((meta.plano.aporteMensalNecessario || 1000) * 2.5));

  const handleSalvarAporte = (e) => {
    e.preventDefault();
    const valor = parseBRL(novoAporte.valor);
    if (valor <= 0) return;
    registrarAporte(meta.id, { ...novoAporte, valor });
    setNovoAporte({ pessoaId: perfilAtivo, valor: '', data: hojeISO(), observacao: '' });
    setModalAporte(false);
  };

  const handleSalvarSubItem = (e) => {
    e.preventDefault();
    const planejado = parseBRL(formSubItem.planejado);
    const realizado = parseBRL(formSubItem.realizado);
    if (!formSubItem.descricao.trim() || planejado <= 0) return;
    salvarItemSubOrcamento(meta.id, { id: formSubItem.id, descricao: formSubItem.descricao.trim(), planejado, realizado });
    setFormSubItem({ id: null, descricao: '', planejado: '', realizado: '' });
    setModalSubItem(false);
  };

  const handleCriarTarefa = (e) => {
    e.preventDefault();
    if (!novaTarefaTitulo.trim()) return;
    adicionarTarefa(meta.id, { titulo: novaTarefaTitulo.trim(), responsavelId: novaTarefaResp, prazo: novaTarefaPrazo || null });
    setNovaTarefaTitulo('');
    setNovaTarefaPrazo('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={aoVoltar} className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
          <ArrowLeft size={18} /> Todas as metas
        </button>
        <Botao
          variante="fantasma"
          tamanho="sm"
          className="text-rose-600"
          onClick={() => {
            if (window.confirm(`Deseja excluir a meta "${meta.titulo}"?`)) {
              excluirMeta(meta.id);
              aoVoltar();
            }
          }}
        >
          <Trash2 size={16} /> Excluir
        </Botao>
      </div>

      <Painel>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">{meta.emoji}</span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{meta.titulo}</h1>
              <p className="text-xs text-slate-500">Prazo: {formatarData(meta.dataAlvo)} • Faltam <strong>{formatarBRL(meta.progresso.falta)}</strong></p>
            </div>
          </div>
          <Botao tamanho="sm" onClick={() => setModalAporte(true)}><PiggyBank size={16} /> + Aporte</Botao>
        </div>

        <div className="mt-4">
          <ProgressBar fracao={meta.progresso.percentual} tom={meta.progresso.concluida ? 'ok' : 'marca'} />
          <div className="mt-2 flex justify-between text-xs font-bold tabular-nums">
            <span className="text-brand-700">{formatarBRL(meta.progresso.valorAcumulado)} ({formatarPercentual(meta.progresso.percentual, 0)})</span>
            <span className="text-slate-700">Alvo: {formatarBRL(meta.progresso.valorAlvo)}</span>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-1.5 text-xs font-semibold text-slate-500">Acumulado por perfil:</p>
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Nathalia: {formatarBRL(meta.aportesPorPessoa.nathalia)}</span>
            <span>Alisson: {formatarBRL(meta.aportesPorPessoa.alisson)}</span>
          </div>
        </div>
      </Painel>

      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-100 p-1">
        {[
          { id: 'simulador', rotulo: 'Simulador', icone: Sliders },
          { id: 'orcamento', rotulo: 'Orçamento', icone: Wallet },
          { id: 'checklist', rotulo: 'Checklist', icone: ListChecks },
          { id: 'aportes', rotulo: 'Aportes', icone: PiggyBank },
        ].map(({ id, rotulo, icone: Icone }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-colors sm:flex-row sm:gap-1.5 ${
              aba === id ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Icone size={15} />
            <span>{rotulo}</span>
          </button>
        ))}
      </div>

      {aba === 'simulador' && (
        <Painel className="space-y-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Simulador de planejamento (&ldquo;E se...&rdquo;)</h2>
            <p className="text-xs text-slate-500">Arraste o controle para testar quanto vocês conseguem guardar por mês e veja o impacto no prazo.</p>
          </div>
          <div className="rounded-2xl bg-brand-50/70 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-brand-800">Aporte mensal simulado</span>
              <span className="text-2xl font-extrabold tabular-nums text-brand-800">{formatarBRL(aporteSimulado)}/mês</span>
            </div>
            <input type="range" min={100} max={maxSlider} step={50} value={aporteSimulado} onChange={(e) => setAporteSimulado(Number(e.target.value))} className="mt-3 w-full accent-brand-600" />
            <div className="mt-2 flex justify-between text-xs font-semibold text-slate-700">
              <span>Nathalia: {formatarBRL(simulacao?.divisaoAporte?.nathalia ?? 0)}</span>
              <span>Alisson: {formatarBRL(simulacao?.divisaoAporte?.alisson ?? 0)}</span>
            </div>
          </div>
          {simulacao && (
            <div className={`rounded-2xl p-4 text-sm ring-1 ${simulacao.status === 'antecipa' ? 'bg-emerald-50 text-emerald-950 ring-emerald-200' : simulacao.status === 'atrasa' ? 'bg-amber-50 text-amber-950 ring-amber-200' : 'bg-slate-50 text-slate-800 ring-slate-200'}`}>
              <p className="font-bold leading-relaxed">{simulacao.mensagem}</p>
            </div>
          )}
          <Botao variante="secundario" tamanho="sm" onClick={() => setAporteSimulado(meta.plano.aporteMensalNecessario)}>
            Voltar ao ideal ({formatarBRL(meta.plano.aporteMensalNecessario)})
          </Botao>
        </Painel>
      )}

      {aba === 'orcamento' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Detalhamento de custos do plano</h2>
              <p className="text-xs text-slate-500">Planejado: {formatarBRL(meta.subOrcamentoResumo.totalPlanejado)} • Pago: {formatarBRL(meta.subOrcamentoResumo.totalRealizado)}</p>
            </div>
            <Botao tamanho="sm" onClick={() => { setFormSubItem({ id: null, descricao: '', planejado: '', realizado: '0' }); setModalSubItem(true); }}>
              <Plus size={15} /> Item
            </Botao>
          </div>
          <ul className="space-y-2.5">
            {meta.subOrcamentoResumo.itens.map((item) => (
              <li
                key={item.id}
                onClick={() => {
                  setFormSubItem({ id: item.id, descricao: item.descricao, planejado: String(item.planejado).replace('.', ','), realizado: String(item.realizado).replace('.', ',') });
                  setModalSubItem(true);
                }}
                className="cursor-pointer rounded-2xl bg-white p-4 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">{item.descricao}</p>
                  <Chip tom={item.status === 'estourado' ? 'perigo' : item.status === 'completo' ? 'ok' : 'neutro'}>
                    {item.status === 'completo' ? 'Quitado' : item.status === 'estourado' ? 'Acima do orçado' : 'Em aberto'}
                  </Chip>
                </div>
                <div className="mt-2">
                  <ProgressBar fracao={item.percentual} tom={item.status === 'estourado' ? 'estourado' : 'marca'} />
                </div>
                <div className="mt-1.5 flex justify-between text-xs tabular-nums text-slate-600">
                  <span>Pago: {formatarBRL(item.realizado)}</span>
                  <span>Orçado: {formatarBRL(item.planejado)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {aba === 'checklist' && (
        <div className="space-y-4">
          <Painel>
            <form onSubmit={handleCriarTarefa} className="space-y-3">
              <p className="text-sm font-bold text-slate-900">Nova tarefa do planejamento</p>
              <input className={classeInput} value={novaTarefaTitulo} onChange={(e) => setNovaTarefaTitulo(e.target.value)} placeholder="Ex.: Cotar passagens ou reservar hotel..." />
              <div className="grid grid-cols-2 gap-2">
                <select className={classeInput} value={novaTarefaResp} onChange={(e) => setNovaTarefaResp(e.target.value)}>
                  <option value="nathalia">Responsável: Nathalia</option>
                  <option value="alisson">Responsável: Alisson</option>
                </select>
                <input type="date" className={classeInput} value={novaTarefaPrazo} onChange={(e) => setNovaTarefaPrazo(e.target.value)} />
              </div>
              <Botao type="submit" tamanho="sm" className="w-full"><Plus size={16} /> Adicionar ao checklist</Botao>
            </form>
          </Painel>

          <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
            {(meta.checklist || []).map((tarefa) => (
              <li key={tarefa.id} className="flex items-center gap-3 px-4 py-3">
                <button type="button" onClick={() => alternarTarefa(meta.id, tarefa.id)} className="text-brand-600">
                  {tarefa.concluido ? <CheckSquare size={22} className="text-emerald-600" /> : <Square size={22} className="text-slate-400" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${tarefa.concluido ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{tarefa.titulo}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <Avatar pessoaId={tarefa.responsavelId} tamanho="sm" />
                    <span className="capitalize">{tarefa.responsavelId}</span>
                    {tarefa.prazo && <span>• até {formatarData(tarefa.prazo)}</span>}
                  </div>
                </div>
                <button type="button" onClick={() => removerTarefa(meta.id, tarefa.id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {aba === 'aportes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Depósitos realizados ({(meta.aportes || []).length})</h2>
            <Botao tamanho="sm" onClick={() => setModalAporte(true)}><Plus size={15} /> Novo aporte</Botao>
          </div>
          <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
            {[...(meta.aportes || [])].sort((a, b) => b.data.localeCompare(a.data)).map((ap) => (
              <li key={ap.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar pessoaId={ap.pessoaId} />
                  <div>
                    <p className="text-sm font-bold capitalize text-slate-900">{ap.pessoaId}</p>
                    <p className="text-xs text-slate-500">{formatarData(ap.data)}{ap.observacao && ` • ${ap.observacao}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold tabular-nums text-emerald-700">+{formatarBRL(ap.valor)}</span>
                  <button type="button" onClick={() => removerAporte(meta.id, ap.id)} className="p-1 text-slate-400 hover:text-rose-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Sheet aberto={modalAporte} aoFechar={() => setModalAporte(false)} titulo="Registrar aporte">
        <form onSubmit={handleSalvarAporte} className="space-y-4">
          <Campo rotulo="Quem depositou?">
            <Segmented rotulo="Quem depositou" opcoes={[{ valor: 'nathalia', rotulo: 'Nathalia' }, { valor: 'alisson', rotulo: 'Alisson' }]} valor={novoAporte.pessoaId} aoMudar={(v) => setNovoAporte((a) => ({ ...a, pessoaId: v }))} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Valor (R$)" htmlFor="ap-valor">
              <input id="ap-valor" className={classeInput} inputMode="decimal" placeholder="0,00" value={novoAporte.valor} onChange={(e) => setNovoAporte((a) => ({ ...a, valor: e.target.value }))} autoFocus />
            </Campo>
            <Campo rotulo="Data" htmlFor="ap-data">
              <input id="ap-data" type="date" className={classeInput} value={novoAporte.data} onChange={(e) => setNovoAporte((a) => ({ ...a, data: e.target.value }))} />
            </Campo>
          </div>
          <Campo rotulo="Onde foi guardado? (opcional)" htmlFor="ap-obs">
            <input id="ap-obs" className={classeInput} placeholder="Ex.: Caixinha Nubank" value={novoAporte.observacao} onChange={(e) => setNovoAporte((a) => ({ ...a, observacao: e.target.value }))} />
          </Campo>
          <Botao type="submit" className="w-full">Confirmar depósito</Botao>
        </form>
      </Sheet>

      <Sheet aberto={modalSubItem} aoFechar={() => setModalSubItem(false)} titulo={formSubItem.id ? 'Editar item do plano' : 'Novo item do plano'}>
        <form onSubmit={handleSalvarSubItem} className="space-y-4">
          <Campo rotulo="Descrição do item" htmlFor="sub-desc">
            <input id="sub-desc" className={classeInput} placeholder="Ex.: Passagens aéreas" value={formSubItem.descricao} onChange={(e) => setFormSubItem((s) => ({ ...s, descricao: e.target.value }))} autoFocus />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Valor planejado (R$)" htmlFor="sub-plan">
              <input id="sub-plan" className={classeInput} inputMode="decimal" placeholder="0,00" value={formSubItem.planejado} onChange={(e) => setFormSubItem((s) => ({ ...s, planejado: e.target.value }))} />
            </Campo>
            <Campo rotulo="Já pago/reservado (R$)" htmlFor="sub-real">
              <input id="sub-real" className={classeInput} inputMode="decimal" placeholder="0,00" value={formSubItem.realizado} onChange={(e) => setFormSubItem((s) => ({ ...s, realizado: e.target.value }))} />
            </Campo>
          </div>
          <div className="flex justify-between gap-2 pt-2">
            {formSubItem.id && (
              <Botao variante="fantasma" className="text-rose-600" onClick={() => { removerItemSubOrcamento(meta.id, formSubItem.id); setModalSubItem(false); }}>
                Excluir
              </Botao>
            )}
            <Botao type="submit" className="ml-auto">Salvar item</Botao>
          </div>
        </form>
      </Sheet>
    </div>
  );
}

function NovaMetaModal({ aberto, aoFechar, aoCriar }) {
  const [form, setForm] = useState({ emoji: '🎯', titulo: '', descricao: '', valorAlvo: '', saldoInicial: '', dataAlvo: somarMesesISO(hojeISO(), 12), regraAporte: 'proporcional' });

  const enviar = (e) => {
    e.preventDefault();
    const valorAlvo = parseBRL(form.valorAlvo);
    if (!form.titulo.trim() || valorAlvo <= 0) return;
    aoCriar({ ...form, titulo: form.titulo.trim(), valorAlvo, saldoInicial: parseBRL(form.saldoInicial) });
    setForm({ emoji: '🎯', titulo: '', descricao: '', valorAlvo: '', saldoInicial: '', dataAlvo: somarMesesISO(hojeISO(), 12), regraAporte: 'proporcional' });
  };

  return (
    <Sheet aberto={aberto} aoFechar={aoFechar} titulo="Nova meta do casal">
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid grid-cols-[4.5rem_1fr] gap-3">
          <Campo rotulo="Ícone" htmlFor="meta-emoji">
            <input id="meta-emoji" className={`${classeInput} text-center text-xl`} value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} />
          </Campo>
          <Campo rotulo="Nome do plano" htmlFor="meta-titulo">
            <input id="meta-titulo" className={classeInput} placeholder="Ex.: Trocar de carro" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} autoFocus />
          </Campo>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Valor total (R$)" htmlFor="meta-alvo">
            <input id="meta-alvo" className={classeInput} inputMode="decimal" placeholder="10.000,00" value={form.valorAlvo} onChange={(e) => setForm((f) => ({ ...f, valorAlvo: e.target.value }))} />
          </Campo>
          <Campo rotulo="Já guardado (R$)" htmlFor="meta-inicial">
            <input id="meta-inicial" className={classeInput} inputMode="decimal" placeholder="0,00" value={form.saldoInicial} onChange={(e) => setForm((f) => ({ ...f, saldoInicial: e.target.value }))} />
          </Campo>
        </div>
        <Campo rotulo="Data objetivo" htmlFor="meta-data">
          <input id="meta-data" type="date" className={classeInput} value={form.dataAlvo} onChange={(e) => setForm((f) => ({ ...f, dataAlvo: e.target.value }))} />
        </Campo>
        <Campo rotulo="Divisão dos aportes mensais">
          <Segmented rotulo="Divisão dos aportes" opcoes={[{ valor: 'proporcional', rotulo: 'Proporcional à renda' }, { valor: 'igualitario', rotulo: '50% / 50%' }]} valor={form.regraAporte} aoMudar={(v) => setForm((f) => ({ ...f, regraAporte: v }))} />
        </Campo>
        <Campo rotulo="Descrição / objetivo (opcional)" htmlFor="meta-desc">
          <textarea id="meta-desc" rows={2} className={classeInput} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
        </Campo>
        <Botao type="submit" className="w-full">Criar meta</Botao>
      </form>
    </Sheet>
  );
}
