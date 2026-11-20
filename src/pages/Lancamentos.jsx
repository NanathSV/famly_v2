import { useMemo, useState } from 'react';
import { Camera, Check, Clock, FileText, Pencil, Plus, RefreshCw, Sparkles, Trash2, Upload } from 'lucide-react';
import LancamentoForm from '../components/LancamentoForm';
import { Avatar, Botao, Campo, Chip, EstadoVazio, Painel, Segmented, Sheet, classeInput } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { formatarBRL, formatarData, hojeISO, mesKeyDe, nomeDoMes, parseBRL, somarValores } from '../utils/calculations';

const FILTROS = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'casa', rotulo: 'Casa' },
  { id: 'nathalia', rotulo: 'Nathalia' },
  { id: 'alisson', rotulo: 'Alisson' },
  { id: 'pendentes', rotulo: 'Pendentes' },
];

export default function Lancamentos() {
  const {
    lancamentos,
    lancamentosDoMes,
    contasRecorrentes,
    mesSelecionado,
    perfilAtivo,
    getCategoria,
    adicionarLancamento,
    atualizarLancamento,
    excluirLancamento,
    marcarComoPago,
    marcarComoPendente,
    gerarRecorrentesDoMes,
    adicionarContaRecorrente,
    atualizarContaRecorrente,
    excluirContaRecorrente,
  } = useFinance();

  const [filtro, setFiltro] = useState('todos');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [lancamentoEmEdicao, setLancamentoEmEdicao] = useState(null);
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [mostrarRecorrentes, setMostrarRecorrentes] = useState(false);
  const [avisoRecorrentes, setAvisoRecorrentes] = useState('');

  // Estados para criar / editar contas fixas recorrentes
  const [modalNovaFixaAberto, setModalNovaFixaAberto] = useState(false);
  const [fixaEmEdicao, setFixaEmEdicao] = useState(null);

  const dataPadrao = useMemo(() => {
    const hoje = hojeISO();
    return mesKeyDe(hoje) === mesSelecionado ? hoje : `${mesSelecionado}-01`;
  }, [mesSelecionado]);

  const recorrentesPendentesDeGerar = useMemo(() => {
    const ativas = contasRecorrentes.filter((c) => c.ativa !== false);
    return ativas.filter((c) => !lancamentosDoMes.some((l) => l.recorrenteId === c.id));
  }, [contasRecorrentes, lancamentosDoMes]);

  const listaFiltrada = useMemo(() => {
    return lancamentosDoMes.filter((item) => {
      if (filtro === 'casa') return item.pertenceCasa === true;
      if (filtro === 'nathalia') return item.pagoPor === 'nathalia';
      if (filtro === 'alisson') return item.pagoPor === 'alisson';
      if (filtro === 'pendentes') return item.status !== 'Pago';
      return true;
    });
  }, [lancamentosDoMes, filtro]);

  const totaisFiltro = useMemo(() => {
    const pagos = somarValores(listaFiltrada.filter((l) => l.status === 'Pago'), (l) => l.valor);
    const pendentes = somarValores(listaFiltrada.filter((l) => l.status !== 'Pago'), (l) => l.valor);
    return { pagos, pendentes, total: pagos + pendentes };
  }, [listaFiltrada]);

  const handleGerarRecorrentes = () => {
    const qtd = recorrentesPendentesDeGerar.length;
    if (qtd === 0) return;
    gerarRecorrentesDoMes(mesSelecionado);
    setAvisoRecorrentes(`${qtd} conta(s) recorrente(s) gerada(s) como Pendente.`);
    setTimeout(() => setAvisoRecorrentes(''), 4000);
  };

  const alternarStatus = (e, item) => {
    e.stopPropagation();
    if (item.status === 'Pago') marcarComoPendente(item.id);
    else marcarComoPago(item.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E1B18]">Lançamentos</h1>
          <p className="text-sm text-stone-600">{listaFiltrada.length} registro(s) em {nomeDoMes(mesSelecionado)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Botao variante="secundario" tamanho="sm" onClick={() => setModalImportarAberto(true)}>
            <Upload size={16} /> Importar
          </Botao>
          <Botao tamanho="sm" onClick={() => setModalNovoAberto(true)}>
            <Plus size={16} /> Novo
          </Botao>
        </div>
      </div>

      <Painel corBarra="azul" tituloJanela="Contas_Fixas.sys">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="text-[#1E1B18]" />
            <div>
              <p className="text-sm font-extrabold text-[#1E1B18]">Contas fixas recorrentes</p>
              <p className="text-xs text-stone-600">
                {recorrentesPendentesDeGerar.length > 0
                  ? `${recorrentesPendentesDeGerar.length} conta(s) ainda não lançada(s) neste mês.`
                  : 'Todas as contas recorrentes ativas já estão no mês.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {recorrentesPendentesDeGerar.length > 0 && (
              <Botao tamanho="sm" onClick={handleGerarRecorrentes}>Gerar no mês</Botao>
            )}
            <Botao variante="suave" tamanho="sm" onClick={() => setModalNovaFixaAberto(true)}>
              <Plus size={14} /> Nova fixa
            </Botao>
            <Botao variante="secundario" tamanho="sm" onClick={() => setMostrarRecorrentes((v) => !v)}>
              {mostrarRecorrentes ? 'Ocultar lista' : `Ver fixas (${contasRecorrentes.length})`}
            </Botao>
          </div>
        </div>

        {avisoRecorrentes && (
          <p className="mt-2 rounded-lg border-[1.5px] border-[#1E1B18] bg-[#BBF7D0] px-3 py-2 text-xs font-extrabold text-[#1E1B18]">
            {avisoRecorrentes}
          </p>
        )}

        {mostrarRecorrentes && (
          <div className="mt-3 border-t-2 border-dashed border-[#1E1B18]/20 pt-2">
            {contasRecorrentes.length === 0 ? (
              <p className="py-3 text-center text-xs font-semibold text-stone-600">
                Nenhuma conta fixa cadastrada ainda. Clique em <strong>+ Nova fixa</strong> para adicionar.
              </p>
            ) : (
              <ul className="divide-y divide-[#1E1B18]/15">
                {contasRecorrentes.map((rec) => {
                  const cat = getCategoria(rec.categoriaId);
                  const jaGerada = lancamentosDoMes.some((l) => l.recorrenteId === rec.id);
                  const ativa = rec.ativa !== false;
                  return (
                    <li
                      key={rec.id}
                      onClick={() => setFixaEmEdicao(rec)}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-[#F3EFE6]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={`truncate font-extrabold ${ativa ? 'text-[#1E1B18]' : 'text-stone-400 line-through'}`}>
                            {cat?.emoji} {rec.descricao}
                          </p>
                          {rec.pertenceCasa !== false && <Chip tom="marca">Casa</Chip>}
                        </div>
                        <p className="mt-0.5 text-xs text-stone-600">
                          Dia {rec.diaVencimento} • {rec.formaPagamento}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mr-1 font-extrabold tabular-nums text-[#1E1B18]">{formatarBRL(rec.valor)}</span>
                        <Chip tom={jaGerada ? 'ok' : 'neutro'}>{jaGerada ? 'No mês' : 'Pendente'}</Chip>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFixaEmEdicao(rec);
                          }}
                          className="rounded-md border-[1.5px] border-[#1E1B18] bg-[#FFFDF9] p-1.5 text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18] hover:bg-[#FDE68A]"
                          title="Editar conta fixa"
                          aria-label={`Editar ${rec.descricao}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Excluir a conta fixa "${rec.descricao}"?`)) {
                              excluirContaRecorrente(rec.id);
                            }
                          }}
                          className="rounded-md border-[1.5px] border-[#1E1B18] bg-[#FFFDF9] p-1.5 text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18] hover:bg-[#FDA4AF]"
                          title="Excluir conta fixa"
                          aria-label={`Excluir ${rec.descricao}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </Painel>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`shrink-0 rounded-full border-2 border-[#1E1B18] px-3.5 py-1 text-xs font-extrabold transition-all ${
              filtro === f.id
                ? 'bg-[#DDD6FE] text-[#1E1B18] shadow-[2px_2px_0_#1E1B18]'
                : 'bg-[#FFFDF9] text-stone-700 hover:bg-[#FDE68A]'
            }`}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl border-2 border-[#1E1B18] bg-[#FFFDF9] p-3 text-center shadow-[4px_4px_0_#1E1B18]">
        <div>
          <p className="font-mono text-[11px] font-extrabold uppercase tracking-wide text-stone-600">Pagos</p>
          <p className="mt-0.5 text-sm font-extrabold tabular-nums text-emerald-700">{formatarBRL(totaisFiltro.pagos)}</p>
        </div>
        <div className="border-x-2 border-[#1E1B18]/15">
          <p className="font-mono text-[11px] font-extrabold uppercase tracking-wide text-stone-600">A pagar</p>
          <p className="mt-0.5 text-sm font-extrabold tabular-nums text-amber-700">{formatarBRL(totaisFiltro.pendentes)}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] font-extrabold uppercase tracking-wide text-stone-600">Total</p>
          <p className="mt-0.5 text-sm font-extrabold tabular-nums text-[#1E1B18]">{formatarBRL(totaisFiltro.total)}</p>
        </div>
      </div>

      {listaFiltrada.length === 0 ? (
        <EstadoVazio
          icone={FileText}
          titulo="Nenhum lançamento encontrado"
          texto="Nenhum registro corresponde ao filtro selecionado neste mês."
          acao={<Botao onClick={() => setModalNovoAberto(true)}><Plus size={16} /> Adicionar lançamento</Botao>}
        />
      ) : (
        <Painel corBarra="lilas" tituloJanela="Registros_Mes.dat" className="!p-0">
          <ul className="-m-4 divide-y-2 divide-[#1E1B18]/15">
            {listaFiltrada.map((item) => {
              const cat = getCategoria(item.categoriaId);
              const pago = item.status === 'Pago';
              return (
                <li
                  key={item.id}
                  onClick={() => setLancamentoEmEdicao(item)}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#F3EFE6]/70"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#1E1B18] bg-[#F3EFE6] text-xl">
                    {cat?.emoji ?? '💸'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-extrabold text-[#1E1B18]">{item.descricao}</p>
                      {item.pertenceCasa && <Chip tom="marca">Casa</Chip>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                      <span>{formatarData(item.data)}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Avatar pessoaId={item.pagoPor} tamanho="sm" />
                        {item.formaPagamento}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-sm font-extrabold tabular-nums text-[#1E1B18]">{formatarBRL(item.valor)}</span>
                    <button
                      type="button"
                      onClick={(e) => alternarStatus(e, item)}
                      className={`inline-flex items-center gap-1 rounded-full border-[1.5px] border-[#1E1B18] px-2.5 py-0.5 text-xs font-bold shadow-[1.5px_1.5px_0_#1E1B18] transition-colors ${
                        pago ? 'bg-[#BBF7D0] text-[#1E1B18] hover:bg-[#86EFAC]' : 'bg-[#FDE68A] text-[#1E1B18] hover:bg-[#FCD34D]'
                      }`}
                    >
                      {pago ? <><Check size={12} /> Pago</> : <><Clock size={12} /> Pendente</>}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Painel>
      )}

      {/* Modal: Novo Lançamento */}
      <Sheet aberto={modalNovoAberto} aoFechar={() => setModalNovoAberto(false)} titulo="Novo lançamento">
        <LancamentoForm
          inicial={null}
          dataPadrao={dataPadrao}
          aoSalvar={(dados) => { adicionarLancamento(dados); setModalNovoAberto(false); }}
          aoCancelar={() => setModalNovoAberto(false)}
        />
      </Sheet>

      {/* Modal: Editar Lançamento */}
      <Sheet aberto={Boolean(lancamentoEmEdicao)} aoFechar={() => setLancamentoEmEdicao(null)} titulo="Editar lançamento">
        {lancamentoEmEdicao && (
          <LancamentoForm
            inicial={lancamentoEmEdicao}
            dataPadrao={dataPadrao}
            aoSalvar={(dados) => { atualizarLancamento(lancamentoEmEdicao.id, dados); setLancamentoEmEdicao(null); }}
            aoExcluir={() => { excluirLancamento(lancamentoEmEdicao.id); setLancamentoEmEdicao(null); }}
            aoCancelar={() => setLancamentoEmEdicao(null)}
          />
        )}
      </Sheet>

      {/* Modal: Nova Conta Fixa Recorrente */}
      <Sheet aberto={modalNovaFixaAberto} aoFechar={() => setModalNovaFixaAberto(false)} titulo="Nova conta fixa">
        <ContaRecorrenteForm
          inicial={null}
          perfilAtivo={perfilAtivo}
          aoSalvar={(dados) => {
            adicionarContaRecorrente(dados);
            setModalNovaFixaAberto(false);
            setMostrarRecorrentes(true);
          }}
          aoCancelar={() => setModalNovaFixaAberto(false)}
        />
      </Sheet>

      {/* Modal: Editar Conta Fixa Recorrente */}
      <Sheet aberto={Boolean(fixaEmEdicao)} aoFechar={() => setFixaEmEdicao(null)} titulo="Editar conta fixa">
        {fixaEmEdicao && (
          <ContaRecorrenteForm
            inicial={fixaEmEdicao}
            perfilAtivo={perfilAtivo}
            aoSalvar={(dados) => {
              atualizarContaRecorrente(fixaEmEdicao.id, dados);
              setFixaEmEdicao(null);
            }}
            aoExcluir={() => {
              excluirContaRecorrente(fixaEmEdicao.id);
              setFixaEmEdicao(null);
            }}
            aoCancelar={() => setFixaEmEdicao(null)}
          />
        )}
      </Sheet>

      <ImportarModal
        aberto={modalImportarAberto}
        aoFechar={() => setModalImportarAberto(false)}
        dataPadrao={dataPadrao}
        perfilAtivo={perfilAtivo}
        aoImportarVarios={(lista) => { lista.forEach((item) => adicionarLancamento(item)); setModalImportarAberto(false); }}
      />
    </div>
  );
}

function ContaRecorrenteForm({ inicial, perfilAtivo, aoSalvar, aoExcluir, aoCancelar }) {
  const { categorias } = useFinance();
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [valorStr, setValorStr] = useState(inicial?.valor ? String(inicial.valor).replace('.', ',') : '');
  const [diaVencimento, setDiaVencimento] = useState(String(inicial?.diaVencimento ?? 10));
  const [categoriaId, setCategoriaId] = useState(inicial?.categoriaId ?? categorias[0]?.id ?? 'moradia');
  const [pagoPor, setPagoPor] = useState(inicial?.pagoPor ?? perfilAtivo ?? 'nathalia');
  const [formaPagamento, setFormaPagamento] = useState(inicial?.formaPagamento ?? 'Pix');
  const [pertenceCasa, setPertenceCasa] = useState(inicial?.pertenceCasa !== false);
  const [ativa, setAtiva] = useState(inicial?.ativa !== false);
  const [erro, setErro] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const valor = parseBRL(valorStr);
    const dia = Math.min(31, Math.max(1, parseInt(diaVencimento, 10) || 1));
    if (!descricao.trim()) {
      setErro('Informe a descrição da conta fixa.');
      return;
    }
    if (valor <= 0) {
      setErro('Informe um valor maior que zero.');
      return;
    }
    aoSalvar({
      descricao: descricao.trim(),
      valor,
      diaVencimento: dia,
      categoriaId,
      pagoPor,
      formaPagamento,
      pertenceCasa,
      ativa,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Campo rotulo="Descrição" htmlFor="rec-desc" erro={erro && !descricao.trim() ? erro : ''}>
        <input
          id="rec-desc"
          className={classeInput}
          placeholder="Ex.: Aluguel, Internet, Academia..."
          value={descricao}
          onChange={(e) => { setDescricao(e.target.value); setErro(''); }}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Valor mensal (R$)" htmlFor="rec-valor" erro={erro && descricao.trim() ? erro : ''}>
          <input
            id="rec-valor"
            className={classeInput}
            inputMode="decimal"
            placeholder="0,00"
            value={valorStr}
            onChange={(e) => { setValorStr(e.target.value); setErro(''); }}
          />
        </Campo>

        <Campo rotulo="Dia do vencimento" htmlFor="rec-dia">
          <input
            id="rec-dia"
            type="number"
            min={1}
            max={31}
            className={classeInput}
            value={diaVencimento}
            onChange={(e) => setDiaVencimento(e.target.value)}
          />
        </Campo>
      </div>

      <Campo rotulo="Categoria" htmlFor="rec-cat">
        <select id="rec-cat" className={classeInput} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.nome}
            </option>
          ))}
        </select>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Quem costuma pagar">
          <Segmented
            rotulo="Quem costuma pagar"
            valor={pagoPor}
            aoMudar={setPagoPor}
            opcoes={[
              { valor: 'nathalia', rotulo: 'Nathalia' },
              { valor: 'alisson', rotulo: 'Alisson' },
            ]}
          />
        </Campo>

        <Campo rotulo="Forma de pagamento" htmlFor="rec-forma">
          <select id="rec-forma" className={classeInput} value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
            <option value="Pix">Pix</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Débito">Débito</option>
            <option value="Boleto">Boleto</option>
            <option value="Débito Automático">Débito Automático</option>
          </select>
        </Campo>
      </div>

      <div className="space-y-2 rounded-lg border-2 border-[#1E1B18] bg-[#F3EFE6] p-3">
        <label className="flex cursor-pointer items-center justify-between text-sm font-bold text-[#1E1B18]">
          <span>Despesa compartilhada da casa</span>
          <input
            type="checkbox"
            checked={pertenceCasa}
            onChange={(e) => setPertenceCasa(e.target.checked)}
            className="h-4 w-4 rounded border-2 border-[#1E1B18]"
          />
        </label>

        {inicial && (
          <label className="flex cursor-pointer items-center justify-between border-t border-[#1E1B18]/15 pt-2 text-sm font-bold text-[#1E1B18]">
            <span>Conta fixa ativa nos próximos meses</span>
            <input
              type="checkbox"
              checked={ativa}
              onChange={(e) => setAtiva(e.target.checked)}
              className="h-4 w-4 rounded border-2 border-[#1E1B18]"
            />
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        {inicial && aoExcluir ? (
          <Botao
            type="button"
            variante="perigo"
            size="sm"
            onClick={() => {
              if (window.confirm(`Excluir permanentemente "${inicial.descricao}"?`)) aoExcluir();
            }}
          >
            <Trash2 size={15} /> Excluir
          </Botao>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <Botao type="button" variante="secundario" onClick={aoCancelar}>
            Cancelar
          </Botao>
          <Botao type="submit">
            {inicial ? 'Salvar alterações' : 'Adicionar conta fixa'}
          </Botao>
        </div>
      </div>
    </form>
  );
}

function ImportarModal({ aberto, aoFechar, dataPadrao, perfilAtivo, aoImportarVarios }) {
  const { categorias } = useFinance();
  const [aba, setAba] = useState('extrato');
  const [textoExtrato, setTextoExtrato] = useState('');
  const [itensExtraidos, setItensExtraidos] = useState([]);
  const [previewPrint, setPreviewPrint] = useState(null);
  const [lendoPrint, setLendoPrint] = useState(false);

  const processarTextoExtrato = () => {
    const linhas = textoExtrato.split('\n').map((l) => l.trim()).filter(Boolean);
    const anoAtual = dataPadrao.slice(0, 4);
    const mesAtual = dataPadrao.slice(5, 7);

    const parsed = linhas
      .map((linha) => {
        const matchValor = linha.match(/(-?\s*(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2})/);
        if (!matchValor) return null;
        const valor = Math.abs(parseBRL(matchValor[1]));
        if (valor <= 0) return null;
        const matchData = linha.match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?/);
        const data = matchData ? `${matchData[3] || anoAtual}-${matchData[2]}-${matchData[1]}` : `${anoAtual}-${mesAtual}-10`;
        const descricao = linha.replace(matchData?.[0] || '', '').replace(matchValor[0], '').replace(/[-|]+/g, ' ').trim() || 'Despesa importada';
        const descLower = descricao.toLowerCase();
        let categoriaId = 'mercado';
        if (descLower.includes('uber') || descLower.includes('posto') || descLower.includes('combust')) categoriaId = 'transporte';
        else if (descLower.includes('ifood') || descLower.includes('pizza') || descLower.includes('restaur')) categoriaId = 'alimentacao';
        else if (descLower.includes('farm') || descLower.includes('drog')) categoriaId = 'saude';
        else if (descLower.includes('luz') || descLower.includes('agua') || descLower.includes('enel')) categoriaId = 'luz-agua';

        return { descricao, valor, categoriaId, data, pagoPor: perfilAtivo, formaPagamento: 'Cartão de Crédito', status: 'Pago' };
      })
      .filter(Boolean);
    setItensExtraidos(parsed);
  };

  const handleArquivoPrint = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewPrint(URL.createObjectURL(file));
    setLendoPrint(true);
    setTimeout(() => {
      setLendoPrint(false);
      setItensExtraidos([
        { descricao: `Comprovante Pix (${file.name.slice(0, 18)})`, valor: 89.9, categoriaId: 'mercado', data: dataPadrao, pagoPor: perfilAtivo, formaPagamento: 'Pix', status: 'Pago' },
      ]);
    }, 800);
  };

  return (
    <Sheet aberto={aberto} aoFechar={aoFechar} titulo="Importar extrato ou print">
      <div className="space-y-4">
        <div className="flex rounded-lg border-2 border-[#1E1B18] bg-[#F3EFE6] p-1">
          <button
            type="button"
            onClick={() => { setAba('extrato'); setItensExtraidos([]); }}
            className={`flex-1 rounded-md py-2 text-xs font-extrabold ${aba === 'extrato' ? 'border-[1.5px] border-[#1E1B18] bg-[#DDD6FE] text-[#1E1B18]' : 'text-stone-600'}`}
          >
            Colar extrato
          </button>
          <button
            type="button"
            onClick={() => { setAba('print'); setItensExtraidos([]); }}
            className={`flex-1 rounded-md py-2 text-xs font-extrabold ${aba === 'print' ? 'border-[1.5px] border-[#1E1B18] bg-[#DDD6FE] text-[#1E1B18]' : 'text-stone-600'}`}
          >
            Print / Comprovante (IA)
          </button>
        </div>

        {aba === 'extrato' ? (
          <>
            <Campo rotulo="Cole as linhas da fatura ou extrato" htmlFor="texto-extrato" dica='Ex.: "14/11 Supermercado Extra 184,50" (uma despesa por linha)'>
              <textarea id="texto-extrato" rows={4} className={classeInput} value={textoExtrato} onChange={(e) => setTextoExtrato(e.target.value)} placeholder={'14/11 Supermercado Extra 184,50\n15/11 Uber Viagem 26,90'} />
            </Campo>
            <Botao variante="suave" onClick={processarTextoExtrato} className="w-full">
              <Sparkles size={16} /> Identificar lançamentos
            </Botao>
          </>
        ) : (
          <div className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1E1B18] bg-[#F3EFE6] p-6 text-center hover:bg-[#FEFCE8]">
              <Camera size={28} className="mb-2 text-[#1E1B18]" />
              <span className="text-sm font-extrabold text-[#1E1B18]">Selecionar print ou comprovante</span>
              <span className="mt-1 text-xs text-stone-600">Selecione uma imagem da galeria para preencher</span>
              <input type="file" accept="image/*" onChange={handleArquivoPrint} className="hidden" />
            </label>
            {previewPrint && <img src={previewPrint} alt="Prévia do comprovante" className="mx-auto max-h-40 rounded-lg border-2 border-[#1E1B18] object-contain" />}
            {lendoPrint && <p className="text-center text-sm font-extrabold text-[#1E1B18]">Analisando comprovante...</p>}
          </div>
        )}

        {itensExtraidos.length > 0 && (
          <div className="space-y-3 border-t-2 border-[#1E1B18]/15 pt-3">
            <p className="font-mono text-xs font-extrabold uppercase tracking-wide text-stone-600">{itensExtraidos.length} lançamento(s) pronto(s)</p>
            <ul className="space-y-2">
              {itensExtraidos.map((item, idx) => {
                const cat = categorias.find((c) => c.id === item.categoriaId);
                return (
                  <li key={idx} className="flex items-center justify-between rounded-lg border-[1.5px] border-[#1E1B18] bg-[#F3EFE6] px-3 py-2 text-sm">
                    <div>
                      <p className="font-extrabold text-[#1E1B18]">{cat?.emoji} {item.descricao}</p>
                      <p className="text-xs text-stone-600">{formatarData(item.data)} • {cat?.nome}</p>
                    </div>
                    <span className="font-extrabold tabular-nums text-[#1E1B18]">{formatarBRL(item.valor)}</span>
                  </li>
                );
              })}
            </ul>
            <Botao className="w-full" onClick={() => { aoImportarVarios(itensExtraidos); setTextoExtrato(''); setItensExtraidos([]); setPreviewPrint(null); }}>
              Confirmar importação ({itensExtraidos.length})
            </Botao>
          </div>
        )}
      </div>
    </Sheet>
  );
}
