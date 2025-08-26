export type Place = {
  id: string;
  title: string;
  description?: string | null;
  view_type?: string | null;
  latitude: number;
  longitude: number;
  is_good_for_date?: boolean;
  created_at?: string;
  user_id?: string;
};

export type Review = {
  id: string;
  place_id: string;
  user_id: string;
  user_nickname: string;
  rating: number;
  text: string;
  created_at: string;
  updated_at: string;
};

export type Question = {
  id: string;
  place_id: string;
  user_id: string;
  user_nickname: string;
  text: string;
  created_at: string;
  updated_at: string;
};

export type Answer = {
  id: string;
  question_id: string;
  user_id: string;
  user_nickname: string;
  text: string;
  created_at: string;
  updated_at: string;
};

export type Photo = {
  id: string;
  place_id: string;
  url: string;
  file_size?: number;
  filename?: string; // Changé de file_name à filename
  created_at: string;
};

export type PlaceComment = {
  id: string;
  place_id: string;
  user_id: string;
  user_nickname: string;
  text: string;
  created_at: string;
  updated_at: string;
};


