import { supabase } from '../lib/supabase';

export async function upsertUserByDevice(deviceId?: string, userId?: string, nickname?: string) {
  if (userId && nickname !== undefined) {
    const { data, error } = await supabase
      .from('users')
      .update({ nickname })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  if (!deviceId) throw new Error('deviceId required');
  const { data, error } = await supabase
    .from('users')
    .upsert({ device_id: deviceId }, { onConflict: 'device_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}


