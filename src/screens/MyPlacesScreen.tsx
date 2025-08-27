import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Animated, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { listPlaces } from '../services/places';
import { listQuestionsWithAnswers } from '../services/qa';
import { useUser } from '../context/UserContext';
import type { Place, Question } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

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
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadMyPlaces();
    // Animation d'entrée
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
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

  const handleEditPlace = (place: Place) => {
    navigation.navigate('EditPlace', { placeId: place.id, place });
  };

  const renderPlaceItem = ({ item, index }: { item: PlaceWithQuestions; index: number }) => {
    return (
      <Animated.View style={[styles.placeCard, { transform: [{ scale: 1 }] }]}>
        <TouchableOpacity 
          style={styles.placeContent}
          onPress={() => handlePlacePress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.placeImage}>
            <Ionicons name="location" size={28} color={colors.primary} />
          </View>
          
          <View style={styles.placeInfo}>
            <Text style={styles.placeTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.placeDescription} numberOfLines={2}>
              {item.description || 'Aucune description'}
            </Text>
            {item.view_type && (
              <View style={styles.viewTypeContainer}>
                <Ionicons name="eye" size={14} color={colors.primary} />
                <Text style={styles.viewType}>{item.view_type}</Text>
              </View>
            )}
            <View style={styles.placeMeta}>
              <Text style={styles.placeDate}>
                {new Date(item.created_at || '').toLocaleDateString('fr-FR')}
              </Text>
              <View style={styles.placeFeatures}>
                {item.has_shade && <Ionicons name="umbrella" size={12} color={colors.success} />}
                {item.has_parking && <Ionicons name="car" size={12} color={colors.success} />}
                {item.has_toilets && <Ionicons name="medical" size={12} color={colors.success} />}
              </View>
            </View>
          </View>

          <View style={styles.placeActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handlePlacePress(item)}
            >
              <Ionicons name="eye" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleEditPlace(item)}
            >
              <Ionicons name="create" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        
        {item.pendingQuestions.length > 0 && (
          <TouchableOpacity 
            style={styles.questionsAlert} 
            onPress={() => handleAnswerQuestions(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses" size={16} color={colors.warning} />
            <Text style={styles.questionsText}>
              {item.pendingQuestions.length} question{item.pendingQuestions.length > 1 ? 's' : ''} en attente de réponse
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <Ionicons name="location-outline" size={80} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>Aucun lieu créé</Text>
      <Text style={styles.emptyDescription}>
        Vous n'avez pas encore créé de lieux de pique-nique.{'\n'}
        Allez sur la carte pour ajouter votre premier lieu !
      </Text>
      <TouchableOpacity 
        style={styles.addFirstButton}
        onPress={() => navigation.navigate('Main' as any, { screen: 'Map' } as any)}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={20} color={colors.surface} />
        <Text style={styles.addFirstButtonText}>Ajouter un lieu</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Mes lieux</Text>
        <Text style={styles.headerSubtitle}>
          {myPlaces.length} lieu{myPlaces.length > 1 ? 'x' : ''} créé{myPlaces.length > 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.headerStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color={colors.primary} />
          <Text style={styles.statText}>{myPlaces.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={16} color={colors.secondary} />
          <Text style={styles.statText}>Questions</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Chargement de vos lieux...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        <FlatList
          data={myPlaces}
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
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
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
  viewType: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '500',
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
    gap: spacing.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  questionsAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
    paddingVertical: spacing.xl * 2,
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
