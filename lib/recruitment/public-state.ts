import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/server';

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

async function loadCycles(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from('recruitment_cycles')
    .select('id,status,starts_at,closes_at');
  if (error) throw new Error('Recruitment cycle lookup failed.');
  return (data ?? []) as RecruitmentCycle[];
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

export async function getEligibleRecruitmentOpenings(): Promise<RecruitmentJob[]> {
  if (!isSupabaseConfigured()) return [];

  const admin = createAdminClient();
  const [{ data: jobs, error: jobError }, cycles] = await Promise.all([
    admin
      .from('recruitment_jobs')
      .select('id,title,slug,description,requirements,closes_at,is_active,cycle_id')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    loadCycles(admin),
  ]);

  if (jobError) throw new Error('Recruitment opening lookup failed.');
  const now = Date.now();
  const cycleById = new Map(cycles.map((cycle) => [cycle.id, cycle]));
  return ((jobs ?? []) as RecruitmentJob[]).filter((job) => isEligible(job, cycleById.get(job.cycle_id) ?? null, now));
}

export async function hasEligibleRecruitmentOpening(): Promise<boolean> {
  const openings = await getEligibleRecruitmentOpenings();
  return openings.length > 0;
}
