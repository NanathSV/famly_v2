import { useState } from 'react';
import { Check, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import RegraDivisaoSelector from '../components/RegraDivisaoSelector';
import { Avatar, Botao, Campo, Painel, SecaoTitulo, classeInput } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { formatarBRL, formatarPercentual, parseBRL } from '../utils/calculations';

export default function Configuracoes() {
  const {
    pessoas,
    rendas,
    proporcaoRenda,
    adicionarRenda,
    atualizarRenda,
    alternarRendaAtiva,
    excluirRenda,
    resetarDados,
  } = useFinance();

  const [novaRenda, setNovaRenda] = useState({ pessoaId: 'nathalia', descricao: '', valor: '' });
  const [rendaEditandoId, setRendaEditandoId] = useState(null);
  const [formEdicaoRenda, setFormEdicaoRenda] = useState({ descricao: '', valor: '' });

  const handleAdicionarRenda = (e) => {
    e.preventDefault();
    const valor = parseBRL(novaRenda.valor);
    if (!novaRenda.descricao.trim() || valor <= 0) return;
    adicionarRenda({ pessoaId: novaRenda.pessoaId, descricao: novaRenda.descricao.trim(), valor, ativa: true });
    setNovaRenda((r) => ({ ...r, descricao: '', valor: '' }));
  };

  const iniciarEdicaoRenda = (renda) => {
    setRendaEditandoId(renda.id);
    setFormEdicaoRenda({
      descricao: renda.descricao,
      valor: String(renda.valor).replace('.', ','),
    });
  };

  const salvarEdicaoRenda = (id) => {
    const valor = parseBRL(formEdicaoRenda.valor);
    if (!formEdicaoRenda.descricao.trim() || valor <= 0) return;
    atualizarRenda(id, { descricao: formEdicaoRenda.descricao.trim(), valor });
    setRendaEditandoId(null);
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1E1B18]">Configurações</h1>
        <p className="text-sm text-stone-600">Rendas do casal, modelo de divisão e dados do aplicativo</p>
      </div>

      <section className="space-y-4">
        <SecaoTitulo titulo="Rendas mensais do casal" />
        <div className="grid gap-4 sm:grid-cols-2">
          {pessoas.map((pessoa) => {
            const rendasPessoa = rendas.filter((r) => r.pessoaId === pessoa.id);
            const totalAtivo = pessoa.id === 'nathalia' ? proporcaoRenda.rendaNathalia : proporcaoRenda.rendaAlisson;
            const pct = pessoa.id === 'nathalia' ? proporcaoRenda.nathalia : proporcaoRenda.alisson;

            return (
              <Painel
                key={pessoa.id}
                corBarra={pessoa.id === 'nathalia' ? 'rosa' : 'lilas'}
                tituloJanela={`Renda_${pessoa.nome}.dat`}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar pessoaId={pessoa.id} />
                    <div>
                      <p className="font-extrabold text-[#1E1B18]">{pessoa.nome}</p>
                      <p className="text-xs text-stone-600">
                        Peso na renda: <strong>{formatarPercentual(pct)}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold tabular-nums text-[#1E1B18]">{formatarBRL(totalAtivo)}</span>
                </div>

                <ul className="divide-y divide-[#1E1B18]/15 border-t-2 border-[#1E1B18]/15 pt-2">
                  {rendasPessoa.map((r) => {
                    const editando = rendaEditandoId === r.id;
                    return (
                      <li key={r.id} className="py-2 text-sm">
                        {editando ? (
                          <div className="space-y-2 rounded-lg border-[1.5px] border-[#1E1B18] bg-[#F3EFE6] p-2">
                            <input
                              className={classeInput}
                              value={formEdicaoRenda.descricao}
                              onChange={(e) => setFormEdicaoRenda((f) => ({ ...f, descricao: e.target.value }))}
                              placeholder="Descrição"
                            />
                            <div className="flex items-center gap-1.5">
                              <input
                                className={classeInput}
                                inputMode="decimal"
                                value={formEdicaoRenda.valor}
                                onChange={(e) => setFormEdicaoRenda((f) => ({ ...f, valor: e.target.value }))}
                                placeholder="0,00"
                              />
                              <button
                                type="button"
                                onClick={() => salvarEdicaoRenda(r.id)}
                                className="rounded-lg border-2 border-[#1E1B18] bg-[#BBF7D0] p-2 text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18]"
                                title="Salvar"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRendaEditandoId(null)}
                                className="rounded-lg border-2 border-[#1E1B18] bg-[#FFFDF9] p-2 text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18]"
                                title="Cancelar"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={r.ativa !== false}
                                onChange={() => alternarRendaAtiva(r.id)}
                                className="h-4 w-4 rounded border-2 border-[#1E1B18]"
                              />
                              <span className={r.ativa !== false ? 'font-bold text-[#1E1B18]' : 'text-stone-400 line-through'}>
                                {r.descricao}
                              </span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold tabular-nums text-[#1E1B18]">{formatarBRL(r.valor)}</span>
                              <button
                                type="button"
                                onClick={() => iniciarEdicaoRenda(r)}
                                className="rounded-md border-[1.5px] border-[#1E1B18] bg-[#FFFDF9] p-1 text-[#1E1B18] hover:bg-[#FDE68A]"
                                title="Editar renda"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => excluirRenda(r.id)}
                                className="rounded-md border-[1.5px] border-[#1E1B18] bg-[#FFFDF9] p-1 text-[#1E1B18] hover:bg-[#FDA4AF]"
                                title="Excluir renda"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Painel>
            );
          })}
        </div>

        <Painel corBarra="amarelo" tituloJanela="Nova_Renda.exe">
          <form onSubmit={handleAdicionarRenda} className="space-y-3">
            <p className="text-sm font-extrabold text-[#1E1B18]">Adicionar fonte de renda</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo rotulo="Perfil" htmlFor="renda-pessoa">
                <select
                  id="renda-pessoa"
                  className={classeInput}
                  value={novaRenda.pessoaId}
                  onChange={(e) => setNovaRenda((r) => ({ ...r, pessoaId: e.target.value }))}
                >
                  <option value="nathalia">Nathalia</option>
                  <option value="alisson">Alisson</option>
                </select>
              </Campo>
              <Campo rotulo="Descrição" htmlFor="renda-desc">
                <input
                  id="renda-desc"
                  className={classeInput}
                  placeholder="Ex.: Renda extra / VR"
                  value={novaRenda.descricao}
                  onChange={(e) => setNovaRenda((r) => ({ ...r, descricao: e.target.value }))}
                />
              </Campo>
              <Campo rotulo="Valor (R$)" htmlFor="renda-val">
                <input
                  id="renda-val"
                  className={classeInput}
                  inputMode="decimal"
                  placeholder="0,00"
                  value={novaRenda.valor}
                  onChange={(e) => setNovaRenda((r) => ({ ...r, valor: e.target.value }))}
                />
              </Campo>
            </div>
            <Botao type="submit" tamanho="sm">
              <Plus size={16} /> Adicionar renda
            </Botao>
          </form>
        </Painel>
      </section>

      <section>
        <SecaoTitulo titulo="Modelo de divisão dos gastos da casa" />
        <Painel corBarra="azul" tituloJanela="Divisao_Casal.sys">
          <RegraDivisaoSelector />
        </Painel>
      </section>

      <section>
        <SecaoTitulo titulo="Dados do aplicativo" />
        <Painel corBarra="verde" tituloJanela="Sistema_Reset.cfg" className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-[#1E1B18]">Restaurar dados iniciais</p>
            <p className="text-xs text-stone-600">Limpa as alterações salvas e volta para o cenário padrão.</p>
          </div>
          <Botao
            variante="secundario"
            tamanho="sm"
            onClick={() => {
              if (window.confirm('Restaurar todos os dados iniciais?')) resetarDados();
            }}
          >
            <RotateCcw size={15} /> Resetar dados
          </Botao>
        </Painel>
      </section>
    </div>
  );
}
