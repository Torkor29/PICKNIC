-- Script de nettoyage pour éviter les conflits de fonctions
-- Exécutez ce script dans l'éditeur SQL de Supabase si vous rencontrez des conflits

-- 1. Lister toutes les fonctions count_nearby_places existantes
SELECT 
  proname as function_name,
  proargtypes::regtype[] as parameter_types,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'count_nearby_places';

-- 2. Supprimer toutes les versions de la fonction
DROP FUNCTION IF EXISTS count_nearby_places(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS count_nearby_places(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS count_nearby_places(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN);

-- 3. Vérifier que toutes les fonctions ont été supprimées
SELECT 
  proname as function_name,
  proargtypes::regtype[] as parameter_types
FROM pg_proc 
WHERE proname = 'count_nearby_places';

-- 4. Recréer la fonction unique avec tous les paramètres optionnels
CREATE OR REPLACE FUNCTION count_nearby_places(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  max_distance DOUBLE PRECISION DEFAULT 5.0,
  filter_good_for_date BOOLEAN DEFAULT NULL,
  filter_has_shade BOOLEAN DEFAULT NULL,
  filter_has_flowers BOOLEAN DEFAULT NULL,
  filter_has_parking BOOLEAN DEFAULT NULL,
  filter_has_toilets BOOLEAN DEFAULT NULL,
  filter_is_quiet BOOLEAN DEFAULT NULL
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM places
    WHERE calculate_distance(user_lat, user_lon, latitude, longitude) <= max_distance
      AND (filter_good_for_date IS NULL OR is_good_for_date = filter_good_for_date)
      AND (filter_has_shade IS NULL OR has_shade = filter_has_shade)
      AND (filter_has_flowers IS NULL OR has_flowers = filter_has_flowers)
      AND (filter_has_parking IS NULL OR has_parking = filter_has_parking)
      AND (filter_has_toilets IS NULL OR has_toilets = filter_has_toilets)
      AND (filter_is_quiet IS NULL OR is_quiet = filter_is_quiet)
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Vérifier que la fonction a été créée correctement
SELECT 
  proname as function_name,
  proargtypes::regtype[] as parameter_types
FROM pg_proc 
WHERE proname = 'count_nearby_places';

-- 6. Tester la fonction
SELECT 'Test de la fonction' as test, count_nearby_places(45.7772, 4.8559, 5.0) as result;
