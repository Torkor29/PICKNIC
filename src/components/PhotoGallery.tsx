import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  Text,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Photo {
  id: string;
  url: string;
  filename?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  visible: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function PhotoGallery({ photos, visible, onClose, initialIndex = 0 }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setCurrentIndex(roundIndex);
  };

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

  if (!visible || photos.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        {/* Header avec bouton fermer et compteur */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.surface} />
          </TouchableOpacity>
          <Text style={styles.counter}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>

        {/* Galerie d'images */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContainer}
          initialScrollIndex={initialIndex}
        >
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.imageContainer}>
              <Image
                source={{ uri: photo.url }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>

        {/* Boutons de navigation */}
        {photos.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity style={[styles.navButton, styles.prevButton]} onPress={goToPrevious}>
                <Ionicons name="chevron-back" size={30} color={colors.surface} />
              </TouchableOpacity>
            )}
            {currentIndex < photos.length - 1 && (
              <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={goToNext}>
                <Ionicons name="chevron-forward" size={30} color={colors.surface} />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Indicateurs de page */}
        {photos.length > 1 && (
          <View style={styles.indicators}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg + 20, // Espace pour la barre de statut
    paddingBottom: spacing.md,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  imageContainer: {
    width: screenWidth,
    height: screenHeight - 200, // Réserver de l'espace pour header et indicateurs
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: '100%',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -25,
  },
  prevButton: {
    left: spacing.md,
  },
  nextButton: {
    right: spacing.md,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicator: {
    backgroundColor: colors.surface,
  },
});
