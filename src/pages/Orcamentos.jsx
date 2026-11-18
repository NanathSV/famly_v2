import { useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { Botao, Chip, Painel, ProgressBar, classeInput, tomDoStatus } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { formatarBRL, formatarPercentual, nomeDoMes, parseBRL, somarValores } from '../utils/calculations';

export default function Orcamentos() {
  const { orcamentos, mesSelecionado, getCategoria, definirTeto } = useFinance();
  const [editandoId, setEditandoId] = useState(null);
  const [valorInput, setValorInput] = useState('');

  const totalTeto = somarValores(orcamentos, (o) => o.teto);
  const totalPrevisto = somarValores(orcamentos, (o) => o.previsto);
  const totalRealizado = somarValores(orcamentos, (o) => o.realizado);

  const iniciarEdicao = (orc) => {
    setEditandoId(orc.categoriaId);
    setValorInput(orc.teto > 0 ? String(orc.teto).replace('.', ',') : '');
  };

  const salvarEdicao = (categoriaId) => {
    definirTeto(categoriaId, Math.max(0, parseBRL(valorInput)));
    setEditandoId(null);
  };

  const badgeStatus = (status) => {
    if (status === 'estourado') return <Chip tom="perigo">Estourado</Chip>;
    if (status === 'atencao') return <Chip tom="alerta">Atenção</Chip>;
    if (status === 'sem_teto') return <Chip tom="neutro">Sem teto</Chip>;
    return <Chip tom="ok">Dentro do teto</Chip>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Orçamentos</h1>
        <p className="text-sm text-slate-500">Tetos por categoria em {nomeDoMes(mesSelecionado)} (considera pagos + pendentes)</p>
      </div>

      <Painel>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Soma dos tetos</p>
            <p className="mt-0.5 text-base font-extrabold tabular-nums text-slate-900">{formatarBRL(totalTeto)}</p>
          </div>
          <div className="border-x border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Já pago</p>
            <p className="mt-0.5 text-base font-extrabold tabular-nums text-brand-700">{formatarBRL(totalRealizado)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Previsto total</p>
            <p className={`mt-0.5 text-base font-extrabold tabular-nums ${totalPrevisto > totalTeto ? 'text-rose-600' : 'text-emerald-700'}`}>
              {formatarBRL(totalPrevisto)}
            </p>
          </div>
        </div>
      </Painel>

      <ul className="space-y-3">
        {orcamentos.map((orc) => {
          const cat = getCategoria(orc.categoriaId);
          const emEdicao = editandoId === orc.categoriaId;
          return (
            <li key={orc.categoriaId} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat?.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{cat?.nome}</p>
                    <p className="text-xs text-slate-500">{cat?.pertenceCasaPadrao ? 'Casa' : 'Individual'} • {cat?.tipoPadrao}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {badgeStatus(orc.status)}
                  {!emEdicao && (
                    <button type="button" onClick={() => iniciarEdicao(orc)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Editar teto de ${cat?.nome}`}>
                      <Pencil size={15} />
                    </button>
                  )}
                </div>
              </div>

              {emEdicao ? (
                <div className="mt-3 flex items-center gap-2">
                  <input type="text" inputMode="decimal" className={classeInput} value={valorInput} onChange={(e) => setValorInput(e.target.value)} placeholder="0,00" autoFocus />
                  <Botao tamanho="sm" onClick={() => salvarEdicao(orc.categoriaId)}><Check size={16} /> Salvar</Botao>
                  <Botao variante="secundario" tamanho="sm" onClick={() => setEditandoId(null)}>Cancelar</Botao>
                </div>
              ) : (
                <>
                  {orc.teto > 0 && (
                    <div className="mt-3">
                      <ProgressBar fracao={orc.percentualPrevisto} tom={tomDoStatus(orc.status)} />
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                    <span className="text-slate-600">
                      Pago: <strong>{formatarBRL(orc.realizado)}</strong>
                      {orc.pendente > 0 && ` (+ ${formatarBRL(orc.pendente)} pendente)`}
                    </span>
                    {orc.teto > 0 ? (
                      <span className="font-semibold text-slate-800">
                        {formatarBRL(orc.previsto)} / {formatarBRL(orc.teto)} ({formatarPercentual(orc.percentualPrevisto, 0)})
                      </span>
                    ) : (
                      <span className="text-slate-400">Toque no lápis para definir um teto</span>
                    )}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
