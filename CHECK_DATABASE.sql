-- Script pour vérifier l'état de la base de données
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier les tables existantes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Vérifier la structure de la table places
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'places' 
ORDER BY ordinal_position;

-- 3. Vérifier la structure de la table photos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'photos' 
ORDER BY ordinal_position;

-- 4. Compter les enregistrements dans chaque table
SELECT 
  'places' as table_name,
  COUNT(*) as record_count
FROM places
UNION ALL
SELECT 
  'photos' as table_name,
  COUNT(*) as record_count
FROM photos
UNION ALL
SELECT 
  'users' as table_name,
  COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
  'reviews' as table_name,
  COUNT(*) as record_count
FROM reviews
UNION ALL
SELECT 
  'questions' as table_name,
  COUNT(*) as record_count
FROM questions
UNION ALL
SELECT 
  'answers' as table_name,
  COUNT(*) as record_count
FROM answers
UNION ALL
SELECT 
  'place_comments' as table_name,
  COUNT(*) as record_count
FROM place_comments;

-- 5. Vérifier les lieux récents
SELECT id, title, created_at, user_id
FROM places
ORDER BY created_at DESC
LIMIT 10;

-- 6. Vérifier les photos récentes
SELECT id, place_id, file_name, file_size, created_at
FROM photos
ORDER BY created_at DESC
LIMIT 10;

-- 7. Vérifier les utilisateurs
SELECT id, device_id, nickname, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;





