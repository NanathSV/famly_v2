import { Route, Routes } from 'react-router-dom';

import AppShell from './components/AppShell';
import Acerto from './pages/Acerto';
import Configuracoes from './pages/Configuracoes';
import Dashboard from './pages/Dashboard';
import EmBreve from './pages/EmBreve';
import Lancamentos from './pages/Lancamentos';
import Metas from './pages/Metas';
import Orcamentos from './pages/Orcamentos';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="lancamentos" element={<Lancamentos />} />
        <Route path="acerto" element={<Acerto />} />
        <Route path="orcamentos" element={<Orcamentos />} />
        <Route path="metas" element={<Metas />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<EmBreve titulo="Página não encontrada" />} />
      </Route>
    </Routes>
  );
}
