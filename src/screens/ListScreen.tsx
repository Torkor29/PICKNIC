import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, Animated, Dimensions, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { listPlaces, getNearbyPlacesCount } from '../services/places';
import type { Place } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import SearchBar, { FilterOptions } from '../components/SearchBar';
import RatingInput from '../components/RatingInput';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'List'>;

const { width: screenWidth } = Dimensions.get('window');

export default function ListScreen() {
  const navigation = useNavigation<Navigation>();
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [totalPlacesCount, setTotalPlacesCount] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [filters, setFilters] = useState<FilterOptions>({
    viewType: '',
    minRating: 0,
    hasPhotos: false,
    sortBy: 'recent',
  });

  useEffect(() => {
    loadPlaces();
    // Animation d'entrée
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [places, searchText, filters]);

  const loadPlaces = async () => {
    try {
      const data = await listPlaces();
      setPlaces(data);
      setTotalPlacesCount(data.length);
      
      // Compter les lieux à proximité (coordonnées de Lyon par défaut)
      try {
        const nearbyCount = await getNearbyPlacesCount(45.7772, 4.8559);
        console.log(`Lieux à proximité: ${nearbyCount}`);
      } catch (nearbyError) {
        console.warn('Impossible de compter les lieux à proximité:', nearbyError);
        // En cas d'erreur, on continue sans bloquer le chargement
      }
    } catch (error) {
      console.error('Failed to load places:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlaces();
    setRefreshing(false);
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...places];

    // Apply search
    if (searchText.trim()) {
      filtered = filtered.filter(place =>
        place.title.toLowerCase().includes(searchText.toLowerCase()) ||
        place.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        place.view_type?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply view type filter
    if (filters.viewType) {
      filtered = filtered.filter(place =>
        place.view_type?.toLowerCase().includes(filters.viewType.toLowerCase())
      );
    }

    // Apply rating filter (would need to fetch reviews for this to work properly)
    if (filters.minRating > 0) {
      // This would require joining with reviews table
      // For now, we'll skip this filter
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'recent':
        filtered.sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        break;
      case 'rating':
        // Would need to join with reviews table
        break;
      case 'distance':
        // Would need user location
        break;
    }

    setFilteredPlaces(filtered);
  };

  const renderPlaceItem = ({ item, index }: { item: Place; index: number }) => {
    return (
      <Animated.View style={[styles.placeCard, { transform: [{ scale: 1 }] }]}>
        <TouchableOpacity
          style={styles.placeContent}
          onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.placeImage}>
            <Ionicons name="location" size={28} color={colors.primary} />
          </View>
          
          <View style={styles.placeInfo}>
            <Text style={styles.placeTitle} numberOfLines={1}>{item.title}</Text>
            {item.description && (
              <Text style={styles.placeDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            {item.view_type && (
              <View style={styles.viewTypeContainer}>
                <Ionicons name="eye" size={14} color={colors.primary} />
                <Text style={styles.placeType}>{item.view_type}</Text>
              </View>
            )}
            <View style={styles.placeMeta}>
              <Text style={styles.placeDate}>
                {new Date(item.created_at || '').toLocaleDateString('fr-FR')}
              </Text>
              <View style={styles.placeFeatures}>
                {item.has_shade && <Ionicons name="umbrella" size={12} color={colors.success} />}
                {item.has_parking && <Ionicons name="car" size={12} color={colors.success} />}
                {item.has_toilets && <Ionicons name="restroom" size={12} color={colors.success} />}
              </View>
            </View>
          </View>

          <View style={styles.placeActions}>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => {
            navigation.navigate('Map', { 
              centerOnPlace: {
                latitude: item.latitude,
                longitude: item.longitude,
                placeId: item.id
              }
            });
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="map" size={16} color={colors.primary} />
          <Text style={styles.mapButtonText}>Voir sur la carte</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
      <Ionicons name="search" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>
        {searchText || filters.viewType ? 'Aucun lieu trouvé' : 'Aucun lieu ajouté'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchText || filters.viewType 
          ? 'Essayez de modifier vos critères de recherche'
          : 'Soyez le premier à ajouter un lieu de pique-nique !'
        }
      </Text>
    </Animated.View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Découvrir des lieux</Text>
        <Text style={styles.headerSubtitle}>
          {filteredPlaces.length} lieu{filteredPlaces.length > 1 ? 'x' : ''} trouvé{filteredPlaces.length > 1 ? 's' : ''}
          {searchText || filters.viewType ? '' : ` sur ${totalPlacesCount} au total`}
        </Text>
      </View>
      <View style={styles.headerStats}>
        <View style={styles.statItem}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.statText}>{totalPlacesCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people" size={16} color={colors.secondary} />
          <Text style={styles.statText}>Communauté</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        <SearchBar
          value={searchText}
          onSearchChange={setSearchText}
          onFilterChange={setFilters}
          filters={filters}
        />

        <FlatList
          data={filteredPlaces}
          renderItem={renderPlaceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    marginBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  headerStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  placeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  placeContent: {
    flexDirection: 'row',
    padding: spacing.lg,
  },
  placeImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  placeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  placeTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  placeDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  viewTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  placeType: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  placeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  placeFeatures: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  placeActions: {
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mapButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
