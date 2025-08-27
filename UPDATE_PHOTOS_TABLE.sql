-- Script pour mettre à jour la table photos existante
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Ajouter les nouvelles colonnes à la table photos
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ajouter le trigger pour updated_at si il n'existe pas
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Créer la fonction count_nearby_places si elle n'existe pas
CREATE OR REPLACE FUNCTION count_nearby_places(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  max_distance DOUBLE PRECISION DEFAULT 5.0
) RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM places
    WHERE calculate_distance(user_lat, user_lon, latitude, longitude) <= max_distance
  );
END;
$$ LANGUAGE plpgsql;

-- Vérifier que les extensions nécessaires sont installées
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Mettre à jour les politiques de storage pour optimiser les performances
DROP POLICY IF EXISTS "Public read photos" ON storage.objects;
CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Anyone can upload photos" ON storage.objects;
CREATE POLICY "Anyone can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos');

-- Ajouter une politique pour la suppression (propriétaires uniquement)
DROP POLICY IF EXISTS "Owners can delete photos" ON storage.objects;
CREATE POLICY "Owners can delete photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos' AND 
    auth.uid()::text = (
      SELECT user_id::text 
      FROM places p 
      JOIN photos ph ON p.id = ph.place_id 
      WHERE ph.file_name = storage.foldername(name)[2]
    )
  );
