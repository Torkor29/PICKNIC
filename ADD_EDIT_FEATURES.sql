-- Script pour ajouter les fonctionnalités d'édition des lieux
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier et ajouter les colonnes manquantes pour les caractéristiques
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

-- 2. Créer un trigger pour mettre à jour updated_at automatiquement
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

-- 3. Vérifier la structure finale de la table places
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'places' 
ORDER BY ordinal_position;

-- 4. Mettre à jour quelques lieux existants avec des valeurs par défaut
UPDATE places 
SET 
  has_water = COALESCE(has_water, FALSE),
  has_flowers = COALESCE(has_flowers, FALSE),
  is_quiet = COALESCE(is_quiet, FALSE),
  updated_at = COALESCE(updated_at, created_at)
WHERE has_water IS NULL OR has_flowers IS NULL OR is_quiet IS NULL OR updated_at IS NULL;

-- 5. Vérifier les données mises à jour
SELECT 
  title,
  has_shade,
  has_flowers,
  has_water,
  has_parking,
  has_toilets,
  is_quiet,
  is_good_for_date,
  created_at,
  updated_at
FROM places 
LIMIT 5;

