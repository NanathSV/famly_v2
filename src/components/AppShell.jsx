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
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => setMesSelecionado(somarMesesMesKey(mesSelecionado, -1))} className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Mês anterior">
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <button type="button" onClick={() => setMesSelecionado(mesKeyHoje())} disabled={ehMesAtual} className="min-w-[8.5rem] text-center text-base font-bold text-slate-900 disabled:cursor-default">
        {capitalizar(nomeDoMes(mesSelecionado))}
      </button>
      <button type="button" onClick={() => setMesSelecionado(somarMesesMesKey(mesSelecionado, 1))} className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Próximo mês">
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}

function SeletorDePerfil() {
  const { pessoas, perfilAtivo, setPerfilAtivo } = useFinance();
  return (
    <div role="radiogroup" aria-label="Quem está usando o app" className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
      {pessoas.map((pessoa) => {
        const ativo = pessoa.id === perfilAtivo;
        return (
          <button
            key={pessoa.id}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => setPerfilAtivo(pessoa.id)}
            className={`flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-sm font-semibold transition-colors ${ativo ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
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
  `flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-colors md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
    isActive ? 'text-brand-700 md:bg-brand-50' : 'text-slate-500 hover:text-slate-800 md:hover:bg-slate-100'
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
      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white/95 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:z-auto md:w-56 md:shrink-0 md:flex-col md:justify-start md:gap-1 md:border-r md:border-t-0 md:px-3 md:py-6">
        <p className="mb-4 hidden px-3 text-lg font-extrabold text-brand-700 md:block">Finanças do Casal</p>
        {ABAS.map(({ para, rotulo, icone: Icone, fim }) => (
          <NavLink key={para} to={para} end={fim} className={classeAba}>
            <Icone size={22} aria-hidden="true" />
            <span>{rotulo}</span>
          </NavLink>
        ))}
        <div className="hidden md:mt-auto md:block">
          <NavLink to="/configuracoes" className={classeAba}>
            <Settings size={22} aria-hidden="true" />
            <span>Configurações</span>
          </NavLink>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2">
            <SeletorDeMes />
            <div className="flex items-center gap-1">
              <SeletorDePerfil />
              <NavLink to="/configuracoes" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Configurações">
                <Settings size={20} aria-hidden="true" />
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
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95 md:bottom-8 md:right-8"
      >
        <Plus size={26} aria-hidden="true" />
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
