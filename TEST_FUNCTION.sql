-- Script de test pour vérifier la fonction count_nearby_places
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier que la fonction existe
SELECT 
  proname as function_name,
  proargtypes::regtype[] as parameter_types
FROM pg_proc 
WHERE proname = 'count_nearby_places';

-- 2. Tester la fonction avec différents paramètres
SELECT 'Test 1: Fonction de base' as test_name, count_nearby_places(45.7772, 4.8559, 5.0) as result;

-- 3. Tester avec des filtres (tous NULL par défaut)
SELECT 'Test 2: Avec filtres NULL' as test_name, 
       count_nearby_places(45.7772, 4.8559, 5.0, NULL, NULL, NULL, NULL, NULL, NULL) as result;

-- 4. Tester avec un filtre spécifique
SELECT 'Test 3: Avec filtre has_shade=true' as test_name, 
       count_nearby_places(45.7772, 4.8559, 5.0, NULL, true, NULL, NULL, NULL, NULL) as result;

-- 5. Vérifier que la fonction calculate_distance existe aussi
SELECT 
  proname as function_name,
  proargtypes::regtype[] as parameter_types
FROM pg_proc 
WHERE proname = 'calculate_distance';

-- 6. Tester calculate_distance
SELECT 'Test 4: calculate_distance' as test_name, 
       calculate_distance(45.7772, 4.8559, 45.7772, 4.8559) as distance_km;

