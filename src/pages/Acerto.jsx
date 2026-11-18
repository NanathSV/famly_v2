import { AlertTriangle, Check, RotateCcw } from 'lucide-react';
import RegraDivisaoSelector from '../components/RegraDivisaoSelector';
import { Avatar, Botao, Chip, Painel, SecaoTitulo } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { formatarBRL, formatarData, formatarPercentual, nomeDoMes } from '../utils/calculations';

export default function Acerto() {
  const { acertoMes, lancamentosDoMes, mesSelecionado, getCategoria, quitarAcerto, reabrirAcerto } = useFinance();
  const { totalCasa, quantidadeLancamentos, percentuais, pago, devido, transferencia, mensagem, quitado, quitadoEm, desatualizado } = acertoMes;

  const gastosCasaPagos = lancamentosDoMes.filter((l) => l.pertenceCasa === true && l.status === 'Pago');

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Acerto do Casal</h1>
        <p className="text-sm text-slate-500">Referência: {nomeDoMes(mesSelecionado)} ({quantidadeLancamentos} gastos da casa pagos)</p>
      </div>

      <Painel className={quitado ? 'border-emerald-200 bg-emerald-50/40' : ''}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Resultado do mês</span>
          {quitado ? (
            <Chip tom="ok"><Check size={12} /> Quitado em {formatarData(quitadoEm)}</Chip>
          ) : (
            <Chip tom={transferencia ? 'alerta' : 'ok'}>{transferencia ? 'Acerto pendente' : 'Equilibrado'}</Chip>
          )}
        </div>

        <p className="mt-2 text-2xl font-extrabold leading-snug text-slate-900">{mensagem}</p>

        {desatualizado && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <p>Os gastos da casa mudaram depois que este mês foi quitado. Reabra o acerto se quiser recalcular e registrar o novo valor.</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {!quitado ? (
            <Botao onClick={() => quitarAcerto(mesSelecionado)} disabled={totalCasa <= 0} className="w-full sm:w-auto">
              <Check size={18} />
              {transferencia ? `Marcar transferência de ${formatarBRL(transferencia.valor)} como paga` : 'Confirmar fechamento do mês'}
            </Botao>
          ) : (
            <Botao variante="secundario" tamanho="sm" onClick={() => reabrirAcerto(mesSelecionado)}>
              <RotateCcw size={15} /> Reabrir acerto do mês
            </Botao>
          )}
        </div>
      </Painel>

      <section>
        <SecaoTitulo titulo={`Total da casa pago: ${formatarBRL(totalCasa)}`} />
        <div className="grid gap-3 sm:grid-cols-2">
          {[{ id: 'nathalia', nome: 'Nathalia' }, { id: 'alisson', nome: 'Alisson' }].map((pessoa) => {
            const pagou = pago[pessoa.id];
            const deveria = devido[pessoa.id];
            const diferenca = pagou - deveria;
            return (
              <Painel key={pessoa.id}>
                <div className="flex items-center gap-2.5">
                  <Avatar pessoaId={pessoa.id} />
                  <div>
                    <p className="font-bold text-slate-900">{pessoa.nome}</p>
                    <p className="text-xs text-slate-500">Cota da casa: {formatarPercentual(percentuais[pessoa.id])}</p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Pagou direto:</dt>
                    <dd className="font-bold tabular-nums text-slate-900">{formatarBRL(pagou)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Parte justa pela regra:</dt>
                    <dd className="font-bold tabular-nums text-slate-900">{formatarBRL(deveria)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2">
                    <dt className="font-semibold text-slate-700">Saldo:</dt>
                    <dd className={`font-extrabold tabular-nums ${diferenca > 0 ? 'text-emerald-700' : diferenca < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                      {diferenca > 0 ? `+${formatarBRL(diferenca)} (a receber)` : diferenca < 0 ? `-${formatarBRL(Math.abs(diferenca))} (a pagar)` : 'R$ 0,00'}
                    </dd>
                  </div>
                </dl>
              </Painel>
            );
          })}
        </div>
      </section>

      <section>
        <SecaoTitulo titulo="Regra de divisão aplicada" />
        <Painel><RegraDivisaoSelector /></Painel>
      </section>

      <section>
        <SecaoTitulo titulo="Gastos da casa incluídos neste cálculo" />
        {gastosCasaPagos.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200">Nenhum gasto da casa foi pago neste mês ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
            {gastosCasaPagos.map((item) => {
              const cat = getCategoria(item.categoriaId);
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{cat?.emoji} {item.descricao}</p>
                    <p className="text-xs text-slate-500">{formatarData(item.data)} • Pago por <strong className="capitalize">{item.pagoPor}</strong></p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-slate-900">{formatarBRL(item.valor)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
