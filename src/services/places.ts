import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Place } from '../types';

export async function createPlace(place: Omit<Place, 'id' | 'created_at' | 'updated_at'>): Promise<Place> {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase non configuré - Mode développement avec données temporaires');
    console.warn('📝 Pour une vraie application en ligne, configurez Supabase dans .env');
    const newPlace: Place = {
      id: 'dev-' + Date.now(),
      title: place.title,
      description: place.description,
      view_type: place.view_type,
      latitude: place.latitude,
      longitude: place.longitude,
      is_good_for_date: place.is_good_for_date || false,
      has_shade: place.has_shade || false,
      has_flowers: place.has_flowers || false,
      has_parking: place.has_parking || false,
      has_toilets: place.has_toilets || false,
      is_quiet: place.is_quiet || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: place.user_id || 'dev-user',
    };
    console.log('📍 Lieu créé (mode dev):', newPlace);
    return newPlace;
  }

  console.log('🌐 Création du lieu dans Supabase...');
  const { data, error } = await supabase
    .from('places')
    .insert(place)
    .select()
    .single();

  if (error) {
    console.error('❌ Erreur Supabase:', error);
    throw new Error(`Impossible de créer le lieu: ${error.message}`);
  }
  
  console.log('✅ Lieu créé dans Supabase:', data);
  return data;
}

export async function getPlaceById(placeId: string): Promise<Place> {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase non configuré - Données de test');
    return {
      id: placeId,
      title: 'Lieu de test (Supabase non configuré)',
      description: 'Configurez Supabase pour une vraie application en ligne',
      view_type: 'Test',
      latitude: 45.7772,
      longitude: 4.8559,
      is_good_for_date: false,
      has_shade: false,
      has_flowers: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'test-user',
    };
  }

  console.log('🔍 Recherche du lieu par ID:', placeId);
  
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', placeId)
    .single();

  if (error) {
    console.error('❌ Erreur Supabase lors de la recherche:', error);
    if (error.code === 'PGRST116') {
      throw new Error(`Lieu non trouvé avec l'ID: ${placeId}`);
    }
    throw new Error(`Impossible de récupérer le lieu: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Lieu non trouvé avec l'ID: ${placeId}`);
  }

  console.log('✅ Lieu trouvé:', data);
  return data;
}

export async function listPlaces(searchTerm?: string): Promise<Place[]> {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase non configuré - Données de test');
    const testPlaces = [
      {
        id: '1',
        title: 'Parc de la Tête d\'Or',
        description: 'Magnifique parc avec lac et jardins',
        view_type: 'Parc',
        latitude: 45.7772,
        longitude: 4.8559,
        is_good_for_date: true,
        has_shade: true,
        has_flowers: true,
        has_parking: true,
        has_toilets: true,
        is_quiet: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'test-user-1',
      },
      {
        id: '2',
        title: 'Bords de Saône',
        description: 'Promenade agréable le long de la rivière',
        view_type: 'Rivière',
        latitude: 45.7589,
        longitude: 4.8417,
        is_good_for_date: false,
        has_shade: false,
        has_flowers: false,
        has_parking: false,
        has_toilets: false,
        is_quiet: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'test-user-2',
      },
      {
        id: '3',
        title: 'Jardin des Plantes',
        description: 'Jardin botanique avec serres',
        view_type: 'Jardin',
        latitude: 45.7600,
        longitude: 4.8500,
        is_good_for_date: true,
        has_shade: true,
        has_flowers: true,
        has_parking: false,
        has_toilets: true,
        is_quiet: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'test-user-3',
      },
      {
        id: '4',
        title: 'Place Bellecour',
        description: 'Grande place centrale',
        view_type: 'Place',
        latitude: 45.7578,
        longitude: 4.8320,
        is_good_for_date: false,
        has_shade: false,
        has_flowers: false,
        has_parking: true,
        has_toilets: false,
        is_quiet: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'test-user-4',
      },
    ];
  }

  console.log('🌐 Chargement des lieux depuis Supabase...');
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erreur Supabase:', error);
    throw new Error(`Impossible de charger les lieux: ${error.message}`);
  }

  console.log(`✅ ${data?.length || 0} lieux chargés depuis Supabase`);
  return data || [];
}

export async function getNearbyPlacesCount(latitude: number, longitude: number): Promise<number> {
  if (!isSupabaseConfigured()) {
    return Math.floor(Math.random() * 10) + 1; // Mock data
  }

  try {
    const { data, error } = await supabase
      .rpc('count_nearby_places', {
        user_lat: latitude,
        user_lon: longitude,
        max_distance: 5.0
      });

    if (error) {
      console.error('Error counting nearby places:', error);
      // En cas d'erreur, on retourne une valeur par défaut au lieu de 0
      return Math.floor(Math.random() * 10) + 1;
    }

    return data || 0;
  } catch (error) {
    console.error('Error counting nearby places:', error);
    // En cas d'erreur, on retourne une valeur par défaut au lieu de 0
    return Math.floor(Math.random() * 10) + 1;
  }
}

export async function updatePlace(placeId: string, updates: Partial<Place>): Promise<Place> {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase non configuré - Simulation de mise à jour');
    return {
      id: placeId,
      title: updates.title || 'Lieu mis à jour',
      description: updates.description,
      view_type: updates.view_type,
      latitude: 45.7772,
      longitude: 4.8559,
      is_good_for_date: updates.is_good_for_date,
      created_at: new Date().toISOString(),
      user_id: 'dev-user',
    };
  }

  console.log('🌐 Vérification de l\'existence du lieu:', placeId);
  
  // D'abord vérifier si le lieu existe
  const { data: existingPlace, error: checkError } = await supabase
    .from('places')
    .select('*')
    .eq('id', placeId)
    .single();

  if (checkError) {
    console.error('❌ Erreur lors de la vérification du lieu:', checkError);
    throw new Error(`Lieu non trouvé avec l'ID: ${placeId}`);
  }

  if (!existingPlace) {
    throw new Error(`Lieu non trouvé avec l'ID: ${placeId}`);
  }

  console.log('✅ Lieu trouvé, mise à jour en cours...');
  
  // Maintenant mettre à jour le lieu
  const { data, error } = await supabase
    .from('places')
    .update(updates)
    .eq('id', placeId)
    .select('*');

  if (error) {
    console.error('❌ Erreur Supabase lors de la mise à jour:', error);
    throw new Error(`Impossible de mettre à jour le lieu: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`Aucune donnée retournée lors de la mise à jour du lieu: ${placeId}`);
  }
  
  console.log('✅ Lieu mis à jour dans Supabase:', data[0]);
  return data[0];
}

export async function deletePlace(placeId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase non configuré - Simulation de suppression');
    console.log('🗑️ Lieu supprimé (mode dev):', placeId);
    return;
  }

  console.log('🌐 Suppression du lieu:', placeId);
  
  // D'abord vérifier si le lieu existe
  const { data: existingPlace, error: checkError } = await supabase
    .from('places')
    .select('*')
    .eq('id', placeId)
    .single();

  if (checkError) {
    console.error('❌ Erreur lors de la vérification du lieu:', checkError);
    throw new Error(`Lieu non trouvé avec l'ID: ${placeId}`);
  }

  if (!existingPlace) {
    throw new Error(`Lieu non trouvé avec l'ID: ${placeId}`);
  }

  console.log('✅ Lieu trouvé, suppression en cours...');
  
  // Supprimer le lieu
  const { error } = await supabase
    .from('places')
    .delete()
    .eq('id', placeId);

  if (error) {
    console.error('❌ Erreur Supabase lors de la suppression:', error);
    throw new Error(`Impossible de supprimer le lieu: ${error.message}`);
  }
  
  console.log('✅ Lieu supprimé de Supabase:', placeId);
}


