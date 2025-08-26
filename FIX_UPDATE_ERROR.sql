-- Script de correction pour l'erreur de mise à jour des lieux
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure actuelle de la table places
SELECT 'Structure actuelle de la table places:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'places' 
ORDER BY ordinal_position;

-- 2. Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
  -- Ajouter has_water si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'places' AND column_name = 'has_water') THEN
    ALTER TABLE places ADD COLUMN has_water BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Colonne has_water ajoutée';
  END IF;

  -- Ajouter has_flowers si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'places' AND column_name = 'has_flowers') THEN
    ALTER TABLE places ADD COLUMN has_flowers BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Colonne has_flowers ajoutée';
  END IF;

  -- Ajouter is_quiet si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'places' AND column_name = 'is_quiet') THEN
    ALTER TABLE places ADD COLUMN is_quiet BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Colonne is_quiet ajoutée';
  END IF;

  -- Ajouter updated_at si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'places' AND column_name = 'updated_at') THEN
    ALTER TABLE places ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Colonne updated_at ajoutée';
  END IF;
END $$;

-- 3. Mettre à jour les valeurs NULL avec des valeurs par défaut
UPDATE places 
SET 
  has_water = COALESCE(has_water, FALSE),
  has_flowers = COALESCE(has_flowers, FALSE),
  is_quiet = COALESCE(is_quiet, FALSE),
  updated_at = COALESCE(updated_at, created_at)
WHERE has_water IS NULL OR has_flowers IS NULL OR is_quiet IS NULL OR updated_at IS NULL;

-- 4. Créer le trigger pour updated_at s'il n'existe pas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS update_places_updated_at ON places;

-- Créer le trigger
CREATE TRIGGER update_places_updated_at 
    BEFORE UPDATE ON places 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Tester la mise à jour d'un lieu
SELECT 'Test de mise à jour d''un lieu:' as info;
SELECT 
  id,
  title,
  has_water,
  has_flowers,
  is_quiet,
  updated_at
FROM places 
LIMIT 1;

-- 6. Vérifier que tout fonctionne
SELECT 'Vérification finale - Nombre de lieux:' as info, COUNT(*) as count FROM places;
SELECT 'Vérification finale - Colonnes de la table:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'places' 
ORDER BY ordinal_position;
