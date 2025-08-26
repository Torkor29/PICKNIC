export interface Place {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  view_type?: string | null;
  is_good_for_date?: boolean;
  has_shade?: boolean;
  has_flowers?: boolean;
  has_parking?: boolean;
  has_toilets?: boolean;
  is_quiet?: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  place_id: string;
  user_id: string;
  user_nickname: string;
  rating: number;
  text: string;
  created_at: string;
}

export interface Question {
  id: string;
  place_id: string;
  user_id: string;
  user_nickname: string;
  text: string;
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  user_nickname: string;
  text: string;
  created_at: string;
}

export interface Photo {
  id: string;
  place_id: string;
  url: string;
  file_size: number;
  filename: string;
  created_at: string;
}
