import MatchCenter from '@/components/match-center';
import type { Scrim } from '@/lib/scrims';

export default function ScrimsContent({ scrims }: { scrims: Scrim[] }) {
  return <MatchCenter scrims={scrims} />;
}
