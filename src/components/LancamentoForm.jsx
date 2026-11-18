import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { FORMAS_PAGAMENTO } from '../data/mockData';
import { useFinance } from '../context/FinanceContext';
import { parseBRL, sugerirClassificacao } from '../utils/calculations';
import { Botao, Campo, Segmented, classeInput } from './ui';

const OPCOES_TIPO = [{ valor: 'Fixo', rotulo: 'Fixo' }, { valor: 'Variável', rotulo: 'Variável' }];
const OPCOES_CASA = [{ valor: true, rotulo: 'Sim' }, { valor: false, rotulo: 'Não' }];
const OPCOES_STATUS = [{ valor: 'Pendente', rotulo: 'Pendente' }, { valor: 'Pago', rotulo: 'Pago' }];

export default function LancamentoForm({ inicial, dataPadrao, aoSalvar, aoExcluir, aoCancelar }) {
  const { categorias, pessoas, perfilAtivo } = useFinance();
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

  const enviar = (evento) => {
    evento.preventDefault();
    const valorNumerico = parseBRL(dados.valor);
    const novosErros = {};
    if (!dados.descricao.trim()) novosErros.descricao = 'Informe uma descrição.';
    if (valorNumerico <= 0) novosErros.valor = 'Informe um valor maior que zero.';
    if (!dados.categoriaId) novosErros.categoriaId = 'Escolha uma categoria.';
    if (!dados.data) novosErros.data = 'Informe a data.';
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;
    aoSalvar({ ...dados, descricao: dados.descricao.trim(), valor: valorNumerico });
  };

  const categoriaEscolhida = categorias.find((c) => c.id === dados.categoriaId);

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <Campo rotulo="Descrição" htmlFor="lan-descricao" erro={erros.descricao}>
        <input id="lan-descricao" className={classeInput} value={dados.descricao} onChange={(e) => alterar('descricao', e.target.value)} placeholder="Ex.: Compra do mês" autoFocus={!edicao} />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Valor (R$)" htmlFor="lan-valor" erro={erros.valor}>
          <input id="lan-valor" className={classeInput} value={dados.valor} onChange={(e) => alterar('valor', e.target.value)} inputMode="decimal" placeholder="0,00" />
        </Campo>
        <Campo rotulo="Data" htmlFor="lan-data" erro={erros.data}>
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
          <Segmented rotulo="Tipo" opcoes={OPCOES_TIPO} valor={dados.tipo} aoMudar={(v) => alterarClassificacao('tipo', v)} />
        </Campo>
        <Campo rotulo="Pertence à casa?">
          <Segmented rotulo="Pertence à casa" opcoes={OPCOES_CASA} valor={dados.pertenceCasa} aoMudar={(v) => alterarClassificacao('pertenceCasa', v)} />
        </Campo>
      </div>
      {categoriaEscolhida && !classificacaoManual && (
        <p className="-mt-2 text-xs text-slate-500">Sugerido pela categoria. Gastos da casa entram no acerto do casal.</p>
      )}

      <Campo rotulo="Situação">
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

      <div className="flex items-center gap-2 pt-2">
        {edicao && (
          <Botao variante="fantasma" onClick={aoExcluir} aria-label="Excluir lançamento" className="text-rose-600">
            <Trash2 size={18} aria-hidden="true" /> Excluir
          </Botao>
        )}
        <div className="ml-auto flex gap-2">
          <Botao variante="secundario" onClick={aoCancelar}>Cancelar</Botao>
          <Botao type="submit">{edicao ? 'Salvar alterações' : 'Adicionar lançamento'}</Botao>
        </div>
      </div>
    </form>
  );
}
