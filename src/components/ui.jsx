import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { NOMES_PESSOAS } from '../utils/calculations';

export const COR_PESSOA = { nathalia: '#F472B6', alisson: '#818CF8' };

const TAMANHOS_AVATAR = { sm: 'h-6 w-6 text-[11px]', md: 'h-8 w-8 text-sm', lg: 'h-10 w-10 text-base' };
export function Avatar({ pessoaId, tamanho = 'md' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-[#1E1B18] font-extrabold text-[#1E1B18] ${TAMANHOS_AVATAR[tamanho]}`}
      style={{ backgroundColor: COR_PESSOA[pessoaId] ?? '#CBD5E1' }}
      title={NOMES_PESSOAS[pessoaId]}
      aria-label={NOMES_PESSOAS[pessoaId]}
    >
      {(NOMES_PESSOAS[pessoaId] ?? '?').charAt(0)}
    </span>
  );
}

const TONS_CHIP = {
  neutro: 'bg-[#F3EFE6] text-[#1E1B18]',
  ok: 'bg-[#BBF7D0] text-[#1E1B18]',
  alerta: 'bg-[#FDE68A] text-[#1E1B18]',
  perigo: 'bg-[#FECDD3] text-[#1E1B18]',
  marca: 'bg-[#DDD6FE] text-[#1E1B18]',
};
export function Chip({ tom = 'neutro', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-[1.5px] border-[#1E1B18] px-2.5 py-0.5 text-xs font-bold shadow-[1.5px_1.5px_0_#1E1B18] ${TONS_CHIP[tom]} ${className}`}
    >
      {children}
    </span>
  );
}

const TONS_BARRA = {
  marca: 'bg-[#C4B5FD]',
  ok: 'bg-[#86EFAC]',
  atencao: 'bg-[#FCD34D]',
  estourado: 'bg-[#FDA4AF]',
  neutro: 'bg-[#CBD5E1]',
};
export const tomDoStatus = (status) => (status === 'sem_teto' ? 'neutro' : status);
export function ProgressBar({ fracao = 0, tom = 'marca', rotulo }) {
  const pct = Math.round(Math.min(1, Math.max(0, fracao)) * 100);
  return (
    <div
      className="h-3.5 w-full overflow-hidden rounded-md border-2 border-[#1E1B18] bg-[#FFFDF9] p-0.5"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={rotulo}
    >
      <div className={`retro-progress-fill h-full rounded-[2px] transition-all ${TONS_BARRA[tom]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SplitBar({ nathalia, alisson, altura = 'h-4' }) {
  return (
    <div
      className={`flex w-full overflow-hidden rounded-md border-2 border-[#1E1B18] bg-[#FFFDF9] ${altura}`}
      aria-hidden="true"
    >
      <div className="border-r border-[#1E1B18]" style={{ width: `${nathalia * 100}%`, backgroundColor: COR_PESSOA.nathalia }} />
      <div style={{ width: `${alisson * 100}%`, backgroundColor: COR_PESSOA.alisson }} />
    </div>
  );
}

const VARIANTES_BOTAO = {
  primario: 'bg-[#FCD34D] text-[#1E1B18] hover:bg-[#FBBF24]',
  secundario: 'bg-[#FFFDF9] text-[#1E1B18] hover:bg-[#F5EFE6]',
  suave: 'bg-[#DDD6FE] text-[#1E1B18] hover:bg-[#C4B5FD]',
  perigo: 'bg-[#FDA4AF] text-[#1E1B18] hover:bg-[#FB7185]',
  fantasma: 'border-transparent shadow-none text-[#1E1B18] hover:bg-[#F3EFE6] hover:border-[#1E1B18]',
};
const TAMANHOS_BOTAO = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3 text-base' };
export function Botao({ variante = 'primario', tamanho = 'md', className = '', type = 'button', ...props }) {
  const ehFantasma = variante === 'fantasma';
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[#1E1B18] font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 ${
        ehFantasma ? '' : 'shadow-[3px_3px_0_#1E1B18]'
      } ${VARIANTES_BOTAO[variante]} ${TAMANHOS_BOTAO[tamanho]} ${className}`}
      {...props}
    />
  );
}

export const classeInput =
  'w-full rounded-lg border-2 border-[#1E1B18] bg-[#FFFDF9] px-3 py-2.5 text-[#1E1B18] shadow-[2px_2px_0_#1E1B18] placeholder:text-stone-400 focus:bg-[#FEFCE8] focus:outline-none';

export function Campo({ rotulo, erro, dica, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-extrabold text-[#1E1B18]">
        {rotulo}
      </label>
      {children}
      {dica && !erro && <p className="mt-1 text-xs text-stone-600">{dica}</p>}
      {erro && (
        <p className="mt-1 text-xs font-bold text-rose-700" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

export function Segmented({ opcoes, valor, aoMudar, rotulo }) {
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className="flex rounded-lg border-2 border-[#1E1B18] bg-[#F3EFE6] p-1 shadow-[2px_2px_0_#1E1B18]"
    >
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <button
            key={String(opcao.valor)}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aoMudar(opcao.valor)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-bold transition-all ${
              ativo
                ? 'border-[1.5px] border-[#1E1B18] bg-[#DDD6FE] text-[#1E1B18] shadow-[1.5px_1.5px_0_#1E1B18]'
                : 'text-stone-600 hover:text-[#1E1B18]'
            }`}
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
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="inline-flex items-center gap-1.5 font-mono text-sm font-extrabold uppercase tracking-wider text-[#1E1B18]">
        <span className="text-[#F59E0B]" aria-hidden="true">✦</span>
        {titulo}
      </h2>
      {linkPara && (
        <Link
          to={linkPara}
          className="rounded-md border-[1.5px] border-[#1E1B18] bg-[#FFFDF9] px-2.5 py-0.5 text-xs font-bold text-[#1E1B18] shadow-[2px_2px_0_#1E1B18] transition-transform hover:-translate-y-0.5 hover:bg-[#FDE68A]"
        >
          {linkTexto} →
        </Link>
      )}
    </div>
  );
}

export function EstadoVazio({ icone: Icone, titulo, texto, acao }) {
  return (
    <div className="flex flex-col items-center rounded-xl border-2 border-[#1E1B18] bg-[#FFFDF9] px-6 py-12 text-center shadow-[4px_4px_0_#1E1B18]">
      {Icone && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2 border-[#1E1B18] bg-[#FDE68A] text-[#1E1B18] shadow-[2px_2px_0_#1E1B18]">
          <Icone size={22} aria-hidden="true" />
        </span>
      )}
      <h2 className="text-lg font-extrabold text-[#1E1B18]">{titulo}</h2>
      {texto && <p className="mt-1 max-w-xs text-sm text-stone-600">{texto}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

const CORES_BARRA_JANELA = {
  lilas: 'bg-[#DDD6FE]',
  rosa: 'bg-[#FBCFE8]',
  azul: 'bg-[#BAE6FD]',
  amarelo: 'bg-[#FDE68A]',
  verde: 'bg-[#BBF7D0]',
};

export function Painel({ children, className = '', corBarra = 'lilas', tituloJanela }) {
  return (
    <section
      className={`overflow-hidden rounded-xl border-2 border-[#1E1B18] bg-[#FFFDF9] shadow-[4px_4px_0_#1E1B18] ${className}`}
    >
      {/* Barra superior estilo janelinha retrô */}
      <div
        className={`flex items-center justify-between border-b-2 border-[#1E1B18] px-3 py-1.5 ${
          CORES_BARRA_JANELA[corBarra] ?? CORES_BARRA_JANELA.lilas
        }`}
      >
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-[#1E1B18] bg-[#FDA4AF]" />
          <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-[#1E1B18] bg-[#FDE68A]" />
          <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-[#1E1B18] bg-[#86EFAC]" />
        </div>
        {tituloJanela && (
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1E1B18]">
            {tituloJanela}
          </span>
        )}
        <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-[#1E1B18]" aria-hidden="true">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-[3px] border border-[#1E1B18] bg-[#FFFDF9]">
            _
          </span>
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-[3px] border border-[#1E1B18] bg-[#FFFDF9]">
            ×
          </span>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
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
      <div className="absolute inset-0 bg-[#1E1B18]/45 backdrop-blur-[1px]" onClick={aoFechar} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border-2 border-[#1E1B18] bg-[#FFFDF9] pb-[env(safe-area-inset-bottom)] shadow-[6px_6px_0_#1E1B18] md:max-w-lg md:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-[#1E1B18] bg-[#FDE68A] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-[1.5px] border-[#1E1B18] bg-[#FDA4AF]" aria-hidden="true" />
            <h2 className="font-mono text-base font-extrabold uppercase tracking-wide text-[#1E1B18]">{titulo}</h2>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-[#1E1B18] bg-[#FFFDF9] text-[#1E1B18] shadow-[2px_2px_0_#1E1B18] hover:bg-[#FDA4AF]"
            aria-label="Fechar"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
