import { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, PieChart, Plus, Receipt, Scale, Settings, Target } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { hojeISO, mesKeyDe, mesKeyHoje, nomeDoMes, somarMesesMesKey } from '../utils/calculations';
import LancamentoForm from './LancamentoForm';
import { Avatar, Sheet } from './ui';

const ABAS = [
  { para: '/', rotulo: 'Início', icone: Home, fim: true },
  { para: '/lancamentos', rotulo: 'Lançamentos', icone: Receipt },
  { para: '/acerto', rotulo: 'Acerto', icone: Scale },
  { para: '/orcamentos', rotulo: 'Orçamentos', icone: PieChart },
  { para: '/metas', rotulo: 'Metas', icone: Target },
];

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

function SeletorDeMes() {
  const { mesSelecionado, setMesSelecionado } = useFinance();
  const ehMesAtual = mesSelecionado === mesKeyHoje();
  return (
    <div className="flex items-center gap-1 rounded-lg border-2 border-[#1E1B18] bg-[#FFFDF9] px-1 py-0.5 shadow-[2px_2px_0_#1E1B18]">
      <button
        type="button"
        onClick={() => setMesSelecionado(somarMesesMesKey(mesSelecionado, -1))}
        className="rounded-md p-1 text-[#1E1B18] hover:bg-[#FDE68A]"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setMesSelecionado(mesKeyHoje())}
        disabled={ehMesAtual}
        className="min-w-[8rem] text-center font-mono text-sm font-extrabold text-[#1E1B18] disabled:cursor-default"
      >
        {capitalizar(nomeDoMes(mesSelecionado))}
      </button>
      <button
        type="button"
        onClick={() => setMesSelecionado(somarMesesMesKey(mesSelecionado, 1))}
        className="rounded-md p-1 text-[#1E1B18] hover:bg-[#FDE68A]"
        aria-label="Próximo mês"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

function SeletorDePerfil() {
  const { pessoas, perfilAtivo, setPerfilAtivo } = useFinance();
  return (
    <div
      role="radiogroup"
      aria-label="Quem está usando o app"
      className="flex items-center gap-1 rounded-full border-2 border-[#1E1B18] bg-[#F3EFE6] p-0.5 shadow-[2px_2px_0_#1E1B18]"
    >
      {pessoas.map((pessoa) => {
        const ativo = pessoa.id === perfilAtivo;
        return (
          <button
            key={pessoa.id}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => setPerfilAtivo(pessoa.id)}
            className={`flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-xs font-extrabold transition-all ${
              ativo
                ? 'border border-[#1E1B18] bg-[#FDE68A] text-[#1E1B18]'
                : 'text-stone-600 hover:text-[#1E1B18]'
            }`}
          >
            <Avatar pessoaId={pessoa.id} tamanho="sm" />
            {ativo && <span>{pessoa.nome}</span>}
          </button>
        );
      })}
    </div>
  );
}

const classeAba = ({ isActive }) =>
  `flex flex-col items-center gap-0.5 rounded-lg border-2 px-2 py-1.5 text-[11px] font-extrabold transition-all md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
    isActive
      ? 'border-[#1E1B18] bg-[#DDD6FE] text-[#1E1B18] shadow-[2px_2px_0_#1E1B18]'
      : 'border-transparent text-stone-600 hover:border-[#1E1B18] hover:bg-[#FFFDF9] hover:text-[#1E1B18]'
  }`;

export default function AppShell() {
  const { mesSelecionado, adicionarLancamento } = useFinance();
  const [fabAberto, setFabAberto] = useState(false);

  const dataPadrao = useMemo(() => {
    const hoje = hojeISO();
    return mesKeyDe(hoje) === mesSelecionado ? hoje : `${mesSelecionado}-01`;
  }, [mesSelecionado]);

  return (
    <div className="min-h-dvh md:flex">
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t-2 border-[#1E1B18] bg-[#FFFDF9] px-1 pt-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] md:static md:z-auto md:w-60 md:shrink-0 md:flex-col md:justify-start md:gap-1.5 md:border-r-2 md:border-t-0 md:px-3 md:py-6"
      >
        <div className="mb-4 hidden rounded-xl border-2 border-[#1E1B18] bg-[#FBCFE8] px-3 py-2 shadow-[3px_3px_0_#1E1B18] md:block">
          <p className="font-mono text-sm font-extrabold uppercase tracking-wider text-[#1E1B18]">
            ✦ Casal Finanças
          </p>
        </div>
        {ABAS.map(({ para, rotulo, icone: Icone, fim }) => (
          <NavLink key={para} to={para} end={fim} className={classeAba}>
            <Icone size={20} aria-hidden="true" />
            <span>{rotulo}</span>
          </NavLink>
        ))}
        <div className="hidden md:mt-auto md:block">
          <NavLink to="/configuracoes" className={classeAba}>
            <Settings size={20} aria-hidden="true" />
            <span>Configurações</span>
          </NavLink>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b-2 border-[#1E1B18] bg-[#BAE6FD] pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2.5">
            <SeletorDeMes />
            <div className="flex items-center gap-1.5">
              <SeletorDePerfil />
              <NavLink
                to="/configuracoes"
                className="rounded-lg border-2 border-[#1E1B18] bg-[#FFFDF9] p-1.5 text-[#1E1B18] shadow-[2px_2px_0_#1E1B18] hover:bg-[#FDE68A] md:hidden"
                aria-label="Configurações"
              >
                <Settings size={18} aria-hidden="true" />
              </NavLink>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 md:pb-10">
          <Outlet />
        </main>
      </div>

      <button
        type="button"
        onClick={() => setFabAberto(true)}
        aria-label="Novo lançamento rápido"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#1E1B18] bg-[#FCD34D] text-[#1E1B18] shadow-[4px_4px_0_#1E1B18] transition-all hover:bg-[#FBBF24] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:bottom-8 md:right-8"
      >
        <Plus size={26} strokeWidth={2.5} aria-hidden="true" />
      </button>

      <Sheet aberto={fabAberto} aoFechar={() => setFabAberto(false)} titulo="Lançamento rápido">
        <LancamentoForm
          inicial={null}
          dataPadrao={dataPadrao}
          aoSalvar={(dados) => {
            adicionarLancamento(dados);
            setFabAberto(false);
          }}
          aoCancelar={() => setFabAberto(false)}
        />
      </Sheet>
    </div>
  );
}
