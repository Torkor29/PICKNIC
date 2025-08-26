import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { createPlace } from '../services/places';
import { uploadPhoto } from '../services/photos';
import { colors, spacing, borderRadius } from '../theme';
import Input from '../components/Input';
import Button from '../components/Button';
import PhotoPicker from '../components/PhotoPicker';
import { useUser } from '../context/UserContext';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'PlaceForm'>;

export default function PlaceFormScreen({ route, navigation }: Props) {
  const { latitude, longitude } = route.params ?? {};
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [viewType, setViewType] = useState('');
  const [isGoodForDate, setIsGoodForDate] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!latitude || !longitude) {
      Alert.alert('Erreur', 'Sélectionnez un point sur la carte.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire.');
      return;
    }

    setLoading(true);
    try {
      const place = await createPlace({
        title: title.trim(),
        description: description.trim() || null,
        view_type: viewType.trim() || null,
        latitude,
        longitude,
        is_good_for_date: isGoodForDate,
        user_id: user?.id || undefined,
      } as any);

      console.log('Lieu créé avec succès:', place);

      if (images.length > 0) {
        for (const uri of images) {
          try { await uploadPhoto(place.id, uri); } catch {}
        }
      }

      Alert.alert('Succès', 'Lieu ajouté sur la carte.');
      console.log('Navigation vers Main avec addedPlace:', place);
      
      // Revenir sur l'onglet Carte et y injecter le lieu ajouté
      navigation.navigate('Main' as any, {
        screen: 'Map',
        params: { addedPlace: place },
      } as any);
    } catch (e: any) {
      console.error('Erreur lors de la création:', e);
      Alert.alert('Erreur', e.message ?? "Impossible d'enregistrer le lieu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <Input label="Titre *" placeholder="Nom du lieu de pique-nique" value={title} onChangeText={setTitle} />
        <Input label="Description" placeholder="Décrivez ce qui rend ce lieu spécial..." value={description} onChangeText={setDescription} multiline numberOfLines={3} />
        <Input label="Type de vue" placeholder="Parc, rivière, montagne, mer..." value={viewType} onChangeText={setViewType} />
        
        {/* Option "Bon pour un date" */}
        <View style={styles.dateOptionContainer}>
          <Text style={styles.dateOptionLabel}>Bon pour un date ?</Text>
          <TouchableOpacity 
            style={[styles.dateOptionButton, isGoodForDate && styles.dateOptionButtonActive]} 
            onPress={() => setIsGoodForDate(!isGoodForDate)}
          >
            <Ionicons 
              name={isGoodForDate ? "heart" : "heart-outline"} 
              size={24} 
              color={isGoodForDate ? colors.surface : colors.primary} 
            />
            <Text style={[styles.dateOptionText, isGoodForDate && styles.dateOptionTextActive]}>
              {isGoodForDate ? "OUI" : "NON"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <PhotoPicker images={images} onImagesChange={setImages} maxImages={5} />
        <View style={styles.buttonContainer}>
          <Button title="Enregistrer" onPress={onSave} loading={loading} disabled={!title.trim()} size="large" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  form: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  buttonContainer: { marginTop: spacing.lg },
  dateOptionContainer: { marginVertical: spacing.md },
  dateOptionLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  dateOptionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, gap: spacing.sm },
  dateOptionButtonActive: { backgroundColor: colors.primary },
  dateOptionText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  dateOptionTextActive: { color: colors.surface },
});


