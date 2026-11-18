import { Hammer } from 'lucide-react';
import { EstadoVazio } from '../components/ui';

export default function EmBreve({ titulo }) {
  return <EstadoVazio icone={Hammer} titulo={titulo} texto="Página não encontrada." />;
}
