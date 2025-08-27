import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Question, Answer } from '../types';

export async function addQuestion(placeId: string, text: string): Promise<Question> {
  if (!isSupabaseConfigured()) {
    return {
      id: 'q-' + Date.now(),
      place_id: placeId,
      user_id: 'test-user',
      user_nickname: 'TestUser',
      text,
      created_at: new Date().toISOString(),
    } as any;
  }

  const { data, error } = await supabase
    .from('questions')
    .insert({ place_id: placeId, text })
    .select('*')
    .single();
  if (error) throw error;
  return data as Question;
}

export async function addAnswer(questionId: string, text: string): Promise<Answer> {
  if (!isSupabaseConfigured()) {
    return {
      id: 'a-' + Date.now(),
      question_id: questionId,
      user_id: 'test-user',
      user_nickname: 'TestUser',
      text,
      created_at: new Date().toISOString(),
    } as any;
  }

  const { data, error } = await supabase
    .from('answers')
    .insert({ question_id: questionId, text })
    .select('*')
    .single();
  if (error) throw error;
  return data as Answer;
}

export async function listQuestionsWithAnswers(placeId: string): Promise<(Question & { answers: Answer[] })[]> {
  if (!isSupabaseConfigured()) {
    return [
      {
        id: 'q1',
        place_id: placeId,
        user_id: 'u2',
        user_nickname: 'Bob',
        text: 'Y a-t-il de l\'ombre ?'
,        created_at: new Date().toISOString(),
        answers: [
          {
            id: 'a1',
            question_id: 'q1',
            user_id: 'u3',
            user_nickname: 'Clara',
            text: 'Oui, surtout en fin d\'après-midi',
            created_at: new Date().toISOString(),
          },
        ],
      },
    ] as any;
  }

  const { data, error } = await supabase
    .from('questions_with_users')
    .select('*, answers:answers_with_users(*)')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as any;
}


