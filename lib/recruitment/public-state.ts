import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

type RecruitmentJob = {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string[];
  closes_at: string | null;
  is_active: boolean;
  cycle_id: string;
};

type RecruitmentCycle = {
  id: string;
  status: string;
  starts_at: string | null;
  closes_at: string | null;
};

export type RecruitmentOpeningState =
  | { kind: 'missing' }
  | { kind: 'ineligible'; job: RecruitmentJob }
  | { kind: 'eligible'; job: RecruitmentJob };

function isWithinWindow(value: string | null, now: number, mode: 'start' | 'end') {
  if (!value) return true;
  const timestamp = new Date(value).getTime();
  return mode === 'start' ? timestamp <= now : timestamp > now;
}

function isEligible(job: RecruitmentJob, cycle: RecruitmentCycle | null, now: number) {
  return Boolean(
    cycle &&
      cycle.id === job.cycle_id &&
      cycle.status === 'OPEN' &&
      job.is_active &&
      isWithinWindow(cycle.starts_at, now, 'start') &&
      isWithinWindow(cycle.closes_at, now, 'end') &&
      isWithinWindow(job.closes_at, now, 'end'),
  );
}

export async function getRecruitmentOpeningState(slug: string): Promise<RecruitmentOpeningState> {
  if (!isSupabaseConfigured()) return { kind: 'missing' };

  const admin = createAdminClient();
  const { data: job, error: jobError } = await admin
    .from('recruitment_jobs')
    .select('id,title,slug,description,requirements,closes_at,is_active,cycle_id')
    .eq('slug', slug)
    .maybeSingle();

  if (jobError) throw new Error('Recruitment opening lookup failed.');
  if (!job) return { kind: 'missing' };

  const { data: cycle, error: cycleError } = await admin
    .from('recruitment_cycles')
    .select('id,status,starts_at,closes_at')
    .eq('id', job.cycle_id)
    .maybeSingle();

  if (cycleError) throw new Error('Recruitment cycle lookup failed.');

  const normalizedJob = job as RecruitmentJob;
  const normalizedCycle = cycle as RecruitmentCycle | null;
  return isEligible(normalizedJob, normalizedCycle, Date.now())
    ? { kind: 'eligible', job: normalizedJob }
    : { kind: 'ineligible', job: normalizedJob };
}

export async function hasEligibleRecruitmentOpening(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from('recruitment_jobs')
    .select('id', { count: 'exact', head: true });

  if (error) throw new Error('Recruitment availability lookup failed.');
  return (count ?? 0) > 0;
}
