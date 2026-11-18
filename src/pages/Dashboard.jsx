import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Check, TrendingDown, TrendingUp } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatarBRL, formatarData, formatarPercentual, nomeDoMes } from '../utils/calculations';
import { Botao, Chip, Painel, ProgressBar, SecaoTitulo, SplitBar, tomDoStatus } from '../components/ui';

function Legenda({ cor, rotulo, valor }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-3 w-3 shrink-0 rounded-sm ${cor}`} aria-hidden="true" />
      <span className="text-slate-600">{rotulo}</span>
      <span className="ml-auto font-bold tabular-nums text-slate-900">{valor}</span>
    </div>
  );
}

function RendaDoMes() {
  const { resumoMes } = useFinance();
  const { receita, totalPago, totalPendente, totalPrevisto, saldoPrevisto } = resumoMes;
  const base = Math.max(receita, totalPrevisto) || 1;
  const faltou = saldoPrevisto < 0;

  return (
    <Painel>
      <p className="text-lg leading-snug text-slate-800">
        Entram <strong className="tabular-nums">{formatarBRL(receita)}</strong> neste mês. Já saíram{' '}
        <strong className="tabular-nums">{formatarBRL(totalPago)}</strong> e ainda vão sair{' '}
        <strong className="tabular-nums">{formatarBRL(totalPendente)}</strong>.
      </p>
      <p className={`mt-1 text-lg font-extrabold tabular-nums ${faltou ? 'text-rose-600' : 'text-emerald-700'}`}>
        {faltou ? `Faltam ${formatarBRL(Math.abs(saldoPrevisto))}` : `Sobram ${formatarBRL(saldoPrevisto)}`}
      </p>
      <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full bg-emerald-100">
        <div className="bg-brand-600" style={{ width: `${(totalPago / base) * 100}%` }} />
        <div className="bg-brand-300" style={{ width: `${(totalPendente / base) * 100}%` }} />
      </div>
      <div className="mt-3 space-y-1.5">
        <Legenda cor="bg-brand-600" rotulo="Pago" valor={formatarBRL(totalPago)} />
        <Legenda cor="bg-brand-300" rotulo="A pagar" valor={formatarBRL(totalPendente)} />
        <Legenda cor="bg-emerald-100" rotulo="Livre" valor={formatarBRL(Math.max(0, saldoPrevisto))} />
      </div>
    </Painel>
  );
}

function EvolucaoGastos() {
  const { evolucaoMensal, mesSelecionado, setMesSelecionado } = useFinance();
  const { mesAnteriorKey, gastoAnterior, diferenca, percentual, melhorou, historicoMeses, comparativoCategorias } = evolucaoMensal;

  const maxValor = Math.max(...historicoMeses.map((m) => m.totalGasto), 1);
  const maiorEconomia = comparativoCategorias.find((c) => c.diff < 0);
  const maiorAumento = [...comparativoCategorias].reverse().find((c) => c.diff > 0);

  return (
    <section>
      <SecaoTitulo titulo="Evolução dos gastos" />
      <Painel>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Comparado a {nomeDoMes(mesAnteriorKey)} ({formatarBRL(gastoAnterior)})
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
              {gastoAnterior === 0
                ? 'Sem histórico no mês anterior'
                : melhorou
                ? `Vocês economizaram ${formatarBRL(Math.abs(diferenca))}`
                : `Gastos subiram ${formatarBRL(diferenca)}`}
            </p>
          </div>
          {gastoAnterior > 0 && (
            <Chip tom={melhorou ? 'ok' : 'perigo'}>
              {melhorou ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
              {diferenca > 0 ? '+' : ''}
              {percentual}%
            </Chip>
          )}
        </div>

        {/* Gráfico de barras dos últimos 6 meses (clicável para navegar no mês) */}
        <div className="mt-5 grid grid-cols-6 items-end gap-2 pt-2">
          {historicoMeses.map((m) => {
            const alturaPct = Math.max(8, Math.round((m.totalGasto / maxValor) * 100));
            const selecionado = m.mesKey === mesSelecionado;
            const rotuloMes = nomeDoMes(m.mesKey).slice(0, 3);
            return (
              <button
                key={m.mesKey}
                type="button"
                onClick={() => setMesSelecionado(m.mesKey)}
                className="group flex flex-col items-center gap-1.5 text-center focus:outline-none"
                title={`${nomeDoMes(m.mesKey)}: ${formatarBRL(m.totalGasto)}`}
              >
                <span className="text-[10px] font-bold tabular-nums text-slate-500">
                  {m.totalGasto > 0 ? `${Math.round(m.totalGasto / 100) / 10}k` : '—'}
                </span>
                <div className="flex h-24 w-full items-end justify-center rounded-lg bg-slate-100 p-1">
                  <div
                    className={`w-full rounded-md transition-all ${
                      selecionado ? 'bg-brand-600' : 'bg-brand-300 group-hover:bg-brand-400'
                    }`}
                    style={{ height: `${alturaPct}%` }}
                  />
                </div>
                <span className={`text-xs capitalize ${selecionado ? 'font-extrabold text-brand-700' : 'font-medium text-slate-600'}`}>
                  {rotuloMes}
                </span>
              </button>
            );
          })}
        </div>

        {(maiorEconomia || maiorAumento) && (
          <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
            {maiorEconomia && (
              <p className="text-emerald-700">
                <strong>Maior economia:</strong> {maiorEconomia.categoria.emoji} {maiorEconomia.categoria.nome} (
                {formatarBRL(Math.abs(maiorEconomia.diff))} a menos)
              </p>
            )}
            {maiorAumento && (
              <p className="text-rose-600">
                <strong>Maior alta:</strong> {maiorAumento.categoria.emoji} {maiorAumento.categoria.nome} (+
                {formatarBRL(maiorAumento.diff)})
              </p>
            )}
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
      <Painel>
        <p className="text-xs font-semibold text-slate-500">
          Gastos da casa pagos em {nomeDoMes(mesSelecionado)}: {formatarBRL(totalCasa)}
        </p>
        <p className="mt-1 text-xl font-extrabold leading-snug text-slate-900">{mensagem}</p>
        {quitado && (
          <Chip tom="ok" className="mt-2">
            <Check size={12} aria-hidden="true" /> Quitado em {formatarData(quitadoEm)}
          </Chip>
        )}
        <div className="mt-4">
          <SplitBar nathalia={percentuais.nathalia} alisson={percentuais.alisson} />
          <div className="mt-1.5 flex justify-between text-xs font-semibold text-slate-600">
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
        <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200">
          Nenhuma conta para pagar nos próximos dias.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
          {lista.map((item) => {
            const categoria = getCategoria(item.categoriaId);
            return (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl" aria-hidden="true">{categoria?.emoji ?? '💸'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{item.descricao}</p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarClock size={13} aria-hidden="true" />
                    {formatarData(item.data)}
                    {item.atrasado && <Chip tom="perigo">Atrasada</Chip>}
                    {!item.atrasado && item.diasParaVencer === 0 && <Chip tom="alerta">Hoje</Chip>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums text-slate-900">{formatarBRL(item.valor)}</p>
                  <Botao variante="suave" tamanho="sm" className="mt-1" onClick={() => marcarComoPago(item.id)}>
                    Pagar
                  </Botao>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function OrcamentosEmAlerta() {
  const { orcamentos, getCategoria } = useFinance();
  const alertas = orcamentos.filter((o) => o.status === 'atencao' || o.status === 'estourado').sort((a, b) => b.percentualPrevisto - a.percentualPrevisto).slice(0, 4);
  if (alertas.length === 0) return null;

  return (
    <section>
      <SecaoTitulo titulo="Orçamentos para ficar de olho" linkPara="/orcamentos" />
      <ul className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        {alertas.map((o) => {
          const categoria = getCategoria(o.categoriaId);
          return (
            <li key={o.categoriaId}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">{categoria?.emoji} {categoria?.nome}</p>
                <Chip tom={o.status === 'estourado' ? 'perigo' : 'alerta'}>{formatarPercentual(o.percentualPrevisto, 0)} do teto</Chip>
              </div>
              <ProgressBar fracao={o.percentualPrevisto} tom={tomDoStatus(o.status)} />
              <p className="mt-1 text-xs tabular-nums text-slate-500">
                {formatarBRL(o.previsto)} previstos de {formatarBRL(o.teto)}
                {o.restante < 0 && ` (passou ${formatarBRL(Math.abs(o.restante))})`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MetasResumo() {
  const { metasDetalhadas } = useFinance();
  if (metasDetalhadas.length === 0) return null;

  return (
    <section>
      <SecaoTitulo titulo="Metas do casal" linkPara="/metas" />
      <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
        {metasDetalhadas.map((meta) => (
          <li key={meta.id}>
            <Link to="/metas" className="block px-4 py-3 hover:bg-slate-50">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">{meta.emoji} {meta.titulo}</p>
                <ArrowRight size={16} className="shrink-0 text-slate-400" />
              </div>
              <div className="mt-2">
                <ProgressBar fracao={meta.progresso.percentual} />
              </div>
              <p className="mt-1.5 text-xs tabular-nums text-slate-600">
                {formatarBRL(meta.progresso.valorAcumulado)} de {formatarBRL(meta.progresso.valorAlvo)} ({formatarPercentual(meta.progresso.percentual, 0)})
              </p>
              {meta.plano.situacao === 'em_andamento' && (
                <p className="mt-0.5 text-xs text-slate-600">
                  Para chegar em {formatarData(meta.dataAlvo)}, guardem <strong className="tabular-nums">{formatarBRL(meta.plano.aporteMensalNecessario)}</strong> por mês.
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Dashboard() {
  const { perfilAtivo, getPessoa } = useFinance();
  return (
    <div className="space-y-7">
      <h1 className="text-2xl font-extrabold text-slate-900">Olá, {getPessoa(perfilAtivo)?.nome}</h1>
      <RendaDoMes />
      <EvolucaoGastos />
      <ResumoAcerto />
      <ProximosVencimentos />
      <OrcamentosEmAlerta />
      <MetasResumo />
    </div>
  );
}
