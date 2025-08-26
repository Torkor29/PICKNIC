-- Script de test pour vérifier la mise à jour des lieux
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier qu'il y a des lieux dans la base
SELECT 'Nombre total de lieux:' as info, COUNT(*) as count FROM places;

-- 2. Afficher un lieu existant pour test
SELECT 'Lieu de test:' as info;
SELECT 
  id,
  title,
  description,
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
LIMIT 1;

-- 3. Tester une mise à jour manuelle
UPDATE places 
SET 
  title = title || ' (test)',
  has_shade = true,
  has_flowers = true,
  has_water = false,
  has_parking = true,
  has_toilets = false,
  is_quiet = true,
  is_good_for_date = true,
  updated_at = NOW()
WHERE id = (
  SELECT id FROM places LIMIT 1
);

-- 4. Vérifier que la mise à jour a fonctionné
SELECT 'Après mise à jour:' as info;
SELECT 
  id,
  title,
  has_shade,
  has_flowers,
  has_water,
  has_parking,
  has_toilets,
  is_quiet,
  is_good_for_date,
  updated_at
FROM places 
WHERE title LIKE '%(test)%'
LIMIT 1;

-- 5. Nettoyer le test
UPDATE places 
SET 
  title = REPLACE(title, ' (test)', ''),
  updated_at = NOW()
WHERE title LIKE '%(test)%';

-- 6. Vérification finale
SELECT 'Vérification finale - Lieux mis à jour:' as info, COUNT(*) as count 
FROM places 
WHERE updated_at IS NOT NULL;
