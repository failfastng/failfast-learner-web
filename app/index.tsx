import { useProgressStore } from '../src/hooks/useProgressStore';
import ColdOpenStart from '../src/screens/start/ColdOpenStart';
import ReturningStart from '../src/screens/start/ReturningStart';

export default function StartRoute() {
  const { hasAnyProgress } = useProgressStore();
  return hasAnyProgress() ? <ReturningStart /> : <ColdOpenStart />;
}
