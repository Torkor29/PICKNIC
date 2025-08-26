-- Script pour corriger la table photos
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Vérifier si la colonne file_name existe, sinon la créer
DO $$
BEGIN
    -- Vérifier si la colonne file_name existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' 
        AND column_name = 'file_name'
    ) THEN
        -- Ajouter la colonne file_name si elle n'existe pas
        ALTER TABLE photos ADD COLUMN file_name TEXT;
        RAISE NOTICE 'Colonne file_name ajoutee a la table photos';
    ELSE
        RAISE NOTICE 'Colonne file_name existe deja';
    END IF;
    
    -- Vérifier si la colonne file_size existe, sinon la créer
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' 
        AND column_name = 'file_size'
    ) THEN
        -- Ajouter la colonne file_size si elle n'existe pas
        ALTER TABLE photos ADD COLUMN file_size INTEGER;
        RAISE NOTICE 'Colonne file_size ajoutee a la table photos';
    ELSE
        RAISE NOTICE 'Colonne file_size existe deja';
    END IF;
    
    -- Vérifier si la colonne updated_at existe, sinon la créer
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' 
        AND column_name = 'updated_at'
    ) THEN
        -- Ajouter la colonne updated_at si elle n'existe pas
        ALTER TABLE photos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Colonne updated_at ajoutee a la table photos';
    ELSE
        RAISE NOTICE 'Colonne updated_at existe deja';
    END IF;
END $$;

-- S'assurer que les colonnes obligatoires ne sont pas NULL
UPDATE photos SET file_name = 'unknown.jpg' WHERE file_name IS NULL;
UPDATE photos SET file_size = 0 WHERE file_size IS NULL;

-- Afficher la structure finale de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'photos' 
ORDER BY ordinal_position;
