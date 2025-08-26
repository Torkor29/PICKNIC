import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Text,
} from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import type { Photo } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PhotoGalleryProps {
  photos: Photo[];
  visible: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function PhotoGallery({ 
  photos, 
  visible, 
  onClose, 
  initialIndex = 0 
}: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentPhoto = photos[currentIndex];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Header avec compteur et bouton fermer */}
        <View style={styles.header}>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {photos.length}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Image principale */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: currentPhoto?.url }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={goToPrevious}
            disabled={currentIndex === 0}
          >
            <Ionicons 
              name="chevron-back" 
              size={32} 
              color={currentIndex === 0 ? colors.textSecondary : "white"} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, currentIndex === photos.length - 1 && styles.navButtonDisabled]}
            onPress={goToNext}
            disabled={currentIndex === photos.length - 1}
          >
            <Ionicons 
              name="chevron-forward" 
              size={32} 
              color={currentIndex === photos.length - 1 ? colors.textSecondary : "white"} 
            />
          </TouchableOpacity>
        </View>

        {/* Indicateurs de position */}
        {photos.length > 1 && (
          <View style={styles.indicators}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentIndex && styles.indicatorActive
                ]}
              />
            ))}
          </View>
        )}

        {/* Informations sur la photo */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {currentPhoto?.filename || 'Photo'}
          </Text>
          {currentPhoto?.file_size && (
            <Text style={styles.infoText}>
              {(currentPhoto.file_size / 1024).toFixed(1)} KB
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 20,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  counter: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  counterText: {
    ...typography.body,
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  navigation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  navButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: 'white',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  infoText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
});
