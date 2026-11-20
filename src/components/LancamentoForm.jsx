import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { FORMAS_PAGAMENTO } from '../data/mockData';
import { useFinance } from '../context/FinanceContext';
import { arredondar, formatarBRL, parseBRL, sugerirClassificacao } from '../utils/calculations';
import { Botao, Campo, Segmented, classeInput } from './ui';

const OPCOES_TIPO = [{ valor: 'Fixo', rotulo: 'Fixo' }, { valor: 'Variável', rotulo: 'Variável' }];
const OPCOES_CASA = [{ valor: true, rotulo: 'Sim' }, { valor: false, rotulo: 'Não' }];
const OPCOES_STATUS = [{ valor: 'Pendente', rotulo: 'Pendente' }, { valor: 'Pago', rotulo: 'Pago' }];
const OPCOES_PARCELAMENTO = [{ valor: false, rotulo: 'À vista' }, { valor: true, rotulo: 'Parcelado' }];
const OPCOES_MODO_VALOR = [{ valor: 'parcela', rotulo: 'Valor da parcela' }, { valor: 'total', rotulo: 'Valor total' }];

function somarMesesNaDataISO(dataISO, meses) {
  const [anoStr, mesStr, diaStr] = dataISO.split('-');
  const ano = parseInt(anoStr, 10);
  const mes = parseInt(mesStr, 10) - 1;
  const dia = parseInt(diaStr, 10);

  const dataAlvo = new Date(ano, mes + meses, 1);
  const ultimoDiaDoMes = new Date(dataAlvo.getFullYear(), dataAlvo.getMonth() + 1, 0).getDate();
  const diaFinal = Math.min(dia, ultimoDiaDoMes);

  const y = dataAlvo.getFullYear();
  const m = String(dataAlvo.getMonth() + 1).padStart(2, '0');
  const d = String(diaFinal).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function LancamentoForm({ inicial, dataPadrao, aoSalvar, aoExcluir, aoExcluirFuturas, aoCancelar }) {
  const { categorias, pessoas, perfilAtivo, adicionarLancamento } = useFinance();
  const edicao = Boolean(inicial);

  const [dados, setDados] = useState(() => ({
    descricao: inicial?.descricao ?? '',
    valor: inicial ? String(inicial.valor).replace('.', ',') : '',
    categoriaId: inicial?.categoriaId ?? '',
    tipo: inicial?.tipo ?? 'Variável',
    pertenceCasa: inicial?.pertenceCasa ?? true,
    status: inicial?.status ?? 'Pago',
    data: inicial?.data ?? dataPadrao,
    pagoPor: inicial?.pagoPor ?? perfilAtivo,
    formaPagamento: inicial?.formaPagamento ?? 'Pix',
    observacao: inicial?.observacao ?? '',
  }));

  const [parcelado, setParcelado] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState(2);
  const [modoValor, setModoValor] = useState('parcela');

  const [classificacaoManual, setClassificacaoManual] = useState(edicao);
  const [erros, setErros] = useState({});

  const alterar = (campo, valor) => setDados((atual) => ({ ...atual, [campo]: valor }));
  const escolherCategoria = (categoriaId) => {
    setDados((atual) => {
      const proximo = { ...atual, categoriaId };
      if (!classificacaoManual) {
        const sugestao = sugerirClassificacao(categoriaId, categorias);
        proximo.tipo = sugestao.tipo;
        proximo.pertenceCasa = sugestao.pertenceCasa;
      }
      return proximo;
    });
  };
  const alterarClassificacao = (campo, valor) => {
    setClassificacaoManual(true);
    alterar(campo, valor);
  };

  const valorDigitado = parseBRL(dados.valor);
  const totalParcelasNum = Math.min(36, Math.max(2, parseInt(qtdParcelas, 10) || 2));
  const valorCalculadoParcela =
    parcelado && valorDigitado > 0
      ? modoValor === 'total'
        ? arredondar(valorDigitado / totalParcelasNum)
        : arredondar(valorDigitado)
      : valorDigitado;

  const enviar = (evento) => {
    evento.preventDefault();
    const novosErros = {};
    if (!dados.descricao.trim()) novosErros.descricao = 'Informe uma descrição.';
    if (valorDigitado <= 0) novosErros.valor = 'Informe um valor maior que zero.';
    if (!dados.categoriaId) novosErros.categoriaId = 'Escolha uma categoria.';
    if (!dados.data) novosErros.data = 'Informe a data.';
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const descricaoLimpa = dados.descricao.trim();

    // Criação de lançamento parcelado: gera todas as parcelas mensais como Fixo até acabar
    if (!edicao && parcelado && totalParcelasNum >= 2) {
      const grupoParcelamentoId = `parc-${Date.now()}`;
      const parcelas = [];

      for (let i = 0; i < totalParcelasNum; i++) {
        const ehUltima = i === totalParcelasNum - 1;
        let valorParcela = valorCalculadoParcela;
        if (modoValor === 'total' && ehUltima) {
          const somaAnteriores = arredondar(valorCalculadoParcela * (totalParcelasNum - 1));
          valorParcela = arredondar(valorDigitado - somaAnteriores);
        }

        parcelas.push({
          ...dados,
          descricao: `${descricaoLimpa} (${i + 1}/${totalParcelasNum})`,
          valor: valorParcela,
          tipo: 'Fixo',
          status: i === 0 ? dados.status : 'Pendente',
          data: somarMesesNaDataISO(dados.data, i),
          parcelamentoId: grupoParcelamentoId,
          parcelaAtual: i + 1,
          parcelasTotal: totalParcelasNum,
        });
      }

      // Salva a 1ª pelo callback padrão (para fechar modal corretamente) e adiciona as seguintes no contexto
      aoSalvar(parcelas[0]);
      for (let i = 1; i < parcelas.length; i++) {
        adicionarLancamento(parcelas[i]);
      }
      return;
    }

    aoSalvar({ ...dados, descricao: descricaoLimpa, valor: valorDigitado });
  };

  const categoriaEscolhida = categorias.find((c) => c.id === dados.categoriaId);
  const ehParcelaExistente = Boolean(inicial?.parcelamentoId || /\(\d+\/\d+\)$/.test(inicial?.descricao ?? ''));

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <Campo rotulo="Descrição" htmlFor="lan-descricao" erro={erros.descricao}>
        <input id="lan-descricao" className={classeInput} value={dados.descricao} onChange={(e) => alterar('descricao', e.target.value)} placeholder="Ex.: Compra do mês" autoFocus={!edicao} />
      </Campo>

      {!edicao && (
        <div className="space-y-3 rounded-xl border-2 border-[#1E1B18] bg-[#F3EFE6] p-3">
          <Campo rotulo="Condição de pagamento">
            <Segmented
              rotulo="Condição de pagamento"
              opcoes={OPCOES_PARCELAMENTO}
              valor={parcelado}
              aoMudar={(v) => {
                setParcelado(v);
                if (v) alterarClassificacao('tipo', 'Fixo');
              }}
            />
          </Campo>

          {parcelado && (
            <div className="space-y-3 border-t border-[#1E1B18]/15 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <Campo rotulo="Nº de parcelas" htmlFor="lan-parcelas">
                  <select
                    id="lan-parcelas"
                    className={classeInput}
                    value={qtdParcelas}
                    onChange={(e) => setQtdParcelas(Number(e.target.value))}
                  >
                    {Array.from({ length: 23 }, (_, idx) => idx + 2).map((n) => (
                      <option key={n} value={n}>{n}x</option>
                    ))}
                  </select>
                </Campo>

                <Campo rotulo="Valor informado é">
                  <Segmented
                    rotulo="Modo de valor da parcela"
                    opcoes={OPCOES_MODO_VALOR}
                    valor={modoValor}
                    aoMudar={setModoValor}
                  />
                </Campo>
              </div>

              {valorDigitado > 0 && (
                <p className="rounded-lg border-[1.5px] border-[#1E1B18] bg-[#FEFCE8] px-3 py-2 text-xs font-bold text-[#1E1B18]">
                  Serão lançadas <strong>{totalParcelasNum} parcelas fixas</strong> de{' '}
                  <strong>{formatarBRL(valorCalculadoParcela)}</strong>/mês (Total:{' '}
                  <strong>{formatarBRL(modoValor === 'total' ? valorDigitado : arredondar(valorCalculadoParcela * totalParcelasNum))}</strong>).
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Campo
          rotulo={parcelado && !edicao ? (modoValor === 'total' ? 'Valor total (R$)' : 'Valor da parcela (R$)') : 'Valor (R$)'}
          htmlFor="lan-valor"
          erro={erros.valor}
        >
          <input id="lan-valor" className={classeInput} value={dados.valor} onChange={(e) => alterar('valor', e.target.value)} inputMode="decimal" placeholder="0,00" />
        </Campo>
        <Campo rotulo={parcelado && !edicao ? 'Data da 1ª parcela' : 'Data'} htmlFor="lan-data" erro={erros.data}>
          <input id="lan-data" type="date" className={classeInput} value={dados.data} onChange={(e) => alterar('data', e.target.value)} />
        </Campo>
      </div>

      <Campo rotulo="Categoria" htmlFor="lan-categoria" erro={erros.categoriaId}>
        <select id="lan-categoria" className={classeInput} value={dados.categoriaId} onChange={(e) => escolherCategoria(e.target.value)}>
          <option value="">Escolha uma categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>
          ))}
        </select>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Tipo">
          <Segmented rotulo="Tipo" opcoes={OPCOES_TIPO} valor={parcelado && !edicao ? 'Fixo' : dados.tipo} aoMudar={(v) => alterarClassificacao('tipo', v)} />
        </Campo>
        <Campo rotulo="Pertence à casa?">
          <Segmented rotulo="Pertence à casa" opcoes={OPCOES_CASA} valor={dados.pertenceCasa} aoMudar={(v) => alterarClassificacao('pertenceCasa', v)} />
        </Campo>
      </div>
      {categoriaEscolhida && !classificacaoManual && !parcelado && (
        <p className="-mt-2 text-xs text-stone-600">Sugerido pela categoria. Gastos da casa entram no acerto do casal.</p>
      )}

      <Campo rotulo={parcelado && !edicao ? 'Situação da 1ª parcela' : 'Situação'}>
        <Segmented rotulo="Situação" opcoes={OPCOES_STATUS} valor={dados.status} aoMudar={(v) => alterar('status', v)} />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Quem paga" htmlFor="lan-pagopor">
          <select id="lan-pagopor" className={classeInput} value={dados.pagoPor} onChange={(e) => alterar('pagoPor', e.target.value)}>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Forma de pagamento" htmlFor="lan-forma">
          <select id="lan-forma" className={classeInput} value={dados.formaPagamento} onChange={(e) => alterar('formaPagamento', e.target.value)}>
            {FORMAS_PAGAMENTO.map((forma) => (
              <option key={forma} value={forma}>{forma}</option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo rotulo="Observação (opcional)" htmlFor="lan-obs">
        <textarea id="lan-obs" rows={2} className={classeInput} value={dados.observacao} onChange={(e) => alterar('observacao', e.target.value)} />
      </Campo>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        {edicao && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Botao variante="fantasma" tamanho="sm" onClick={aoExcluir} aria-label="Excluir lançamento" className="text-rose-700">
              <Trash2 size={16} aria-hidden="true" /> Excluir
            </Botao>
            {ehParcelaExistente && aoExcluirFuturas && (
              <Botao
                variante="perigo"
                tamanho="sm"
                onClick={() => {
                  if (window.confirm('Excluir esta parcela e todas as parcelas seguintes deste parcelamento?')) {
                    aoExcluirFuturas();
                  }
                }}
              >
                Excluir esta e futuras
              </Botao>
            )}
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <Botao variante="secundario" onClick={aoCancelar}>Cancelar</Botao>
          <Botao type="submit">
            {edicao ? 'Salvar alterações' : parcelado ? `Lançar ${totalParcelasNum}x` : 'Adicionar lançamento'}
          </Botao>
        </div>
      </div>
    </form>
  );
}
