-- Schéma de base de données pour l'application Picnic Map
-- À exécuter dans l'éditeur SQL de Supabase

-- Extensions nécessaires
create extension if not exists pgcrypto;        -- pour gen_random_uuid()
create extension if not exists cube;            -- requis par earthdistance
create extension if not exists earthdistance;   -- ll_to_earth / distance

-- NOTE: Ne pas définir app.jwt_secret sur Supabase managé depuis SQL.

-- Table des utilisateurs (basée sur l'ID de l'appareil)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des lieux de pique-nique
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  view_type TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_good_for_date BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des photos
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  file_size INTEGER, -- Taille en bytes pour optimisation
  file_name TEXT, -- Nom du fichier dans le storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des avis
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(place_id, user_id) -- Un seul avis par utilisateur par lieu
);

-- Table des questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des réponses
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des commentaires sur les lieux
CREATE TABLE IF NOT EXISTS place_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_places_location ON places USING GIST (
  ll_to_earth(latitude, longitude)
);

CREATE INDEX IF NOT EXISTS idx_places_user ON places(user_id);
CREATE INDEX IF NOT EXISTS idx_places_created ON places(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_place ON reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_place ON questions(place_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_photos_place ON photos(place_id);
CREATE INDEX IF NOT EXISTS idx_place_comments_place ON place_comments(place_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer les triggers existants avant de les recréer
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_places_updated_at ON places;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
DROP TRIGGER IF EXISTS update_answers_updated_at ON answers;
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
DROP TRIGGER IF EXISTS update_place_comments_updated_at ON place_comments;

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_place_comments_updated_at BEFORE UPDATE ON place_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer la distance entre deux points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) *
      cos(radians(lon2) - radians(lon1)) +
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour compter les lieux à moins de 5km
CREATE OR REPLACE FUNCTION count_nearby_places(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  max_distance DOUBLE PRECISION DEFAULT 5.0 -- 5km par défaut
) RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM places
    WHERE calculate_distance(user_lat, user_lon, latitude, longitude) <= max_distance
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les lieux proches
CREATE OR REPLACE FUNCTION get_nearby_places(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10
) RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  view_type TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.view_type,
    p.latitude,
    p.longitude,
    calculate_distance(user_lat, user_lon, p.latitude, p.longitude) as distance_km,
    p.created_at
  FROM places p
  WHERE calculate_distance(user_lat, user_lon, p.latitude, p.longitude) <= radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir la note moyenne d'un lieu
CREATE OR REPLACE FUNCTION get_place_rating(place_uuid UUID)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as total_reviews
  FROM places p
  LEFT JOIN reviews r ON p.id = r.place_id
  WHERE p.id = place_uuid
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_comments ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes avant de les recréer
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

DROP POLICY IF EXISTS "Anyone can view places" ON places;
DROP POLICY IF EXISTS "Anyone can create places" ON places;
DROP POLICY IF EXISTS "Users can update their own places" ON places;
DROP POLICY IF EXISTS "Users can delete their own places" ON places;

DROP POLICY IF EXISTS "Anyone can view photos" ON photos;
DROP POLICY IF EXISTS "Anyone can create photos" ON photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON photos;

DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

DROP POLICY IF EXISTS "Anyone can view questions" ON questions;
DROP POLICY IF EXISTS "Anyone can create questions" ON questions;
DROP POLICY IF EXISTS "Users can update their own questions" ON questions;
DROP POLICY IF EXISTS "Users can delete their own questions" ON questions;

DROP POLICY IF EXISTS "Anyone can view answers" ON answers;
DROP POLICY IF EXISTS "Anyone can create answers" ON answers;
DROP POLICY IF EXISTS "Users can update their own answers" ON answers;
DROP POLICY IF EXISTS "Users can delete their own answers" ON answers;

DROP POLICY IF EXISTS "Anyone can view place comments" ON place_comments;
DROP POLICY IF EXISTS "Anyone can create place comments" ON place_comments;
DROP POLICY IF EXISTS "Users can update their own place comments" ON place_comments;
DROP POLICY IF EXISTS "Users can delete their own place comments" ON place_comments;

-- Politiques RLS pour users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- Politiques RLS pour places
CREATE POLICY "Anyone can view places" ON places FOR SELECT USING (true);
CREATE POLICY "Anyone can create places" ON places FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own places" ON places FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own places" ON places FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour photos
CREATE POLICY "Anyone can view photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Anyone can create photos" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own photos" ON photos FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM places p 
    WHERE p.id = photos.place_id 
    AND p.user_id = auth.uid()
  )
);

-- Politiques RLS pour reviews
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can create reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour questions
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Anyone can create questions" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own questions" ON questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own questions" ON questions FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour answers
CREATE POLICY "Anyone can view answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Anyone can create answers" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own answers" ON answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own answers" ON answers FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour place_comments
CREATE POLICY "Anyone can view place comments" ON place_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create place comments" ON place_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own place comments" ON place_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own place comments" ON place_comments FOR DELETE USING (auth.uid() = user_id);

-- Bucket Storage pour les photos (exécuté côté base)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Politiques Storage: lecture publique, upload ouvert au bucket 'photos'
drop policy if exists "Public read photos" on storage.objects;
create policy "Public read photos" on storage.objects
  for select using (bucket_id = 'photos');

drop policy if exists "Anyone can upload photos" on storage.objects;
create policy "Anyone can upload photos" on storage.objects
  for insert with check (bucket_id = 'photos');

-- Données de test (optionnel)
INSERT INTO users (device_id, nickname) VALUES 
  ('test-device-1', 'TestUser1'),
  ('test-device-2', 'TestUser2')
ON CONFLICT (device_id) DO NOTHING;

-- Vues utiles
CREATE OR REPLACE VIEW places_with_ratings AS
SELECT 
  p.*,
  u.nickname as user_nickname,
  COALESCE(AVG(r.rating), 0) as average_rating,
  COUNT(r.id) as review_count
FROM places p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN reviews r ON p.id = r.place_id
GROUP BY p.id, u.nickname;

CREATE OR REPLACE VIEW reviews_with_users AS
SELECT 
  r.*,
  u.nickname as user_nickname
FROM reviews r
LEFT JOIN users u ON r.user_id = u.id;

CREATE OR REPLACE VIEW questions_with_users AS
SELECT 
  q.*,
  u.nickname as user_nickname
FROM questions q
LEFT JOIN users u ON q.user_id = u.id;

CREATE OR REPLACE VIEW answers_with_users AS
SELECT 
  a.*,
  u.nickname as user_nickname
FROM answers a
LEFT JOIN users u ON a.user_id = u.id;


