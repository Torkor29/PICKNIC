import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { listPlaces } from '../services/places';
import { listQuestionsWithAnswers } from '../services/qa';
import { useUser } from '../context/UserContext';
import type { Place, Question } from '../types';
import { colors, spacing, borderRadius } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface PlaceWithQuestions extends Place {
  pendingQuestions: Question[];
}

export default function MyPlacesScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useUser();
  const [myPlaces, setMyPlaces] = useState<PlaceWithQuestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMyPlaces();
  }, []);

  const loadMyPlaces = async () => {
    try {
      setLoading(true);
      const allPlaces = await listPlaces();
      const myPlacesData = allPlaces.filter(place => place.user_id === user?.id);
      
      // Charger les questions pour chaque lieu
      const placesWithQuestions = await Promise.all(
        myPlacesData.map(async (place) => {
          try {
            const questions = await listQuestionsWithAnswers(place.id);
            const pendingQuestions = questions.filter(q => q.answers.length === 0);
            return { ...place, pendingQuestions };
          } catch (error) {
            console.warn(`Erreur lors du chargement des questions pour ${place.id}:`, error);
            return { ...place, pendingQuestions: [] };
          }
        })
      );
      
      setMyPlaces(placesWithQuestions);
    } catch (error) {
      console.error('Erreur lors du chargement de vos lieux:', error);
      Alert.alert('Erreur', 'Impossible de charger vos lieux');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyPlaces();
    setRefreshing(false);
  };

  const handlePlacePress = (place: Place) => {
    navigation.navigate('PlaceDetail', { placeId: place.id, place });
  };

  const handleAnswerQuestions = (place: PlaceWithQuestions) => {
    if (place.pendingQuestions.length > 0) {
      navigation.navigate('PlaceDetail', { placeId: place.id, place });
    }
  };

  const renderPlaceItem = ({ item }: { item: PlaceWithQuestions }) => (
    <TouchableOpacity style={styles.placeCard} onPress={() => handlePlacePress(item)}>
      <View style={styles.placeHeader}>
        <View style={styles.placeInfo}>
          <Text style={styles.placeTitle}>{item.title}</Text>
          <Text style={styles.placeDescription} numberOfLines={2}>
            {item.description || 'Aucune description'}
          </Text>
          {item.view_type && (
            <View style={styles.viewTypeContainer}>
              <Ionicons name="eye" size={14} color={colors.primary} />
              <Text style={styles.viewType}>{item.view_type}</Text>
            </View>
          )}
        </View>
        <View style={styles.placeActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handlePlacePress(item)}
          >
            <Ionicons name="eye" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {item.pendingQuestions.length > 0 && (
        <TouchableOpacity 
          style={styles.questionsAlert} 
          onPress={() => handleAnswerQuestions(item)}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color={colors.warning} />
          <Text style={styles.questionsText}>
            {item.pendingQuestions.length} question{item.pendingQuestions.length > 1 ? 's' : ''} en attente de réponse
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>Aucun lieu créé</Text>
      <Text style={styles.emptyDescription}>
        Vous n'avez pas encore créé de lieux de pique-nique.{'\n'}
        Allez sur la carte pour ajouter votre premier lieu !
      </Text>
      <TouchableOpacity 
        style={styles.addFirstButton}
        onPress={() => navigation.navigate('Main' as any, { screen: 'Map' } as any)}
      >
        <Ionicons name="add" size={20} color={colors.surface} />
        <Text style={styles.addFirstButtonText}>Ajouter un lieu</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Chargement de vos lieux...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes lieux</Text>
        <Text style={styles.headerSubtitle}>
          {myPlaces.length} lieu{myPlaces.length > 1 ? 'x' : ''} créé{myPlaces.length > 1 ? 's' : ''}
        </Text>
      </View>
      
      <FlatList
        data={myPlaces}
        renderItem={renderPlaceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl + 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContainer: {
    padding: spacing.lg,
  },
  placeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  placeInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  placeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  placeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  viewTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewType: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  placeActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionsAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  questionsText: {
    flex: 1,
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addFirstButtonText: {
    color: colors.surface,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
