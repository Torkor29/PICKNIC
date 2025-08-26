-- Script pour résoudre le conflit de surcharge de fonction count_nearby_places
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Supprimer toutes les versions existantes de la fonction count_nearby_places
DROP FUNCTION IF EXISTS count_nearby_places(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS count_nearby_places(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN);

-- Créer une seule version de la fonction avec des paramètres optionnels
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

-- Vérifier que la fonction fonctionne
SELECT count_nearby_places(45.7772, 4.8559, 5.0);
