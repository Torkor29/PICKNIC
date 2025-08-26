-- Script pour corriger les permissions RLS (Row Level Security)
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier si RLS est activé sur la table places
SELECT 'RLS sur places:' as info, relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'places';

-- 2. Vérifier les politiques existantes
SELECT 'Politiques existantes:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'places';

-- 3. Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Enable read access for all users" ON places;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON places;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON places;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON places;

-- 4. Créer des politiques plus permissives pour le développement
-- Politique pour la lecture (tous les utilisateurs)
CREATE POLICY "Enable read access for all users" ON places
FOR SELECT USING (true);

-- Politique pour l'insertion (tous les utilisateurs)
CREATE POLICY "Enable insert for all users" ON places
FOR INSERT WITH CHECK (true);

-- Politique pour la mise à jour (tous les utilisateurs)
CREATE POLICY "Enable update for all users" ON places
FOR UPDATE USING (true) WITH CHECK (true);

-- Politique pour la suppression (tous les utilisateurs)
CREATE POLICY "Enable delete for all users" ON places
FOR DELETE USING (true);

-- 5. Vérifier que les nouvelles politiques sont créées
SELECT 'Nouvelles politiques:' as info;
SELECT 
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'places'
ORDER BY policyname;

-- 6. Tester une mise à jour manuelle
SELECT 'Test de mise à jour manuelle:' as info;
UPDATE places 
SET 
  title = title || ' (RLS test)',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM places LIMIT 1
);

-- 7. Vérifier le résultat
SELECT 'Après test RLS:' as info;
SELECT 
  id,
  title,
  updated_at
FROM places 
WHERE title LIKE '%(RLS test)%'
LIMIT 1;

-- 8. Nettoyer le test
UPDATE places 
SET 
  title = REPLACE(title, ' (RLS test)', ''),
  updated_at = NOW()
WHERE title LIKE '%(RLS test)%';

-- 9. Vérification finale
SELECT 'Vérification finale - Politiques actives:' as info;
SELECT COUNT(*) as nombre_politiques
FROM pg_policies 
WHERE tablename = 'places';
