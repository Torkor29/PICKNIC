-- Script de test complet pour l'application Picnic Map
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier que toutes les tables existent
SELECT 'Tables existantes:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'places', 'photos', 'reviews', 'questions', 'answers', 'place_comments')
ORDER BY table_name;

-- 2. Vérifier que toutes les fonctions existent
SELECT 'Fonctions existantes:' as info;
SELECT proname as function_name FROM pg_proc 
WHERE proname IN ('calculate_distance', 'count_nearby_places', 'get_nearby_places', 'get_place_rating')
ORDER BY proname;

-- 3. Vérifier les données existantes
SELECT 'Nombre d\'utilisateurs:' as info, COUNT(*) as count FROM users;
SELECT 'Nombre de lieux:' as info, COUNT(*) as count FROM places;
SELECT 'Nombre de photos:' as info, COUNT(*) as count FROM photos;
SELECT 'Nombre d\'avis:' as info, COUNT(*) as count FROM reviews;
SELECT 'Nombre de questions:' as info, COUNT(*) as count FROM questions;
SELECT 'Nombre de réponses:' as info, COUNT(*) as count FROM answers;

-- 4. Insérer des données de test si la base est vide
DO $$
BEGIN
  -- Insérer un utilisateur de test s'il n'existe pas
  IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    INSERT INTO users (device_id, nickname) 
    VALUES ('test-device-001', 'Utilisateur Test')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Insérer des lieux de test s'ils n'existent pas
  IF NOT EXISTS (SELECT 1 FROM places LIMIT 1) THEN
    INSERT INTO places (title, description, latitude, longitude, view_type, user_id, is_good_for_date, has_shade, has_parking, has_toilets)
    VALUES 
      ('Parc de la Tête d''Or', 'Magnifique parc avec lac et jardins', 45.7772, 4.8559, 'Parc', (SELECT id FROM users LIMIT 1), true, true, true, true),
      ('Bords de Saône', 'Promenade agréable le long de la rivière', 45.7589, 4.8417, 'Rivière', (SELECT id FROM users LIMIT 1), false, false, false, false),
      ('Jardin des Plantes', 'Jardin botanique avec serres', 45.7600, 4.8500, 'Jardin', (SELECT id FROM users LIMIT 1), true, true, false, true),
      ('Place Bellecour', 'Grande place centrale', 45.7578, 4.8320, 'Place', (SELECT id FROM users LIMIT 1), false, false, true, false)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 5. Vérifier les données après insertion
SELECT 'Après insertion - Nombre de lieux:' as info, COUNT(*) as count FROM places;

-- 6. Tester la fonction count_nearby_places
SELECT 'Test count_nearby_places (5km):' as test, count_nearby_places(45.7772, 4.8559, 5.0) as result;

-- 7. Tester la fonction calculate_distance
SELECT 
  p.title,
  calculate_distance(45.7772, 4.8559, p.latitude, p.longitude) as distance_km
FROM places p
ORDER BY distance_km;

-- 8. Vérifier la structure des lieux
SELECT 
  title,
  view_type,
  is_good_for_date,
  has_shade,
  has_parking,
  has_toilets,
  created_at
FROM places
ORDER BY created_at DESC;

