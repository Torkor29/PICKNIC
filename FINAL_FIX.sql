-- SCRIPT FINAL POUR CORRIGER TOUS LES PROBLÈMES
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Supprimer la table photos si elle existe avec la mauvaise structure
DROP TABLE IF EXISTS photos CASCADE;

-- 2. Recréer la table photos avec la bonne structure
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  file_size INTEGER,
  filename TEXT NOT NULL, -- Colonne obligatoire sans underscore
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer les index pour les photos
CREATE INDEX IF NOT EXISTS idx_photos_place ON photos(place_id);

-- 4. Créer le trigger pour updated_at
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Activer RLS sur photos
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 6. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Anyone can view photos" ON photos;
DROP POLICY IF EXISTS "Anyone can create photos" ON photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON photos;

-- 7. Créer les nouvelles politiques RLS
CREATE POLICY "Anyone can view photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Anyone can create photos" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own photos" ON photos FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM places p 
    WHERE p.id = photos.place_id 
    AND p.user_id = auth.uid()
  )
);

-- 8. Vérifier que le bucket storage existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Supprimer les anciennes politiques storage
DROP POLICY IF EXISTS "Public read photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete photos" ON storage.objects;

-- 10. Créer les nouvelles politiques storage
CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Anyone can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Owners can delete photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos' AND 
    auth.uid()::text = (
      SELECT user_id::text 
      FROM places p 
      JOIN photos ph ON p.id = ph.place_id 
      WHERE ph.filename = split_part(name, '/', 2)
    )
  );

-- Création de la table places avec les nouvelles colonnes
CREATE TABLE IF NOT EXISTS places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  view_type TEXT,
  is_good_for_date BOOLEAN DEFAULT false,
  has_shade BOOLEAN DEFAULT false,
  has_flowers BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Vérifier la structure finale
SELECT 'Structure de la table photos:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'photos' 
ORDER BY ordinal_position;

-- 12. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Script final execute avec succes !';
  RAISE NOTICE 'Table photos recreee avec la bonne structure';
  RAISE NOTICE 'Colonne filename (sans underscore) ajoutee';
  RAISE NOTICE 'RLS et politiques storage configures';
END $$;
