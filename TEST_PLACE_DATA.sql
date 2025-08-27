-- Script pour tester les données d'un lieu spécifique
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Afficher tous les lieux avec leurs caractéristiques
SELECT 'Tous les lieux avec caractéristiques:' as info;
SELECT 
  id,
  title,
  description,
  view_type,
  is_good_for_date,
  has_shade,
  has_flowers,
  has_water,
  has_parking,
  has_toilets,
  is_quiet,
  created_at,
  updated_at,
  user_id
FROM places 
ORDER BY created_at DESC;

-- 2. Afficher un lieu spécifique (remplacez l'ID par celui de votre lieu)
SELECT 'Lieu spécifique (remplacez l''ID):' as info;
SELECT 
  id,
  title,
  description,
  view_type,
  is_good_for_date,
  has_shade,
  has_flowers,
  has_water,
  has_parking,
  has_toilets,
  is_quiet,
  created_at,
  updated_at,
  user_id
FROM places 
WHERE id = '6603df82-8a78-40b0-b358-03a6870d7e53'; -- Remplacez par l'ID de votre lieu

-- 3. Mettre à jour un lieu avec des caractéristiques spécifiques pour test
UPDATE places 
SET 
  is_good_for_date = true,
  has_shade = true,
  has_flowers = false,
  has_water = true,
  has_parking = false,
  has_toilets = true,
  is_quiet = false,
  updated_at = NOW()
WHERE id = (
  SELECT id FROM places LIMIT 1
);

-- 4. Vérifier la mise à jour
SELECT 'Après mise à jour:' as info;
SELECT 
  id,
  title,
  is_good_for_date,
  has_shade,
  has_flowers,
  has_water,
  has_parking,
  has_toilets,
  is_quiet,
  updated_at
FROM places 
WHERE updated_at = (
  SELECT MAX(updated_at) FROM places
)
LIMIT 1;

-- 5. Statistiques des caractéristiques
SELECT 'Statistiques des caractéristiques:' as info;
SELECT 
  COUNT(*) as total_lieux,
  SUM(CASE WHEN is_good_for_date THEN 1 ELSE 0 END) as bons_pour_rdv,
  SUM(CASE WHEN has_shade THEN 1 ELSE 0 END) as avec_ombre,
  SUM(CASE WHEN has_flowers THEN 1 ELSE 0 END) as avec_fleurs,
  SUM(CASE WHEN has_water THEN 1 ELSE 0 END) as pres_eau,
  SUM(CASE WHEN has_parking THEN 1 ELSE 0 END) as avec_parking,
  SUM(CASE WHEN has_toilets THEN 1 ELSE 0 END) as avec_toilettes,
  SUM(CASE WHEN is_quiet THEN 1 ELSE 0 END) as calmes
FROM places;

