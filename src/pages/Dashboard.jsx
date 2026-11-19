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

function listarIntervaloMeses(inicioKey, fimKey) {
  if (inicioKey > fimKey) return [inicioKey];
  const lista = [];
  let atual = inicioKey;
  let trava = 0;
  while (atual <= fimKey && trava < 24) {
    lista.push(atual);
    atual = somarMesesMesKey(atual, 1);
    trava++;
  }
  return lista;
}

function EvolucaoGastos() {
  const { lancamentos, rendas, categorias, mesSelecionado, setMesSelecionado } = useFinance();

  // Intervalo padrão: últimos 6 meses terminando no mês selecionado
  const [mesInicio, setMesInicio] = useState(() => somarMesesMesKey(mesSelecionado, -5));
  const [mesFim, setMesFim] = useState(mesSelecionado);

  useEffect(() => {
    setMesInicio(somarMesesMesKey(mesSelecionado, -5));
    setMesFim(mesSelecionado);
  }, [mesSelecionado]);

  // Opções para os selects (18 meses para trás até 6 meses para frente)
  const opcoesMeses = useMemo(() => {
    const opcoes = [];
    for (let offset = -18; offset <= 6; offset++) {
      opcoes.push(somarMesesMesKey(mesSelecionado, offset));
    }
    return opcoes;
  }, [mesSelecionado]);

  function handleChangeInicio(novoInicio) {
    setMesInicio(novoInicio);
    if (novoInicio > mesFim) {
      setMesFim(novoInicio);
    }
  }

  function handleChangeFim(novoFim) {
    setMesFim(novoFim);
    if (novoFim < mesInicio) {
      setMesInicio(novoFim);
    }
  }

  function moverIntervalo(direcao) {
    setMesInicio((prev) => somarMesesMesKey(prev, direcao));
    setMesFim((prev) => somarMesesMesKey(prev, direcao));
  }

  // Dados de cada mês dentro do intervalo [mesInicio .. mesFim]
  const mesesIntervalo = useMemo(() => {
    return listarIntervaloMeses(mesInicio, mesFim).map((mk) => {
      const r = calcularResumoMensal(lancamentos, rendas, mk);
      return {
        mesKey: mk,
        totalGasto: r.totalPrevisto,
      };
    });
  }, [lancamentos, rendas, mesInicio, mesFim]);

  // Métricas consolidadas do intervalo e variação entre o 1º e o último mês selecionados
  const resumoIntervalo = useMemo(() => {
    const totalPeriodo = arredondar(mesesIntervalo.reduce((acc, m) => acc + m.totalGasto, 0));
    const qtdMeses = mesesIntervalo.length || 1;
    const mediaMensal = arredondar(totalPeriodo / qtdMeses);

    const primeiro = mesesIntervalo[0];
    const ultimo = mesesIntervalo[mesesIntervalo.length - 1];
    const gastoPrimeiro = primeiro?.totalGasto ?? 0;
    const gastoUltimo = ultimo?.totalGasto ?? 0;
    const diferenca = arredondar(gastoUltimo - gastoPrimeiro);
    const percentual = gastoPrimeiro > 0 ? arredondar((diferenca / gastoPrimeiro) * 100, 1) : 0;

    // Comparativo por categoria entre o mês inicial ("De") e o mês final ("Até")
    const gastosInicioCat = calcularGastosPorCategoria(lancamentos, mesInicio);
    const gastosFimCat = calcularGastosPorCategoria(lancamentos, mesFim);

    const porCategoria = categorias
      .map((cat) => {
        const inicioVal = gastosInicioCat[cat.id]?.previsto ?? 0;
        const fimVal = gastosFimCat[cat.id]?.previsto ?? 0;
        return { categoria: cat, inicioVal, fimVal, diff: arredondar(fimVal - inicioVal) };
      })
      .filter((item) => item.inicioVal > 0 || item.fimVal > 0)
      .sort((a, b) => a.diff - b.diff);

    return {
      totalPeriodo,
      mediaMensal,
      qtdMeses,
      gastoPrimeiro,
      gastoUltimo,
      diferenca,
      percentual,
      melhorou: diferenca <= 0,
      maiorEconomia: porCategoria.find((c) => c.diff < 0),
      maiorAumento: [...porCategoria].reverse().find((c) => c.diff > 0),
    };
  }, [mesesIntervalo, lancamentos, categorias, mesInicio, mesFim]);

  const maxValor = Math.max(...mesesIntervalo.map((m) => m.totalGasto), 1);
  const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const mesmoMes = mesInicio === mesFim;

  return (
    <section>
      <SecaoTitulo titulo="Evolução dos gastos" />
      <Painel corBarra="amarelo" tituloJanela="Evolucao_Gastos.chart">
        {/* Filtro de período: De [Mês] Até [Mês] */}
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg border-[1.5px] border-[#1E1B18] bg-[#F3EFE6] p-2.5">
          <div className="flex flex-col gap-1">
            <label htmlFor="filtro-mes-de" className="font-mono text-[11px] font-extrabold uppercase text-[#1E1B18]">
              De:
            </label>
            <select
              id="filtro-mes-de"
              value={mesInicio}
              onChange={(e) => handleChangeInicio(e.target.value)}
              className="w-full rounded-md border-[1.5px] border-[#1E1B18] bg-[#FFFDF9] px-2 py-1 text-xs font-extrabold text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18] focus:bg-[#FEFCE8] focus:outline-none"
            >
              {opcoesMeses.map((mk) => (
                <option key={mk} value={mk}>
                  {capitalizar(nomeDoMes(mk))}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filtro-mes-ate" className="font-mono text-[11px] font-extrabold uppercase text-[#1E1B18]">
              Até:
            </label>
            <select
              id="filtro-mes-ate"
              value={mesFim}
              onChange={(e) => handleChangeFim(e.target.value)}
              className="w-full rounded-md border-[1.5px] border-[#1E1B18] bg-[#FFFDF9] px-2 py-1 text-xs font-extrabold text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18] focus:bg-[#FEFCE8] focus:outline-none"
            >
              {opcoesMeses.map((mk) => (
                <option key={mk} value={mk}>
                  {capitalizar(nomeDoMes(mk))}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumo numérico do intervalo selecionado */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-stone-600">
              {mesmoMes
                ? `Total em ${nomeDoMes(mesInicio)}`
                : `Total em ${resumoIntervalo.qtdMeses} meses (${nomeDoMes(mesInicio).slice(0, 3)} a ${nomeDoMes(mesFim).slice(0, 3)})`}
            </p>
            <p className="mt-0.5 text-xl font-extrabold tabular-nums text-[#1E1B18]">
              {formatarBRL(resumoIntervalo.totalPeriodo)}
              {!mesmoMes && (
                <span className="ml-2 text-xs font-bold text-stone-600">
                  (média {formatarBRL(resumoIntervalo.mediaMensal)}/mês)
                </span>
              )}
            </p>
            {!mesmoMes && resumoIntervalo.gastoPrimeiro > 0 && (
              <p className="mt-0.5 text-xs font-semibold text-stone-700">
                {resumoIntervalo.diferenca === 0
                  ? `Mesmo valor entre ${nomeDoMes(mesInicio)} e ${nomeDoMes(mesFim)}`
                  : resumoIntervalo.melhorou
                  ? `Redução de ${formatarBRL(Math.abs(resumoIntervalo.diferenca))} de ${nomeDoMes(mesInicio).slice(0, 3)} para ${nomeDoMes(mesFim).slice(0, 3)}`
                  : `Aumento de ${formatarBRL(resumoIntervalo.diferenca)} de ${nomeDoMes(mesInicio).slice(0, 3)} para ${nomeDoMes(mesFim).slice(0, 3)}`}
              </p>
            )}
          </div>

          {!mesmoMes && resumoIntervalo.gastoPrimeiro > 0 && (
            <Chip tom={resumoIntervalo.melhorou ? 'ok' : 'perigo'}>
              {resumoIntervalo.melhorou ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
              {resumoIntervalo.diferenca > 0 ? '+' : ''}
              {resumoIntervalo.percentual}%
            </Chip>
          )}
        </div>

        {/* Botões para deslizar o intervalo para trás ou para frente */}
        <div className="mt-4 flex items-center justify-between border-t-[1.5px] border-dashed border-[#1E1B18]/25 pt-3">
          <button
            type="button"
            onClick={() => moverIntervalo(-1)}
            className="inline-flex items-center gap-1 rounded-md border-[1.5px] border-[#1E1B18] bg-[#FFFDF9] px-2.5 py-1 text-xs font-extrabold text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18] hover:bg-[#FDE68A]"
            aria-label="Recuar período em 1 mês"
          >
            <ChevronLeft size={14} /> Anterior
          </button>

          <span className="font-mono text-[11px] font-bold text-stone-600">
            {mesmoMes
              ? nomeDoMes(mesInicio)
              : `${nomeDoMes(mesInicio).slice(0, 3)} – ${nomeDoMes(mesFim).slice(0, 3)}`}
          </span>

          <button
            type="button"
            onClick={() => moverIntervalo(1)}
            className="inline-flex items-center gap-1 rounded-md border-[1.5px] border-[#1E1B18] bg-[#FFFDF9] px-2.5 py-1 text-xs font-extrabold text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18] hover:bg-[#FDE68A]"
            aria-label="Avançar período em 1 mês"
          >
            Próximo <ChevronRight size={14} />
          </button>
        </div>

        {/* Gráfico de barras adaptável ao número de meses do intervalo */}
        <div className="mt-3 overflow-x-auto pb-1">
          <div
            className="grid items-end gap-2"
            style={{
              gridTemplateColumns: `repeat(${mesesIntervalo.length}, minmax(42px, 1fr))`,
            }}
          >
            {mesesIntervalo.map((m) => {
              const alturaPct = Math.max(8, Math.round((m.totalGasto / maxValor) * 100));
              const ehMesAtivoApp = m.mesKey === mesSelecionado;
              const rotuloMes = nomeDoMes(m.mesKey).slice(0, 3);
              const anoCurto = m.mesKey.slice(2, 4);

              return (
                <button
                  key={m.mesKey}
                  type="button"
                  onClick={() => setMesSelecionado(m.mesKey)}
                  className="group flex flex-col items-center gap-1 text-center focus:outline-none"
                  title={`Abrir ${nomeDoMes(m.mesKey)}: ${formatarBRL(m.totalGasto)}`}
                >
                  <span className="text-[10px] font-extrabold tabular-nums text-stone-600">
                    {m.totalGasto > 0 ? `${Math.round(m.totalGasto / 100) / 10}k` : '—'}
                  </span>
                  <div className="flex h-24 w-full items-end justify-center rounded-md border-[1.5px] border-[#1E1B18] bg-[#F3EFE6] p-1">
                    <div
                      className={`w-full rounded-[2px] border border-[#1E1B18] transition-all ${
                        ehMesAtivoApp ? 'bg-[#C4B5FD]' : 'bg-[#BAE6FD] group-hover:bg-[#FDE68A]'
                      }`}
                      style={{ height: `${alturaPct}%` }}
                    />
                  </div>
                  <span
                    className={`rounded px-1 text-[10px] capitalize ${
                      ehMesAtivoApp ? 'bg-[#DDD6FE] font-extrabold text-[#1E1B18]' : 'font-bold text-stone-700'
                    }`}
                  >
                    {rotuloMes}/{anoCurto}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Destaques por categoria entre o mês inicial e o final */}
        {!mesmoMes && (resumoIntervalo.maiorEconomia || resumoIntervalo.maiorAumento) && (
          <div className="mt-3 space-y-1.5 border-t-[1.5px] border-[#1E1B18]/15 pt-3 text-xs">
            {resumoIntervalo.maiorEconomia && (
              <p className="font-semibold text-emerald-800">
                <strong>Maior queda ({nomeDoMes(mesInicio).slice(0, 3)} → {nomeDoMes(mesFim).slice(0, 3)}):</strong>{' '}
                {resumoIntervalo.maiorEconomia.categoria.emoji} {resumoIntervalo.maiorEconomia.categoria.nome} (
                {formatarBRL(Math.abs(resumoIntervalo.maiorEconomia.diff))} a menos)
              </p>
            )}
            {resumoIntervalo.maiorAumento && (
              <p className="font-semibold text-rose-700">
                <strong>Maior alta ({nomeDoMes(mesInicio).slice(0, 3)} → {nomeDoMes(mesFim).slice(0, 3)}):</strong>{' '}
                {resumoIntervalo.maiorAumento.categoria.emoji} {resumoIntervalo.maiorAumento.categoria.nome} (+
                {formatarBRL(resumoIntervalo.maiorAumento.diff)})
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
