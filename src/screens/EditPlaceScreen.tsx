import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';
import { getPlaceById, updatePlace } from '../services/places';
import { uploadPhoto, listPhotos } from '../services/photos';
import { addPlaceComment } from '../services/comments';
import { useUser } from '../context/UserContext';
import type { Place, Photo } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import Input from '../components/Input';
import Button from '../components/Button';
import PhotoPicker from '../components/PhotoPicker';

type EditPlaceRouteProp = RouteProp<RootStackParamList, 'EditPlace'>;

export default function EditPlaceScreen() {
  const route = useRoute<EditPlaceRouteProp>();
  const navigation = useNavigation();
  const { user } = useUser();
  const { placeId } = route.params;

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [viewType, setViewType] = useState('');
  const [isGoodForDate, setIsGoodForDate] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    loadPlaceData();
  }, [placeId]);

  const loadPlaceData = async () => {
    try {
      const placeData = await getPlaceById(placeId);
      setPlace(placeData);
      setTitle(placeData.title);
      setDescription(placeData.description || '');
      setViewType(placeData.view_type || '');
      setIsGoodForDate(placeData.is_good_for_date || false);

      // Charger les photos existantes
      const photos = await listPhotos(placeId);
      setExistingPhotos(photos);
    } catch (error) {
      console.error('Failed to load place data:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du lieu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    setSaving(true);
    try {
      const updatedPlace = await updatePlace(placeId, {
        title: title.trim(),
        description: description.trim(),
        view_type: viewType.trim(),
        is_good_for_date: isGoodForDate,
      });

      // Upload des nouvelles photos
      if (newImages.length > 0) {
        setUploadingPhotos(true);
        for (const imageUri of newImages) {
          await uploadPhoto(placeId, imageUri);
        }
        setUploadingPhotos(false);
        setNewImages([]);
      }

      Alert.alert('Succès', 'Lieu mis à jour avec succès !');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le lieu');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un commentaire');
      return;
    }

    try {
      await addPlaceComment(placeId, newComment.trim());
      Alert.alert('Succès', 'Commentaire ajouté !');
      setNewComment('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Lieu non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Modifier le lieu</Text>
        <Text style={styles.subtitle}>{place.title}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations générales</Text>
        
        <Input 
          label="Titre *" 
          placeholder="Nom du lieu" 
          value={title} 
          onChangeText={setTitle} 
        />
        
        <Input 
          label="Description" 
          placeholder="Description du lieu..." 
          value={description} 
          onChangeText={setDescription} 
          multiline 
          numberOfLines={3}
        />
        
        <Input 
          label="Type de vue" 
          placeholder="Parc, rivière, montagne, mer..." 
          value={viewType} 
          onChangeText={setViewType} 
        />

        {/* Option "Bon pour un date" */}
        <View style={styles.dateOptionContainer}>
          <Text style={styles.dateOptionLabel}>Bon pour un date ?</Text>
          <Button
            title={isGoodForDate ? "OUI" : "NON"}
            onPress={() => setIsGoodForDate(!isGoodForDate)}
            variant={isGoodForDate ? "primary" : "outline"}
            size="small"
            icon={isGoodForDate ? "heart" : "heart-outline"}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos existantes</Text>
        {existingPhotos.length > 0 ? (
          <Text style={styles.photoCount}>{existingPhotos.length} photo(s) existante(s)</Text>
        ) : (
          <Text style={styles.noPhotos}>Aucune photo pour ce lieu</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ajouter des photos</Text>
        <PhotoPicker 
          images={newImages} 
          onImagesChange={setNewImages} 
          maxImages={5} 
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ajouter un commentaire</Text>
        <Input 
          placeholder="Votre commentaire ou précision..." 
          value={newComment} 
          onChangeText={setNewComment} 
          multiline 
          numberOfLines={3}
        />
        <Button 
          title="Ajouter le commentaire" 
          onPress={handleAddComment} 
          disabled={!newComment.trim()}
          size="small"
          style={styles.commentButton}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="Sauvegarder les modifications" 
          onPress={handleSave} 
          loading={saving || uploadingPhotos}
          disabled={saving || uploadingPhotos}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...typography.h2, color: colors.error },
  header: { backgroundColor: colors.surface, padding: spacing.lg, marginBottom: spacing.md },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },
  section: { backgroundColor: colors.surface, marginBottom: spacing.md, padding: spacing.lg },
  sectionTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.lg },
  dateOptionContainer: { marginTop: spacing.md },
  dateOptionLabel: { ...typography.caption, color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
  photoCount: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  noPhotos: { ...typography.body, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
  commentButton: { marginTop: spacing.sm },
  buttonContainer: { padding: spacing.lg },
});
