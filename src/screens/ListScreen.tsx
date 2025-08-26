import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { listPlaces } from '../services/places';
import type { Place } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import SearchBar, { FilterOptions } from '../components/SearchBar';
import RatingInput from '../components/RatingInput';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'List'>;

export default function ListScreen() {
  const navigation = useNavigation<Navigation>();
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    viewType: '',
    minRating: 0,
    hasPhotos: false,
    sortBy: 'recent',
  });

  useEffect(() => {
    loadPlaces();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [places, searchText, filters]);

  const loadPlaces = async () => {
    try {
      const data = await listPlaces();
      setPlaces(data);
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

  const renderPlaceItem = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.placeCard}
      onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
    >
      <View style={styles.placeImage}>
        <Ionicons name="location" size={24} color={colors.primary} />
      </View>
      
      <View style={styles.placeInfo}>
        <Text style={styles.placeTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.placeDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.view_type && (
          <Text style={styles.placeType}>{item.view_type}</Text>
        )}
        <Text style={styles.placeDate}>
          {new Date(item.created_at || '').toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.placeActions}>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>
        {searchText || filters.viewType ? 'Aucun lieu trouvé' : 'Aucun lieu ajouté'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchText || filters.viewType 
          ? 'Essayez de modifier vos critères de recherche'
          : 'Soyez le premier à ajouter un lieu de pique-nique !'
        }
      </Text>
    </View>
  );

  return (
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: spacing.md,
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: spacing.xs,
  },
  placeType: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  placeDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  placeActions: {
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStateSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
