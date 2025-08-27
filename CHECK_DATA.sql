-- Script pour vérifier les données dans la base de données
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier le nombre total de lieux
SELECT 'Nombre total de lieux' as info, COUNT(*) as count FROM places;

-- 2. Vérifier les lieux existants avec leurs coordonnées
SELECT 
  id,
  title,
  latitude,
  longitude,
  created_at
FROM places 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Tester la fonction calculate_distance avec des coordonnées réelles
SELECT 
  p.title,
  p.latitude,
  p.longitude,
  calculate_distance(45.7772, 4.8559, p.latitude, p.longitude) as distance_km
FROM places p
ORDER BY distance_km
LIMIT 5;

-- 4. Tester count_nearby_places avec un rayon plus large
SELECT 'Lieux dans un rayon de 10km' as test, count_nearby_places(45.7772, 4.8559, 10.0) as result;

-- 5. Tester count_nearby_places avec un rayon de 50km
SELECT 'Lieux dans un rayon de 50km' as test, count_nearby_places(45.7772, 4.8559, 50.0) as result;

-- 6. Si aucun lieu n'existe, insérer un lieu de test
INSERT INTO places (title, description, latitude, longitude, view_type, user_id)
VALUES (
  'Parc de la Tête d''Or - Test',
  'Magnifique parc avec lac et jardins',
  45.7772,
  4.8559,
  'Parc',
  (SELECT id FROM users LIMIT 1)
) ON CONFLICT DO NOTHING;

-- 7. Vérifier à nouveau après insertion
SELECT 'Après insertion - Lieux dans 5km' as test, count_nearby_places(45.7772, 4.8559, 5.0) as result;

