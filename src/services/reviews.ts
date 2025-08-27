import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Review } from '../types';

export async function addReview(placeId: string, rating: number, text: string): Promise<Review> {
  if (!isSupabaseConfigured()) {
    return {
      id: 'rev-' + Date.now().toString(),
      place_id: placeId,
      user_id: 'test-user',
      user_nickname: 'TestUser',
      rating,
      text,
      created_at: new Date().toISOString(),
    } as any;
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({ place_id: placeId, rating, text })
    .select('*')
    .single();

  if (error) throw error;
  return data as Review;
}

export async function listReviews(placeId: string): Promise<Review[]> {
  if (!isSupabaseConfigured()) {
    return [
      {
        id: 'r1',
        place_id: placeId,
        user_id: 'u1',
        user_nickname: 'Alice',
        rating: 4,
        text: 'Super coin calme au bord de l\'eau',
        created_at: new Date().toISOString(),
      },
    ] as any;
  }

  const { data, error } = await supabase
    .from('reviews_with_users')
    .select('*')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Review[];
}


