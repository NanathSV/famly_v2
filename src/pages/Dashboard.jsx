import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Check, ChevronLeft, ChevronRight, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { analisarFinancasCasal } from '../lib/gemini';
import {
  arredondar,
  calcularGastosPorCategoria,
  calcularResumoMensal,
  formatarBRL,
  formatarData,
  formatarPercentual,
  nomeDoMes,
  somarMesesMesKey,
} from '../utils/calculations';
import { Botao, Chip, Painel, ProgressBar, SecaoTitulo, SplitBar, tomDoStatus } from '../components/ui';

function Legenda({ cor, rotulo, valor }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-3 w-3 shrink-0 rounded-sm border border-[#1E1B18] ${cor}`} aria-hidden="true" />
      <span className="text-stone-700">{rotulo}</span>
      <span className="ml-auto font-bold tabular-nums text-[#1E1B18]">{valor}</span>
    </div>
  );
}

function RendaDoMes() {
  const { resumoMes } = useFinance();
  const { receita, totalPago, totalPendente, totalPrevisto, saldoPrevisto } = resumoMes;
  const base = Math.max(receita, totalPrevisto) || 1;
  const faltou = saldoPrevisto < 0;

  return (
    <Painel corBarra="lilas" tituloJanela="Resumo_Mes.exe">
      <p className="text-lg leading-snug text-[#1E1B18]">
        Entram <strong className="tabular-nums">{formatarBRL(receita)}</strong> neste mês. Já saíram{' '}
        <strong className="tabular-nums">{formatarBRL(totalPago)}</strong> e ainda vão sair{' '}
        <strong className="tabular-nums">{formatarBRL(totalPendente)}</strong>.
      </p>
      <p className={`mt-1 text-lg font-extrabold tabular-nums ${faltou ? 'text-rose-700' : 'text-emerald-700'}`}>
        {faltou ? `Faltam ${formatarBRL(Math.abs(saldoPrevisto))}` : `Sobram ${formatarBRL(saldoPrevisto)}`}
      </p>
      <div className="mt-4 flex h-4 w-full overflow-hidden rounded-md border-2 border-[#1E1B18] bg-[#BBF7D0]">
        <div className="border-r border-[#1E1B18] bg-[#A78BFA]" style={{ width: `${(totalPago / base) * 100}%` }} />
        <div className="border-r border-[#1E1B18] bg-[#DDD6FE]" style={{ width: `${(totalPendente / base) * 100}%` }} />
      </div>
      <div className="mt-3 space-y-1.5">
        <Legenda cor="bg-[#A78BFA]" rotulo="Pago" valor={formatarBRL(totalPago)} />
        <Legenda cor="bg-[#DDD6FE]" rotulo="A pagar" valor={formatarBRL(totalPendente)} />
        <Legenda cor="bg-[#BBF7D0]" rotulo="Livre" valor={formatarBRL(Math.max(0, saldoPrevisto))} />
      </div>
    </Painel>
  );
}

function EvolucaoGastos() {
  const { lancamentos, rendas, categorias, mesSelecionado, setMesSelecionado } = useFinance();

  // Controla a janela de 6 meses exibida no gráfico (permite navegar para frente e para trás)
  const [mesFimJanela, setMesFimJanela] = useState(mesSelecionado);
  // Controla qual mês está sendo usado como base de comparação (padrão: mês anterior ao selecionado)
  const [mesComparacao, setMesComparacao] = useState(() => somarMesesMesKey(mesSelecionado, -1));

  useEffect(() => {
    setMesFimJanela(mesSelecionado);
    setMesComparacao(somarMesesMesKey(mesSelecionado, -1));
  }, [mesSelecionado]);

  // Opções disponíveis no filtro de comparação (12 meses para trás até 6 meses para frente)
  const opcoesMesesComparacao = useMemo(() => {
    const opcoes = [];
    for (let offset = -12; offset <= 6; offset++) {
      if (offset === 0) continue;
      opcoes.push(somarMesesMesKey(mesSelecionado, offset));
    }
    return opcoes;
  }, [mesSelecionado]);

  // Cálculo dinâmico entre o mês ativo e o mês escolhido no filtro
  const comparativo = useMemo(() => {
    const resumoAtual = calcularResumoMensal(lancamentos, rendas, mesSelecionado);
    const resumoBase = calcularResumoMensal(lancamentos, rendas, mesComparacao);

    const gastoAtual = resumoAtual.totalPrevisto;
    const gastoBase = resumoBase.totalPrevisto;
    const diferenca = arredondar(gastoAtual - gastoBase);
    const percentual = gastoBase > 0 ? arredondar((diferenca / gastoBase) * 100, 1) : 0;

    const gastosAtualCat = calcularGastosPorCategoria(lancamentos, mesSelecionado);
    const gastosBaseCat = calcularGastosPorCategoria(lancamentos, mesComparacao);

    const porCategoria = categorias
      .map((cat) => {
        const atual = gastosAtualCat[cat.id]?.previsto ?? 0;
        const base = gastosBaseCat[cat.id]?.previsto ?? 0;
        return { categoria: cat, atual, base, diff: arredondar(atual - base) };
      })
      .filter((item) => item.atual > 0 || item.base > 0)
      .sort((a, b) => a.diff - b.diff);

    return {
      gastoAtual,
      gastoBase,
      diferenca,
      percentual,
      melhorou: diferenca <= 0,
      maiorEconomia: porCategoria.find((c) => c.diff < 0),
      maiorAumento: [...porCategoria].reverse().find((c) => c.diff > 0),
    };
  }, [lancamentos, rendas, categorias, mesSelecionado, mesComparacao]);

  // Lista de 6 meses da janela visível no gráfico
  const mesesJanela = useMemo(() => {
    return [-5, -4, -3, -2, -1, 0].map((offset) => {
      const mk = somarMesesMesKey(mesFimJanela, offset);
      const r = calcularResumoMensal(lancamentos, rendas, mk);
      return {
        mesKey: mk,
        totalGasto: r.totalPrevisto,
      };
    });
  }, [lancamentos, rendas, mesFimJanela]);

  const maxValor = Math.max(...mesesJanela.map((m) => m.totalGasto), 1);
  const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <section>
      <SecaoTitulo titulo="Evolução dos gastos" />
      <Painel corBarra="amarelo" tituloJanela="Evolucao_Gastos.chart">
        {/* Filtro para escolher qual mês comparar */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border-[1.5px] border-[#1E1B18] bg-[#F3EFE6] px-2.5 py-2">
          <label htmlFor="filtro-comparacao-mes" className="font-mono text-xs font-extrabold uppercase text-[#1E1B18]">
            Comparar com:
          </label>
          <select
            id="filtro-comparacao-mes"
            value={mesComparacao}
            onChange={(e) => setMesComparacao(e.target.value)}
            className="rounded-md border-[1.5px] border-[#1E1B18] bg-[#FFFDF9] px-2.5 py-1 text-xs font-extrabold text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18] focus:bg-[#FEFCE8] focus:outline-none"
          >
            {opcoesMesesComparacao.map((mk) => (
              <option key={mk} value={mk}>
                {capitalizar(nomeDoMes(mk))}
              </option>
            ))}
          </select>
        </div>

        {/* Resultado da comparação */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-stone-600">
              {capitalizar(nomeDoMes(mesSelecionado))} ({formatarBRL(comparativo.gastoAtual)}) vs{' '}
              {nomeDoMes(mesComparacao)} ({formatarBRL(comparativo.gastoBase)})
            </p>
            <p className="mt-1 text-lg font-extrabold text-[#1E1B18]">
              {comparativo.gastoBase === 0
                ? `Sem gastos registrados em ${nomeDoMes(mesComparacao)}`
                : comparativo.diferenca === 0
                ? 'Mesmo patamar de gastos'
                : comparativo.melhorou
                ? `Vocês economizaram ${formatarBRL(Math.abs(comparativo.diferenca))}`
                : `Gastos subiram ${formatarBRL(comparativo.diferenca)}`}
            </p>
          </div>
          {comparativo.gastoBase > 0 && (
            <Chip tom={comparativo.melhorou ? 'ok' : 'perigo'}>
              {comparativo.melhorou ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
              {comparativo.diferenca > 0 ? '+' : ''}
              {comparativo.percentual}%
            </Chip>
          )}
        </div>

        {/* Barra de navegação para andar para frente ou para trás nos meses do gráfico */}
        <div className="mt-4 flex items-center justify-between border-t-[1.5px] border-dashed border-[#1E1B18]/25 pt-3">
          <button
            type="button"
            onClick={() => setMesFimJanela((prev) => somarMesesMesKey(prev, -1))}
            className="inline-flex items-center gap-1 rounded-md border-[1.5px] border-[#1E1B18] bg-[#FFFDF9] px-2 py-1 text-xs font-extrabold text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18] hover:bg-[#FDE68A]"
            aria-label="Ver meses anteriores"
          >
            <ChevronLeft size={14} /> Anteriores
          </button>

          <span className="font-mono text-[11px] font-bold text-stone-600">
            {nomeDoMes(mesesJanela[0].mesKey).slice(0, 3)} – {nomeDoMes(mesesJanela[5].mesKey).slice(0, 3)}
          </span>

          <button
            type="button"
            onClick={() => setMesFimJanela((prev) => somarMesesMesKey(prev, 1))}
            className="inline-flex items-center gap-1 rounded-md border-[1.5px] border-[#1E1B18] bg-[#FFFDF9] px-2 py-1 text-xs font-extrabold text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18] hover:bg-[#FDE68A]"
            aria-label="Ver próximos meses"
          >
            Próximos <ChevronRight size={14} />
          </button>
        </div>

        {/* Gráfico de barras dos 6 meses visíveis */}
        <div className="mt-3 grid grid-cols-6 items-end gap-2">
          {mesesJanela.map((m) => {
            const alturaPct = Math.max(8, Math.round((m.totalGasto / maxValor) * 100));
            const ehAtual = m.mesKey === mesSelecionado;
            const ehBaseComparacao = m.mesKey === mesComparacao;
            const rotuloMes = nomeDoMes(m.mesKey).slice(0, 3);

            return (
              <button
                key={m.mesKey}
                type="button"
                onClick={() => setMesSelecionado(m.mesKey)}
                className="group flex flex-col items-center gap-1 text-center focus:outline-none"
                title={`Selecionar ${nomeDoMes(m.mesKey)}: ${formatarBRL(m.totalGasto)}`}
              >
                <span className="text-[10px] font-extrabold tabular-nums text-stone-600">
                  {m.totalGasto > 0 ? `${Math.round(m.totalGasto / 100) / 10}k` : '—'}
                </span>
                <div className="flex h-24 w-full items-end justify-center rounded-md border-[1.5px] border-[#1E1B18] bg-[#F3EFE6] p-1">
                  <div
                    className={`w-full rounded-[2px] border border-[#1E1B18] transition-all ${
                      ehAtual
                        ? 'bg-[#C4B5FD]'
                        : ehBaseComparacao
                        ? 'bg-[#FDE68A]'
                        : 'bg-[#BAE6FD] group-hover:bg-[#93C5FD]'
                    }`}
                    style={{ height: `${alturaPct}%` }}
                  />
                </div>
                <span
                  className={`rounded px-1 text-[11px] capitalize ${
                    ehAtual
                      ? 'bg-[#DDD6FE] font-extrabold text-[#1E1B18]'
                      : ehBaseComparacao
                      ? 'bg-[#FDE68A] font-extrabold text-[#1E1B18]'
                      : 'font-semibold text-stone-600'
                  }`}
                >
                  {rotuloMes}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legenda de cores do gráfico */}
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-stone-600">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm border border-[#1E1B18] bg-[#C4B5FD]" /> Mês ativo
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm border border-[#1E1B18] bg-[#FDE68A]" /> Comparado
          </span>
        </div>

        {/* Destaques por categoria */}
        {(comparativo.maiorEconomia || comparativo.maiorAumento) && (
          <div className="mt-3 space-y-1.5 border-t-[1.5px] border-[#1E1B18]/15 pt-3 text-xs">
            {comparativo.maiorEconomia && (
              <p className="font-semibold text-emerald-800">
                <strong>Maior economia:</strong> {comparativo.maiorEconomia.categoria.emoji}{' '}
                {comparativo.maiorEconomia.categoria.nome} ({formatarBRL(Math.abs(comparativo.maiorEconomia.diff))} a menos)
              </p>
            )}
            {comparativo.maiorAumento && (
              <p className="font-semibold text-rose-700">
                <strong>Maior alta:</strong> {comparativo.maiorAumento.categoria.emoji}{' '}
                {comparativo.maiorAumento.categoria.nome} (+{formatarBRL(comparativo.maiorAumento.diff)})
              </p>
            )}
          </div>
        )}
      </Painel>
    </section>
  );
}

function ConsultorIA() {
  const { resumoMes, evolucaoMensal, orcamentos, metasDetalhadas, mesSelecionado } = useFinance();
  const [analise, setAnalise] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function gerarAnalise() {
    setCarregando(true);
    setErro('');
    try {
      const texto = await analisarFinancasCasal({
        resumoMes,
        evolucaoMensal,
        orcamentos,
        metasDetalhadas,
        mesSelecionado,
      });
      setAnalise(texto);
    } catch (e) {
      setErro(e.message || 'Não foi possível gerar a análise agora.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section>
      <SecaoTitulo titulo="Consultor IA do casal" />
      <Painel corBarra="rosa" tituloJanela="FMLY_AI.exe">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-stone-700">
            Diagnóstico rápido dos gastos, orçamentos e metas de {nomeDoMes(mesSelecionado)}.
          </p>
          <Botao variante="primario" tamanho="sm" onClick={gerarAnalise} disabled={carregando}>
            <Sparkles size={14} className="inline" />
            {carregando ? 'Analisando...' : analise ? 'Atualizar' : 'Analisar mês'}
          </Botao>
        </div>
        {erro && <p className="mt-3 text-xs font-bold text-rose-700">{erro}</p>}
        {analise && (
          <div className="mt-4 whitespace-pre-line rounded-lg border-[1.5px] border-[#1E1B18] bg-[#F3EFE6] p-3.5 text-sm leading-relaxed text-[#1E1B18]">
            {analise}
          </div>
        )}
      </Painel>
    </section>
  );
}

function ResumoAcerto() {
  const { acertoMes, mesSelecionado } = useFinance();
  const { percentuais, mensagem, totalCasa, quitado, quitadoEm } = acertoMes;

  return (
    <section>
      <SecaoTitulo titulo="Acerto do casal" linkPara="/acerto" linkTexto="Ver detalhes" />
      <Painel corBarra="azul" tituloJanela="Acerto_Casal.sys">
        <p className="text-xs font-semibold text-stone-600">
          Gastos da casa pagos em {nomeDoMes(mesSelecionado)}: {formatarBRL(totalCasa)}
        </p>
        <p className="mt-1 text-xl font-extrabold leading-snug text-[#1E1B18]">{mensagem}</p>
        {quitado && (
          <Chip tom="ok" className="mt-2">
            <Check size={12} aria-hidden="true" /> Quitado em {formatarData(quitadoEm)}
          </Chip>
        )}
        <div className="mt-4">
          <SplitBar nathalia={percentuais.nathalia} alisson={percentuais.alisson} />
          <div className="mt-1.5 flex justify-between text-xs font-bold text-[#1E1B18]">
            <span>Nathalia {formatarPercentual(percentuais.nathalia)}</span>
            <span>Alisson {formatarPercentual(percentuais.alisson)}</span>
          </div>
        </div>
      </Painel>
    </section>
  );
}

function ProximosVencimentos() {
  const { proximosVencimentos, getCategoria, marcarComoPago } = useFinance();
  const lista = proximosVencimentos.slice(0, 5);

  return (
    <section>
      <SecaoTitulo titulo="Vence nos próximos 7 dias" linkPara="/lancamentos" />
      {lista.length === 0 ? (
        <Painel corBarra="verde" tituloJanela="Vencimentos.log">
          <p className="text-sm font-semibold text-stone-700">Nenhuma conta para pagar nos próximos dias.</p>
        </Painel>
      ) : (
        <Painel corBarra="verde" tituloJanela="Vencimentos.log" className="!p-0">
          <ul className="-m-4 divide-y-2 divide-[#1E1B18]/15">
            {lista.map((item) => {
              const categoria = getCategoria(item.categoriaId);
              return (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xl" aria-hidden="true">
                    {categoria?.emoji ?? '💸'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-[#1E1B18]">{item.descricao}</p>
                    <p className="flex items-center gap-1.5 text-xs text-stone-600">
                      <CalendarClock size={13} aria-hidden="true" />
                      {formatarData(item.data)}
                      {item.atrasado && <Chip tom="perigo">Atrasada</Chip>}
                      {!item.atrasado && item.diasParaVencer === 0 && <Chip tom="alerta">Hoje</Chip>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold tabular-nums text-[#1E1B18]">{formatarBRL(item.valor)}</p>
                    <Botao variante="suave" tamanho="sm" className="mt-1" onClick={() => marcarComoPago(item.id)}>
                      Pagar
                    </Botao>
                  </div>
                </li>
              );
            })}
          </ul>
        </Painel>
      )}
    </section>
  );
}

function OrcamentosEmAlerta() {
  const { orcamentos, getCategoria } = useFinance();
  const alertas = orcamentos
    .filter((o) => o.status === 'atencao' || o.status === 'estourado')
    .sort((a, b) => b.percentualPrevisto - a.percentualPrevisto)
    .slice(0, 4);
  if (alertas.length === 0) return null;

  return (
    <section>
      <SecaoTitulo titulo="Orçamentos para ficar de olho" linkPara="/orcamentos" />
      <Painel corBarra="rosa" tituloJanela="Alertas_Teto.exe">
        <ul className="space-y-4">
          {alertas.map((o) => {
            const categoria = getCategoria(o.categoriaId);
            return (
              <li key={o.categoriaId}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-sm font-extrabold text-[#1E1B18]">
                    {categoria?.emoji} {categoria?.nome}
                  </p>
                  <Chip tom={o.status === 'estourado' ? 'perigo' : 'alerta'}>
                    {formatarPercentual(o.percentualPrevisto, 0)} do teto
                  </Chip>
                </div>
                <ProgressBar fracao={o.percentualPrevisto} tom={tomDoStatus(o.status)} />
                <p className="mt-1 text-xs font-semibold tabular-nums text-stone-600">
                  {formatarBRL(o.previsto)} previstos de {formatarBRL(o.teto)}
                  {o.restante < 0 && ` (passou ${formatarBRL(Math.abs(o.restante))})`}
                </p>
              </li>
            );
          })}
        </ul>
      </Painel>
    </section>
  );
}

function MetasResumo() {
  const { metasDetalhadas } = useFinance();
  if (metasDetalhadas.length === 0) return null;

  return (
    <section>
      <SecaoTitulo titulo="Metas do casal" linkPara="/metas" />
      <Painel corBarra="lilas" tituloJanela="Metas_Casal.dat">
        <ul className="-m-4 divide-y-2 divide-[#1E1B18]/15">
          {metasDetalhadas.map((meta) => (
            <li key={meta.id}>
              <Link to="/metas" className="block px-4 py-3 hover:bg-[#F3EFE6]/60">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-extrabold text-[#1E1B18]">
                    {meta.emoji} {meta.titulo}
                  </p>
                  <ArrowRight size={16} className="shrink-0 text-[#1E1B18]" />
                </div>
                <div className="mt-2">
                  <ProgressBar fracao={meta.progresso.percentual} />
                </div>
                <p className="mt-1.5 text-xs font-semibold tabular-nums text-stone-700">
                  {formatarBRL(meta.progresso.valorAcumulado)} de {formatarBRL(meta.progresso.valorAlvo)} (
                  {formatarPercentual(meta.progresso.percentual, 0)})
                </p>
                {meta.plano.situacao === 'em_andamento' && (
                  <p className="mt-0.5 text-xs text-stone-600">
                    Para chegar em {formatarData(meta.dataAlvo)}, guardem{' '}
                    <strong className="tabular-nums text-[#1E1B18]">{formatarBRL(meta.plano.aporteMensalNecessario)}</strong>{' '}
                    por mês.
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Painel>
    </section>
  );
}

export default function Dashboard() {
  const { perfilAtivo, getPessoa } = useFinance();
  return (
    <div className="space-y-7">
      <h1 className="text-2xl font-extrabold text-[#1E1B18]">Olá, {getPessoa(perfilAtivo)?.nome}</h1>
      <RendaDoMes />
      <EvolucaoGastos />
      <ConsultorIA />
      <ResumoAcerto />
      <ProximosVencimentos />
      <OrcamentosEmAlerta />
      <MetasResumo />
    </div>
  );
}
