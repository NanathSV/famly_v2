import { useFinance } from '../context/FinanceContext';
import { REGRAS_DIVISAO } from '../data/mockData';
import { formatarBRL, formatarPercentual } from '../utils/calculations';
import { SplitBar } from './ui';

export default function RegraDivisaoSelector() {
  const { regraDivisao, proporcaoRenda, percentuaisDivisao, definirRegraDivisao } = useFinance();

  const descricoes = {
    proporcional: `Cada um paga conforme a renda ativa: Nathalia ${formatarBRL(proporcaoRenda.rendaNathalia)} (${formatarPercentual(proporcaoRenda.nathalia)}) e Alisson ${formatarBRL(proporcaoRenda.rendaAlisson)} (${formatarPercentual(proporcaoRenda.alisson)}).`,
    igualitario: 'Os gastos da casa são divididos meio a meio.',
    customizado: 'Você define o percentual de cada um.',
  };

  const percentualNathalia = Math.round(Number(regraDivisao.percentualNathalia) || 0);

  return (
    <fieldset>
      <legend className="sr-only">Regra de divisão dos gastos da casa</legend>
      <div className="space-y-2">
        {REGRAS_DIVISAO.map((regra) => (
          <label
            key={regra.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 ring-inset ring-slate-200 has-[:checked]:bg-brand-50 has-[:checked]:ring-2 has-[:checked]:ring-brand-600"
          >
            <input
              type="radio"
              name="regra-divisao"
              value={regra.id}
              checked={regraDivisao.tipo === regra.id}
              onChange={() => definirRegraDivisao({ tipo: regra.id })}
              className="mt-1 h-4 w-4 border-slate-300 text-brand-600 focus:ring-0"
            />
            <span>
              <span className="block text-sm font-bold text-slate-900">{regra.label}</span>
              <span className="block text-sm text-slate-600">{descricoes[regra.id]}</span>
            </span>
          </label>
        ))}
      </div>

      {regraDivisao.tipo === 'customizado' && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <label htmlFor="pct-nathalia" className="mb-2 block text-sm font-semibold text-slate-700">
            Parte da Nathalia nos gastos da casa
          </label>
          <input
            id="pct-nathalia"
            type="range"
            min={0}
            max={100}
            step={1}
            value={percentualNathalia}
            onChange={(e) => definirRegraDivisao({ tipo: 'customizado', percentualNathalia: Number(e.target.value) })}
            className="w-full accent-brand-600"
          />
          <p className="mt-1 text-sm text-slate-700">
            Nathalia {percentualNathalia}% e Alisson {100 - percentualNathalia}%
          </p>
        </div>
      )}

      <div className="mt-4">
        <SplitBar nathalia={percentuaisDivisao.nathalia} alisson={percentuaisDivisao.alisson} />
        <div className="mt-1.5 flex justify-between text-xs font-semibold text-slate-600">
          <span>Nathalia {formatarPercentual(percentuaisDivisao.nathalia)}</span>
          <span>Alisson {formatarPercentual(percentuaisDivisao.alisson)}</span>
        </div>
      </div>
    </fieldset>
  );
}
