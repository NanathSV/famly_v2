import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { NOMES_PESSOAS } from '../utils/calculations';

export const COR_PESSOA = { nathalia: '#ec4899', alisson: '#6366f1' };

const TAMANHOS_AVATAR = { sm: 'h-6 w-6 text-[11px]', md: 'h-8 w-8 text-sm', lg: 'h-10 w-10 text-base' };
export function Avatar({ pessoaId, tamanho = 'md' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${TAMANHOS_AVATAR[tamanho]}`}
      style={{ backgroundColor: COR_PESSOA[pessoaId] ?? '#64748b' }}
      title={NOMES_PESSOAS[pessoaId]}
      aria-label={NOMES_PESSOAS[pessoaId]}
    >
      {(NOMES_PESSOAS[pessoaId] ?? '?').charAt(0)}
    </span>
  );
}

const TONS_CHIP = {
  neutro: 'bg-slate-100 text-slate-700',
  ok: 'bg-emerald-50 text-emerald-800',
  alerta: 'bg-amber-50 text-amber-800',
  perigo: 'bg-rose-50 text-rose-800',
  marca: 'bg-brand-50 text-brand-800',
};
export function Chip({ tom = 'neutro', children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${TONS_CHIP[tom]} ${className}`}>{children}</span>;
}

const TONS_BARRA = { marca: 'bg-brand-500', ok: 'bg-emerald-500', atencao: 'bg-amber-500', estourado: 'bg-rose-500', neutro: 'bg-slate-400' };
export const tomDoStatus = (status) => (status === 'sem_teto' ? 'neutro' : status);
export function ProgressBar({ fracao = 0, tom = 'marca', rotulo }) {
  const pct = Math.round(Math.min(1, Math.max(0, fracao)) * 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={rotulo}>
      <div className={`h-full rounded-full ${TONS_BARRA[tom]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SplitBar({ nathalia, alisson, altura = 'h-3' }) {
  return (
    <div className={`flex w-full overflow-hidden rounded-full bg-slate-200 ${altura}`} aria-hidden="true">
      <div style={{ width: `${nathalia * 100}%`, backgroundColor: COR_PESSOA.nathalia }} />
      <div style={{ width: `${alisson * 100}%`, backgroundColor: COR_PESSOA.alisson }} />
    </div>
  );
}

const VARIANTES_BOTAO = {
  primario: 'bg-brand-600 text-white hover:bg-brand-700',
  secundario: 'bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
  suave: 'bg-brand-50 text-brand-800 hover:bg-brand-100',
  perigo: 'bg-rose-600 text-white hover:bg-rose-700',
  fantasma: 'text-slate-600 hover:bg-slate-100',
};
const TAMANHOS_BOTAO = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3 text-base' };
export function Botao({ variante = 'primario', tamanho = 'md', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES_BOTAO[variante]} ${TAMANHOS_BOTAO[tamanho]} ${className}`}
      {...props}
    />
  );
}

export const classeInput = 'w-full rounded-xl border-0 bg-white px-3 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-600';

export function Campo({ rotulo, erro, dica, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">{rotulo}</label>
      {children}
      {dica && !erro && <p className="mt-1 text-xs text-slate-500">{dica}</p>}
      {erro && <p className="mt-1 text-xs font-medium text-rose-600" role="alert">{erro}</p>}
    </div>
  );
}

export function Segmented({ opcoes, valor, aoMudar, rotulo }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex rounded-xl bg-slate-100 p-1">
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <button
            key={String(opcao.valor)}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aoMudar(opcao.valor)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${ativo ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}

export function SecaoTitulo({ titulo, linkPara, linkTexto = 'Ver tudo' }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-base font-bold text-slate-900">{titulo}</h2>
      {linkPara && <Link to={linkPara} className="text-sm font-semibold text-brand-700 hover:underline">{linkTexto}</Link>}
    </div>
  );
}

export function EstadoVazio({ icone: Icone, titulo, texto, acao }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icone && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Icone size={22} aria-hidden="true" />
        </span>
      )}
      <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
      {texto && <p className="mt-1 max-w-xs text-sm text-slate-600">{texto}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

export function Painel({ children, className = '' }) {
  return <section className={`rounded-2xl bg-white p-4 ring-1 ring-slate-200 ${className}`}>{children}</section>;
}

export function Sheet({ aberto, aoFechar, titulo, children }) {
  useEffect(() => {
    if (!aberto) return undefined;
    const aoTeclar = (e) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={aoFechar} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={titulo} className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl md:max-w-lg md:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
          <button type="button" onClick={aoFechar} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
