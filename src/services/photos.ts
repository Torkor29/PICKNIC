import { supabase } from '../lib/supabase';
import type { Photo } from '../types';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export async function listPhotos(placeId: string): Promise<Photo[]> {
  console.log('🔍 Recherche des photos pour le lieu:', placeId);
  
  if (!supabase) {
    console.warn('Supabase non configuré, retour de données de test');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des photos:', error);
      throw error;
    }
    
    console.log('📸 Photos trouvées:', data?.length || 0, data);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching photos:', error);
    return [];
  }
}

export async function deletePhoto(photoId: string): Promise<boolean> {
  console.log('🗑️ Suppression de la photo:', photoId);
  
  if (!supabase) {
    console.warn('Supabase non configuré, simulation de suppression');
    return true;
  }

  try {
    // Récupérer les infos de la photo
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération de la photo:', fetchError);
      throw fetchError;
    }

    if (!photo) {
      console.error('❌ Photo non trouvée');
      return false;
    }

    // Extraire le nom du fichier de l'URL
    const urlParts = photo.url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const fullPath = `${photo.place_id}/${fileName}`;

    console.log('📁 Suppression du fichier:', fullPath);

    // Supprimer du Storage
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([fullPath]);

    if (storageError) {
      console.error('❌ Erreur lors de la suppression du fichier:', storageError);
      // On continue même si le fichier n'existe pas dans le storage
    }

    // Supprimer de la base de données
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      console.error('❌ Erreur lors de la suppression de la base:', dbError);
      throw dbError;
    }

    console.log('✅ Photo supprimée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Error deleting photo:', error);
    return false;
  }
}

export async function uploadPhoto(placeId: string, imageUri: string): Promise<Photo | null> {
  console.log('📤 Upload de photo pour le lieu:', placeId, 'URI:', imageUri);
  
  if (!supabase) {
    console.warn('Supabase non configuré, simulation d\'upload de photo');
    return {
      id: Math.random().toString(),
      place_id: placeId,
      url: imageUri,
      file_size: 0,
      filename: 'local-photo.jpg', // Corrigé de file_name à filename
      created_at: new Date().toISOString(),
    };
  }

  try {
    console.log('📤 Début de l\'upload optimisé...');
    
    // Lire le fichier en base64 (sans compression pour l'instant)
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convertir en ArrayBuffer
    const arrayBuffer = decode(base64);
    
    // Nom de fichier optimisé : placeId/timestamp-hash.jpg
    const timestamp = Date.now();
    const hash = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${hash}.jpg`;
    const fullPath = `${placeId}/${fileName}`;
    
    console.log('📁 Upload optimisé:', fullPath, 'Taille:', Math.round(arrayBuffer.byteLength / 1024), 'KB');

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fullPath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Erreur upload vers Storage:', uploadError);
      throw uploadError;
    }

    console.log('✅ Upload Storage réussi');

    // URL publique
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(fullPath);

    // Préparer les données pour la base de données
    const photoData = {
      place_id: placeId,
      url: urlData.publicUrl,
      file_size: arrayBuffer.byteLength,
      filename: fileName, // Utiliser 'filename' au lieu de 'file_name'
    };

    console.log('💾 Données à insérer:', photoData);

    // Sauvegarder dans la base de données avec métadonnées
    const { data, error } = await supabase
      .from('photos')
      .insert(photoData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de la sauvegarde de la photo:', error);
      console.error('❌ Détails de l\'erreur:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('✅ Photo uploadée avec succès:', data);
    return data;
  } catch (error) {
    console.error('❌ Error uploading photo:', error);
    console.error('❌ Détails de l\'erreur:', JSON.stringify(error, null, 2));
    return null;
  }
}


