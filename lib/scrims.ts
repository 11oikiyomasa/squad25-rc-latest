import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type ScrimStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type ScrimVisibility = 'PUBLIC' | 'PRIVATE';

export type Scrim = {
  id: string;
  scheduled_at: string;
  opponent_name: string;
  format: 'BO1' | 'BO2' | 'BO3' | 'BO5';
  status: ScrimStatus;
  visibility: ScrimVisibility;
  result_for: number | null;
  result_against: number | null;
  public_note: string;
};

const selectFields = 'id,scheduled_at,opponent_name,format,status,visibility,result_for,result_against,public_note';

export async function getPublicScrims(): Promise<Scrim[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scrims')
    .select(selectFields)
    .eq('visibility', 'PUBLIC')
    .neq('status', 'CANCELLED')
    .order('scheduled_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Scrim[];
}
