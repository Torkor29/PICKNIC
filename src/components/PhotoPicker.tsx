import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';

type PhotoPickerProps = {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
};

export default function PhotoPicker({ images, onImagesChange, maxImages = 5 }: PhotoPickerProps) {
  const [uploading, setUploading] = useState(false);

  const pickImages = async () => {
    console.log('📸 Tentative d\'ouverture de la galerie...');
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📱 Statut permission galerie:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission', 'Autorisez l\'accès aux photos.');
        return;
      }

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        Alert.alert('Limite atteinte', `Maximum ${maxImages} photos autorisées.`);
        return;
      }

      console.log('🖼️ Lancement de la galerie...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
      });

      console.log('📸 Résultat galerie:', result);
      
      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        console.log('🖼️ Nouvelles images sélectionnées:', newImages);
        onImagesChange([...images, ...newImages]);
      }
    } catch (error) {
      console.error('❌ Erreur galerie:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie');
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const takePhoto = async () => {
    console.log('📷 Tentative d\'ouverture de la caméra...');
    
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📱 Statut permission caméra:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission', 'Autorisez l\'accès à la caméra.');
        return;
      }

      if (images.length >= maxImages) {
        Alert.alert('Limite atteinte', `Maximum ${maxImages} photos autorisées.`);
        return;
      }

      console.log('📷 Lancement de la caméra...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      console.log('📷 Résultat caméra:', result);
      
      if (!result.canceled && result.assets?.[0]) {
        console.log('📷 Nouvelle photo prise:', result.assets[0].uri);
        onImagesChange([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('❌ Erreur caméra:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la caméra');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Photos ({images.length}/{maxImages})</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.galleryButton, images.length >= maxImages && styles.buttonDisabled]}
          onPress={pickImages}
          disabled={images.length >= maxImages}
          activeOpacity={0.8}
        >
          <Ionicons name="images-outline" size={20} color={colors.primary} />
          <Text style={[styles.buttonText, images.length >= maxImages && styles.buttonTextDisabled]}>
            Galerie
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.cameraButton, images.length >= maxImages && styles.buttonDisabled]}
          onPress={takePhoto}
          disabled={images.length >= maxImages}
          activeOpacity={0.8}
        >
          <Ionicons name="camera-outline" size={20} color={colors.primary} />
          <Text style={[styles.buttonText, images.length >= maxImages && styles.buttonTextDisabled]}>
            Caméra
          </Text>
        </TouchableOpacity>
      </View>

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    gap: spacing.xs,
  },
  galleryButton: {
    borderColor: colors.primary,
  },
  cameraButton: {
    borderColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
    borderColor: colors.textSecondary,
  },
  buttonText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 14,
  },
  buttonTextDisabled: {
    color: colors.textSecondary,
  },
  imageContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
});
