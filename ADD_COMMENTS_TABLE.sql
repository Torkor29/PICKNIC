-- Script pour ajouter la table des commentaires
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Table des commentaires sur les lieux
CREATE TABLE IF NOT EXISTS place_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_place_comments_place ON place_comments(place_id);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_place_comments_updated_at ON place_comments;
CREATE TRIGGER update_place_comments_updated_at BEFORE UPDATE ON place_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS
ALTER TABLE place_comments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Anyone can view place comments" ON place_comments;
CREATE POLICY "Anyone can view place comments" ON place_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create place comments" ON place_comments;
CREATE POLICY "Anyone can create place comments" ON place_comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own place comments" ON place_comments;
CREATE POLICY "Users can update their own place comments" ON place_comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own place comments" ON place_comments;
CREATE POLICY "Users can delete their own place comments" ON place_comments FOR DELETE USING (auth.uid() = user_id);






