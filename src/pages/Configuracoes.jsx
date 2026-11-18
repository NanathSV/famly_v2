import { useState } from 'react';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import RegraDivisaoSelector from '../components/RegraDivisaoSelector';
import { Avatar, Botao, Campo, Painel, SecaoTitulo, classeInput } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { formatarBRL, formatarPercentual, parseBRL } from '../utils/calculations';

export default function Configuracoes() {
  const { pessoas, rendas, proporcaoRenda, adicionarRenda, alternarRendaAtiva, excluirRenda, resetarDados } = useFinance();
  const [novaRenda, setNovaRenda] = useState({ pessoaId: 'nathalia', descricao: '', valor: '' });

  const handleAdicionarRenda = (e) => {
    e.preventDefault();
    const valor = parseBRL(novaRenda.valor);
    if (!novaRenda.descricao.trim() || valor <= 0) return;
    adicionarRenda({ pessoaId: novaRenda.pessoaId, descricao: novaRenda.descricao.trim(), valor, ativa: true });
    setNovaRenda((r) => ({ ...r, descricao: '', valor: '' }));
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500">Rendas do casal, modelo de divisão e dados do aplicativo</p>
      </div>

      <section className="space-y-4">
        <SecaoTitulo titulo="Rendas mensais do casal" />
        <div className="grid gap-4 sm:grid-cols-2">
          {pessoas.map((pessoa) => {
            const rendasPessoa = rendas.filter((r) => r.pessoaId === pessoa.id);
            const totalAtivo = pessoa.id === 'nathalia' ? proporcaoRenda.rendaNathalia : proporcaoRenda.rendaAlisson;
            const pct = pessoa.id === 'nathalia' ? proporcaoRenda.nathalia : proporcaoRenda.alisson;

            return (
              <Painel key={pessoa.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar pessoaId={pessoa.id} />
                    <div>
                      <p className="font-bold text-slate-900">{pessoa.nome}</p>
                      <p className="text-xs text-slate-500">Peso na renda: <strong>{formatarPercentual(pct)}</strong></p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold tabular-nums text-brand-700">{formatarBRL(totalAtivo)}</span>
                </div>

                <ul className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
                  {rendasPessoa.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={r.ativa !== false} onChange={() => alternarRendaAtiva(r.id)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                        <span className={r.ativa !== false ? 'font-medium text-slate-800' : 'text-slate-400 line-through'}>{r.descricao}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="font-bold tabular-nums text-slate-900">{formatarBRL(r.valor)}</span>
                        <button type="button" onClick={() => excluirRenda(r.id)} className="text-slate-400 hover:text-rose-600">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Painel>
            );
          })}
        </div>

        <Painel>
          <form onSubmit={handleAdicionarRenda} className="space-y-3">
            <p className="text-sm font-bold text-slate-900">Adicionar fonte de renda</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo rotulo="Perfil" htmlFor="renda-pessoa">
                <select id="renda-pessoa" className={classeInput} value={novaRenda.pessoaId} onChange={(e) => setNovaRenda((r) => ({ ...r, pessoaId: e.target.value }))}>
                  <option value="nathalia">Nathalia</option>
                  <option value="alisson">Alisson</option>
                </select>
              </Campo>
              <Campo rotulo="Descrição" htmlFor="renda-desc">
                <input id="renda-desc" className={classeInput} placeholder="Ex.: Renda extra / VR" value={novaRenda.descricao} onChange={(e) => setNovaRenda((r) => ({ ...r, descricao: e.target.value }))} />
              </Campo>
              <Campo rotulo="Valor (R$)" htmlFor="renda-val">
                <input id="renda-val" className={classeInput} inputMode="decimal" placeholder="0,00" value={novaRenda.valor} onChange={(e) => setNovaRenda((r) => ({ ...r, valor: e.target.value }))} />
              </Campo>
            </div>
            <Botao type="submit" tamanho="sm"><Plus size={16} /> Adicionar renda</Botao>
          </form>
        </Painel>
      </section>

      <section>
        <SecaoTitulo titulo="Modelo de divisão dos gastos da casa" />
        <Painel><RegraDivisaoSelector /></Painel>
      </section>

      <section>
        <SecaoTitulo titulo="Dados de teste (Simulação local)" />
        <Painel className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Restaurar dados iniciais</p>
            <p className="text-xs text-slate-500">Limpa as alterações salvas no navegador e volta para o cenário padrão de testes.</p>
          </div>
          <Botao
            variante="secundario"
            tamanho="sm"
            onClick={() => {
              if (window.confirm('Restaurar todos os dados iniciais de teste?')) resetarDados();
            }}
          >
            <RotateCcw size={15} /> Resetar dados
          </Botao>
        </Painel>
      </section>
    </div>
  );
}
