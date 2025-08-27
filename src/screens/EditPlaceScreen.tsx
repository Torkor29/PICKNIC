import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Switch,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';
import { updatePlace, deletePlace, getPlaceById } from '../services/places';
import { uploadPhoto, deletePhoto, listPhotos } from '../services/photos';
import { useUser } from '../context/UserContext';
import { colors, spacing, borderRadius, typography } from '../theme';
import type { Place, Photo } from '../types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'EditPlace'>;
type Route = RouteProp<RootStackParamList, 'EditPlace'>;

export default function EditPlaceScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { user } = useUser();
  const { placeId, place: initialPlace } = route.params;

  const [place, setPlace] = useState<Place>(initialPlace);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlaceData();
    loadPhotos();
  }, []);

  const loadPlaceData = async () => {
    try {
      // Charger les données fraîches du lieu depuis la base
      const freshPlace = await getPlaceById(placeId);
      
      // S'assurer que toutes les propriétés booléennes sont définies
      const normalizedPlace: Place = {
        ...freshPlace,
        is_good_for_date: freshPlace.is_good_for_date ?? false,
        has_shade: freshPlace.has_shade ?? false,
        has_flowers: freshPlace.has_flowers ?? false,
        has_water: freshPlace.has_water ?? false,
        has_parking: freshPlace.has_parking ?? false,
        has_toilets: freshPlace.has_toilets ?? false,
        is_quiet: freshPlace.is_quiet ?? false,
      };
      
      setPlace(normalizedPlace);
      console.log('📝 Données du lieu chargées:', normalizedPlace);
    } catch (error) {
      console.error('Erreur lors du chargement des données du lieu:', error);
      // En cas d'erreur, utiliser les données initiales avec des valeurs par défaut
      const fallbackPlace: Place = {
        ...initialPlace,
        is_good_for_date: initialPlace.is_good_for_date ?? false,
        has_shade: initialPlace.has_shade ?? false,
        has_flowers: initialPlace.has_flowers ?? false,
        has_water: initialPlace.has_water ?? false,
        has_parking: initialPlace.has_parking ?? false,
        has_toilets: initialPlace.has_toilets ?? false,
        is_quiet: initialPlace.is_quiet ?? false,
      };
      setPlace(fallbackPlace);
    }
  };

  const loadPhotos = async () => {
    try {
      const placePhotos = await listPhotos(placeId);
      setPhotos(placePhotos);
    } catch (error) {
      console.error('Erreur lors du chargement des photos:', error);
    }
  };

  const handleSave = async () => {
    if (!place.title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    try {
      setSaving(true);
      await updatePlace(placeId, {
        title: place.title.trim(),
        description: place.description?.trim() || '',
        view_type: place.view_type?.trim() || '',
        is_good_for_date: place.is_good_for_date || false,
        has_shade: place.has_shade || false,
        has_flowers: place.has_flowers || false,
        has_water: place.has_water || false,
        has_parking: place.has_parking || false,
        has_toilets: place.has_toilets || false,
        is_quiet: place.is_quiet || false,
      });

      Alert.alert('Succès', 'Lieu mis à jour avec succès', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le lieu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le lieu',
      'Êtes-vous sûr de vouloir supprimer ce lieu ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deletePlace(placeId);
              Alert.alert('Succès', 'Lieu supprimé avec succès', [
                { text: 'OK', onPress: () => navigation.navigate('Main' as any, { screen: 'MyPlaces' } as any) }
              ]);
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le lieu');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setLoading(true);
        
        try {
          const photoUrl = await uploadPhoto(placeId, asset.uri);
          await loadPhotos(); // Recharger les photos
          Alert.alert('Succès', 'Photo ajoutée avec succès');
        } catch (error) {
          console.error('Erreur lors de l\'upload:', error);
          Alert.alert('Erreur', 'Impossible d\'ajouter la photo');
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePhoto(photoId);
              await loadPhotos(); // Recharger les photos
              Alert.alert('Succès', 'Photo supprimée avec succès');
            } catch (error) {
              console.error('Erreur lors de la suppression de la photo:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la photo');
            }
          }
        }
      ]
    );
  };

  const renderFeatureToggle = (key: keyof Place, label: string, icon: string) => {
    const currentValue = place[key] as boolean;
    console.log(`🔧 Toggle ${key}:`, currentValue);
    
    return (
      <View style={styles.featureToggle}>
        <View style={styles.featureInfo}>
          <Ionicons name={icon as any} size={20} color={colors.text} />
          <Text style={styles.featureLabel}>{label}</Text>
        </View>
        <Switch
          value={currentValue}
          onValueChange={(value) => {
            console.log(`🔄 Changement ${key}: ${currentValue} → ${value}`);
            setPlace({ ...place, [key]: value });
          }}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le lieu</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            <Ionicons name="checkmark" size={24} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Informations principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Titre *</Text>
            <TextInput
              style={styles.input}
              value={place.title}
              onChangeText={(text) => setPlace({ ...place, title: text })}
              placeholder="Nom du lieu"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={place.description || ''}
              onChangeText={(text) => setPlace({ ...place, description: text })}
              placeholder="Description du lieu..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type de vue</Text>
            <TextInput
              style={styles.input}
              value={place.view_type || ''}
              onChangeText={(text) => setPlace({ ...place, view_type: text })}
              placeholder="Parc, rivière, montagne..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Caractéristiques */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Caractéristiques</Text>
            {loading && (
              <View style={styles.loadingIndicator}>
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            )}
          </View>
          
          {renderFeatureToggle('is_good_for_date', 'Idéal pour un rendez-vous', 'heart')}
          {renderFeatureToggle('has_shade', 'Avec ombre', 'umbrella')}
          {renderFeatureToggle('has_flowers', 'Avec fleurs', 'flower')}
          {renderFeatureToggle('has_water', 'Près de l\'eau', 'water')}
          {renderFeatureToggle('has_parking', 'Parking disponible', 'car')}
          {renderFeatureToggle('has_toilets', 'Toilettes disponibles', 'medical')}
          {renderFeatureToggle('is_quiet', 'Endroit calme', 'volume-low')}
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <TouchableOpacity onPress={pickImage} style={styles.addPhotoButton}>
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={styles.addPhotoText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {photos.length > 0 ? (
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <View key={photo.id} style={styles.photoContainer}>
                  <Image source={{ uri: photo.url }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.deletePhotoButton}
                    onPress={() => handleDeletePhoto(photo.id)}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noPhotos}>
              <Ionicons name="images-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.noPhotosText}>Aucune photo</Text>
              <Text style={styles.noPhotosSubtext}>Ajoutez des photos pour illustrer votre lieu</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            disabled={loading}
          >
            <Ionicons name="trash" size={20} color={colors.surface} />
            <Text style={styles.deleteButtonText}>Supprimer le lieu</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  container: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loadingIndicator: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 10,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...typography.body,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  featureToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureLabel: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.md,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addPhotoText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoContainer: {
    position: 'relative',
    width: '48%',
    aspectRatio: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  deletePhotoButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  noPhotos: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noPhotosText: {
    ...typography.h4,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  noPhotosSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  deleteButtonText: {
    ...typography.button,
    color: colors.surface,
    marginLeft: spacing.sm,
  },
});
