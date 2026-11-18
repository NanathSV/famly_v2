import { useMemo, useState } from 'react';
import { Camera, Check, Clock, FileText, Plus, RefreshCw, Sparkles, Upload } from 'lucide-react';
import LancamentoForm from '../components/LancamentoForm';
import { Avatar, Botao, Campo, Chip, EstadoVazio, Painel, Sheet, classeInput } from '../components/ui';
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
  } = useFinance();

  const [filtro, setFiltro] = useState('todos');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [lancamentoEmEdicao, setLancamentoEmEdicao] = useState(null);
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [mostrarRecorrentes, setMostrarRecorrentes] = useState(false);
  const [avisoRecorrentes, setAvisoRecorrentes] = useState('');

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
          <h1 className="text-2xl font-extrabold text-slate-900">Lançamentos</h1>
          <p className="text-sm text-slate-500">{listaFiltrada.length} registro(s) em {nomeDoMes(mesSelecionado)}</p>
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

      <Painel className="bg-slate-50/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="text-brand-600" />
            <div>
              <p className="text-sm font-bold text-slate-900">Contas fixas recorrentes</p>
              <p className="text-xs text-slate-600">
                {recorrentesPendentesDeGerar.length > 0
                  ? `${recorrentesPendentesDeGerar.length} conta(s) ainda não lançada(s) neste mês.`
                  : 'Todas as contas recorrentes ativas já estão no mês.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {recorrentesPendentesDeGerar.length > 0 && (
              <Botao tamanho="sm" onClick={handleGerarRecorrentes}>Gerar no mês</Botao>
            )}
            <Botao variante="fantasma" tamanho="sm" onClick={() => setMostrarRecorrentes((v) => !v)}>
              {mostrarRecorrentes ? 'Ocultar lista' : 'Ver fixas'}
            </Botao>
          </div>
        </div>

        {avisoRecorrentes && (
          <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">{avisoRecorrentes}</p>
        )}

        {mostrarRecorrentes && (
          <ul className="mt-3 divide-y divide-slate-200 border-t border-slate-200 pt-2">
            {contasRecorrentes.map((rec) => {
              const cat = getCategoria(rec.categoriaId);
              const jaGerada = lancamentosDoMes.some((l) => l.recorrenteId === rec.id);
              return (
                <li key={rec.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{cat?.emoji} {rec.descricao}</p>
                    <p className="text-xs text-slate-500">Dia {rec.diaVencimento} • {rec.formaPagamento}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold tabular-nums text-slate-900">{formatarBRL(rec.valor)}</span>
                    <Chip tom={jaGerada ? 'ok' : 'neutro'}>{jaGerada ? 'No mês' : 'Pendente'}</Chip>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Painel>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              filtro === f.id ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pagos</p>
          <p className="mt-0.5 text-sm font-extrabold tabular-nums text-emerald-700">{formatarBRL(totaisFiltro.pagos)}</p>
        </div>
        <div className="border-x border-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">A pagar</p>
          <p className="mt-0.5 text-sm font-extrabold tabular-nums text-amber-700">{formatarBRL(totaisFiltro.pendentes)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-0.5 text-sm font-extrabold tabular-nums text-slate-900">{formatarBRL(totaisFiltro.total)}</p>
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
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
          {listaFiltrada.map((item) => {
            const cat = getCategoria(item.categoriaId);
            const pago = item.status === 'Pago';
            return (
              <li
                key={item.id}
                onClick={() => setLancamentoEmEdicao(item)}
                className="flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">{cat?.emoji ?? '💸'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-slate-900">{item.descricao}</p>
                    {item.pertenceCasa && <Chip tom="marca">Casa</Chip>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{formatarData(item.data)}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Avatar pessoaId={item.pagoPor} tamanho="sm" />
                      {item.formaPagamento}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-sm font-extrabold tabular-nums text-slate-900">{formatarBRL(item.valor)}</span>
                  <button
                    type="button"
                    onClick={(e) => alternarStatus(e, item)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                      pago ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    {pago ? <><Check size={12} /> Pago</> : <><Clock size={12} /> Pendente</>}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet aberto={modalNovoAberto} aoFechar={() => setModalNovoAberto(false)} titulo="Novo lançamento">
        <LancamentoForm
          inicial={null}
          dataPadrao={dataPadrao}
          aoSalvar={(dados) => { adicionarLancamento(dados); setModalNovoAberto(false); }}
          aoCancelar={() => setModalNovoAberto(false)}
        />
      </Sheet>

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
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button type="button" onClick={() => { setAba('extrato'); setItensExtraidos([]); }} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${aba === 'extrato' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600'}`}>
            Colar extrato
          </button>
          <button type="button" onClick={() => { setAba('print'); setItensExtraidos([]); }} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${aba === 'print' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600'}`}>
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
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-brand-500">
              <Camera size={28} className="mb-2 text-brand-600" />
              <span className="text-sm font-bold text-slate-800">Selecionar print ou comprovante</span>
              <span className="mt-1 text-xs text-slate-500">Na Fase 2, o Gemini lerá valor, data e categoria automaticamente</span>
              <input type="file" accept="image/*" onChange={handleArquivoPrint} className="hidden" />
            </label>
            {previewPrint && <img src={previewPrint} alt="Prévia do comprovante" className="mx-auto max-h-40 rounded-xl border border-slate-200 object-contain" />}
            {lendoPrint && <p className="text-center text-sm font-semibold text-brand-700">Analisando comprovante...</p>}
          </div>
        )}

        {itensExtraidos.length > 0 && (
          <div className="space-y-3 border-t border-slate-200 pt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{itensExtraidos.length} lançamento(s) pronto(s)</p>
            <ul className="space-y-2">
              {itensExtraidos.map((item, idx) => {
                const cat = categorias.find((c) => c.id === item.categoriaId);
                return (
                  <li key={idx} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <div>
                      <p className="font-bold text-slate-900">{cat?.emoji} {item.descricao}</p>
                      <p className="text-xs text-slate-500">{formatarData(item.data)} • {cat?.nome}</p>
                    </div>
                    <span className="font-bold tabular-nums text-slate-900">{formatarBRL(item.valor)}</span>
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
