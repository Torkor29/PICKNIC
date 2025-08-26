import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';

type SearchBarProps = {
  value: string;
  onSearchChange: (text: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  filters: FilterOptions;
};

export type FilterOptions = {
  viewType: string;
  minRating: number;
  hasPhotos: boolean;
  sortBy: 'recent' | 'rating' | 'distance';
};

export default function SearchBar({ value, onSearchChange, onFilterChange, filters }: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

  const applyFilters = () => {
    onFilterChange(tempFilters);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      viewType: '',
      minRating: 0,
      hasPhotos: false,
      sortBy: 'recent',
    };
    setTempFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = filters.viewType || filters.minRating > 0 || filters.hasPhotos;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un lieu..."
          value={value}
          onChangeText={onSearchChange}
          placeholderTextColor={colors.textSecondary}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
        onPress={() => setShowFilters(true)}
      >
        <Ionicons 
          name="filter" 
          size={20} 
          color={hasActiveFilters ? colors.surface : colors.textSecondary} 
        />
      </TouchableOpacity>

      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Type de vue</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Parc, rivière, montagne..."
                value={tempFilters.viewType}
                onChangeText={(text) => setTempFilters({ ...tempFilters, viewType: text })}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Note minimum</Text>
              <View style={styles.ratingFilter}>
                {[0, 1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingOption,
                      tempFilters.minRating === rating && styles.ratingOptionActive,
                    ]}
                    onPress={() => setTempFilters({ ...tempFilters, minRating: rating })}
                  >
                    <Text style={[
                      styles.ratingText,
                      tempFilters.minRating === rating && styles.ratingTextActive,
                    ]}>
                      {rating === 0 ? 'Tous' : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Tri par</Text>
              <View style={styles.sortOptions}>
                {[
                  { key: 'recent', label: 'Récent' },
                  { key: 'rating', label: 'Note' },
                  { key: 'distance', label: 'Distance' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      tempFilters.sortBy === option.key && styles.sortOptionActive,
                    ]}
                    onPress={() => setTempFilters({ ...tempFilters, sortBy: option.key as any })}
                  >
                    <Text style={[
                      styles.sortText,
                      tempFilters.sortBy === option.key && styles.sortTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  clearButton: {
    padding: spacing.xs,
  },
  filterButton: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    ...typography.body,
  },
  ratingFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  ratingOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text,
  },
  ratingTextActive: {
    color: colors.surface,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sortOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sortOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  sortTextActive: {
    color: colors.surface,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  resetButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  resetButtonText: {
    ...typography.button,
    color: colors.text,
  },
  applyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    ...typography.button,
    color: colors.surface,
  },
});
