-- Script pour ajouter les colonnes de filtres manquantes à la table places
-- À exécuter dans l'éditeur SQL de Supabase

-- Ajout des colonnes de filtres à la table places
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS has_shade BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_flowers BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_toilets BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_quiet BOOLEAN DEFAULT false;

-- Mise à jour des lieux existants pour avoir des valeurs par défaut
UPDATE places 
SET 
  has_shade = false,
  has_flowers = false,
  has_parking = false,
  has_toilets = false,
  is_quiet = false
WHERE has_shade IS NULL 
   OR has_flowers IS NULL 
   OR has_parking IS NULL 
   OR has_toilets IS NULL 
   OR is_quiet IS NULL;

-- Création d'index pour optimiser les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_places_has_shade ON places(has_shade);
CREATE INDEX IF NOT EXISTS idx_places_has_flowers ON places(has_flowers);
CREATE INDEX IF NOT EXISTS idx_places_has_parking ON places(has_parking);
CREATE INDEX IF NOT EXISTS idx_places_has_toilets ON places(has_toilets);
CREATE INDEX IF NOT EXISTS idx_places_is_quiet ON places(is_quiet);
CREATE INDEX IF NOT EXISTS idx_places_is_good_for_date ON places(is_good_for_date);

-- Vérification que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'places' 
  AND column_name IN ('has_shade', 'has_flowers', 'has_parking', 'has_toilets', 'is_quiet', 'is_good_for_date')
ORDER BY column_name;
