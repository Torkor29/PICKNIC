-- SCRIPT SQL COMPLET pour l'application Picnic Map
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- Ce script corrige tous les problèmes et ajoute les nouvelles fonctionnalités
-- =====================================================

-- 1. EXTENSIONS NÉCESSAIRES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- pour gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS cube; -- requis par earthdistance
CREATE EXTENSION IF NOT EXISTS earthdistance; -- ll_to_earth / distance

-- =====================================================
-- 2. TABLES PRINCIPALES
-- =====================================================

-- Table des utilisateurs (basée sur l'ID de l'appareil)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des lieux de pique-nique (AVEC TOUTES LES COLONNES DE FILTRES)
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  view_type TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_good_for_date BOOLEAN DEFAULT false,
  has_shade BOOLEAN DEFAULT false,
  has_flowers BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  has_toilets BOOLEAN DEFAULT false,
  is_quiet BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des photos (avec colonnes optimisées)
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  file_size INTEGER, -- Taille en bytes pour optimisation
  filename TEXT, -- Nom du fichier dans le storage
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

-- Table des commentaires sur les lieux (NOUVELLE)
CREATE TABLE IF NOT EXISTS place_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index pour la géolocalisation
CREATE INDEX IF NOT EXISTS idx_places_location ON places USING GIST ( ll_to_earth(latitude, longitude) );

-- Index pour les utilisateurs
CREATE INDEX IF NOT EXISTS idx_places_user ON places(user_id);
CREATE INDEX IF NOT EXISTS idx_places_created ON places(created_at DESC);

-- Index pour les filtres
CREATE INDEX IF NOT EXISTS idx_places_is_good_for_date ON places(is_good_for_date);
CREATE INDEX IF NOT EXISTS idx_places_has_shade ON places(has_shade);
CREATE INDEX IF NOT EXISTS idx_places_has_flowers ON places(has_flowers);
CREATE INDEX IF NOT EXISTS idx_places_has_parking ON places(has_parking);
CREATE INDEX IF NOT EXISTS idx_places_has_toilets ON places(has_toilets);
CREATE INDEX IF NOT EXISTS idx_places_is_quiet ON places(is_quiet);

-- Index pour les autres tables
CREATE INDEX IF NOT EXISTS idx_reviews_place ON reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_place ON questions(place_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_photos_place ON photos(place_id);
CREATE INDEX IF NOT EXISTS idx_place_comments_place ON place_comments(place_id);

-- =====================================================
-- 4. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Fonction pour calculer la distance entre deux points
DROP FUNCTION IF EXISTS calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
CREATE OR REPLACE FUNCTION calculate_distance(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(user_lat)) * cos(radians(lat2)) * cos(radians(lon2) - radians(user_lon)) +
      sin(radians(user_lat)) * sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour compter les lieux à moins de X km
CREATE OR REPLACE FUNCTION count_nearby_places(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  max_distance DOUBLE PRECISION DEFAULT 5.0 -- 5km par défaut
)
RETURNS INTEGER AS $$
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
)
RETURNS TABLE (
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

-- =====================================================
-- 5. TRIGGERS POUR updated_at
-- =====================================================

-- Supprimer les triggers existants avant de les recréer
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_places_updated_at ON places;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
DROP TRIGGER IF EXISTS update_answers_updated_at ON answers;
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
DROP TRIGGER IF EXISTS update_place_comments_updated_at ON place_comments;

-- Créer les triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at
  BEFORE UPDATE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_place_comments_updated_at
  BEFORE UPDATE ON place_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_comments ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
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

-- Créer les nouvelles politiques RLS

-- Politiques pour users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- Politiques pour places
CREATE POLICY "Anyone can view places" ON places FOR SELECT USING (true);
CREATE POLICY "Anyone can create places" ON places FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own places" ON places FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own places" ON places FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour photos
CREATE POLICY "Anyone can view photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Anyone can create photos" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own photos" ON photos FOR DELETE USING (
  EXISTS (
    SELECT 1 
    FROM places p 
    JOIN photos ph ON p.id = ph.place_id 
    WHERE p.user_id = auth.uid()
  )
);

-- Politiques pour reviews
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can create reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour questions
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Anyone can create questions" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own questions" ON questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own questions" ON questions FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour answers
CREATE POLICY "Anyone can view answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Anyone can create answers" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own answers" ON answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own answers" ON answers FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour place_comments
CREATE POLICY "Anyone can view place comments" ON place_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create place comments" ON place_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own place comments" ON place_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own place comments" ON place_comments FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. STORAGE BUCKET POUR LES PHOTOS
-- =====================================================

-- Créer le bucket pour les photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques Storage pour les photos
DROP POLICY IF EXISTS "Public read photos" ON storage.objects;
CREATE POLICY "Public read photos" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Anyone can upload photos" ON storage.objects;
CREATE POLICY "Anyone can upload photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'photos');

DROP POLICY IF EXISTS "Owners can delete photos" ON storage.objects;
CREATE POLICY "Owners can delete photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'photos' 
  AND auth.uid()::text = (
    SELECT user_id::text 
    FROM places p 
    JOIN photos ph ON p.id = ph.place_id 
    WHERE ph.filename = split_part(name, '/', 2)
  )
);

-- =====================================================
-- 8. DONNÉES DE TEST
-- =====================================================

-- Insérer des utilisateurs de test
INSERT INTO users (device_id, nickname) VALUES 
  ('test-device-1', 'TestUser1'),
  ('test-device-2', 'TestUser2'),
  ('test-device-3', 'TestUser3'),
  ('test-device-4', 'TestUser4')
ON CONFLICT (device_id) DO NOTHING;

-- Insérer des lieux de test avec toutes les colonnes de filtres
INSERT INTO places (title, description, view_type, latitude, longitude, is_good_for_date, has_shade, has_flowers, has_parking, has_toilets, is_quiet, user_id) VALUES
  ('Parc de la Tête d''Or', 'Magnifique parc avec lac et jardins', 'Parc', 45.7772, 4.8559, true, true, true, true, true, true, (SELECT id FROM users WHERE device_id = 'test-device-1')),
  ('Bords de Saône', 'Promenade agréable le long de la rivière', 'Rivière', 45.7589, 4.8417, false, false, false, false, false, true, (SELECT id FROM users WHERE device_id = 'test-device-2')),
  ('Jardin des Plantes', 'Jardin botanique avec serres', 'Jardin', 45.7600, 4.8500, true, true, true, false, true, false, (SELECT id FROM users WHERE device_id = 'test-device-3')),
  ('Place Bellecour', 'Grande place centrale', 'Place', 45.7578, 4.8320, false, false, false, true, false, false, (SELECT id FROM users WHERE device_id = 'test-device-4')),
  ('Parc de la Croix-Rousse', 'Parc avec vue panoramique', 'Parc', 45.7700, 4.8300, true, true, false, true, false, true, (SELECT id FROM users WHERE device_id = 'test-device-1')),
  ('Quai du Rhône', 'Promenade le long du Rhône', 'Rivière', 45.7500, 4.8400, false, false, false, false, true, false, (SELECT id FROM users WHERE device_id = 'test-device-2'))
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. VUES UTILES
-- =====================================================

-- Vue pour les lieux avec notes moyennes
DROP VIEW IF EXISTS places_with_ratings;
CREATE VIEW places_with_ratings AS
SELECT 
  p.*,
  u.nickname as user_nickname,
  COALESCE(AVG(r.rating), 0) as average_rating,
  COUNT(r.id) as review_count
FROM places p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN reviews r ON p.id = r.place_id
GROUP BY p.id, u.nickname;

-- Vue pour les avis avec utilisateurs
DROP VIEW IF EXISTS reviews_with_users;
CREATE VIEW reviews_with_users AS
SELECT 
  r.*,
  u.nickname as user_nickname
FROM reviews r
LEFT JOIN users u ON r.user_id = u.id;

-- Vue pour les questions avec utilisateurs
DROP VIEW IF EXISTS questions_with_users;
CREATE VIEW questions_with_users AS
SELECT 
  q.*,
  u.nickname as user_nickname
FROM questions q
LEFT JOIN users u ON q.user_id = u.id;

-- Vue pour les réponses avec utilisateurs
DROP VIEW IF EXISTS answers_with_users;
CREATE VIEW answers_with_users AS
SELECT 
  a.*,
  u.nickname as user_nickname
FROM answers a
LEFT JOIN users u ON a.user_id = u.id;

-- Vue pour les commentaires avec utilisateurs
DROP VIEW IF EXISTS place_comments_with_users;
CREATE VIEW place_comments_with_users AS
SELECT 
  pc.*,
  u.nickname as user_nickname
FROM place_comments pc
LEFT JOIN users u ON pc.user_id = u.id;

-- =====================================================
-- 10. VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que toutes les colonnes de filtres existent
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'places' 
  AND column_name IN ('has_shade', 'has_flowers', 'has_parking', 'has_toilets', 'is_quiet', 'is_good_for_date')
ORDER BY column_name;

-- Vérifier les données de test
SELECT 
  title,
  is_good_for_date,
  has_shade,
  has_flowers,
  has_parking,
  has_toilets,
  is_quiet
FROM places
ORDER BY created_at;

-- =====================================================
-- 11. MESSAGE DE CONFIRMATION
-- =====================================================

-- Script terminé avec succès !
-- Tables créées : users, places, photos, reviews, questions, answers, place_comments
-- Colonnes de filtres ajoutées : has_shade, has_flowers, has_parking, has_toilets, is_quiet
-- Fonctions créées : calculate_distance, count_nearby_places, get_nearby_places, get_place_rating
-- RLS activé sur toutes les tables
-- Bucket storage photos configuré
-- Politiques de sécurité appliquées
-- Index de performance pour tous les filtres
-- Données de test insérées avec variété de filtres
