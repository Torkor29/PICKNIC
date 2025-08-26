import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';
import { getPlaceById } from '../services/places';
import { listReviews } from '../services/reviews';
import { listQuestionsWithAnswers, addQuestion, addAnswer } from '../services/qa';
import { listPhotos, deletePhoto } from '../services/photos';
import { useUser } from '../context/UserContext';
import type { Place, Review, Question, Answer } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import Input from '../components/Input';
import Button from '../components/Button';
import RatingInput from '../components/RatingInput';
import PhotoGallery from '../components/PhotoGallery';

type PlaceDetailRouteProp = RouteProp<RootStackParamList, 'PlaceDetail'>;

export default function PlaceDetailScreen() {
  const route = useRoute<PlaceDetailRouteProp>();
  const navigation = useNavigation();
  const { user } = useUser();
  const { placeId, place: passedPlace } = route.params;

  const [place, setPlace] = useState<Place | null>(passedPlace ?? null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<(Question & { answers: Answer[] })[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const [newReview, setNewReview] = useState({ rating: 0, text: '' });
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    loadPlaceData();
  }, [placeId]);

  const loadPlaceData = async () => {
    try {
      let placeData = passedPlace ?? null;
      if (!placeData) {
        placeData = await getPlaceById(placeId);
      }
      setPlace(placeData);

      const [reviewsData, questionsData, photosData] = await Promise.all([
        listReviews(placeId),
        listQuestionsWithAnswers(placeId),
        listPhotos(placeId),
      ]);

      console.log('📋 Données du lieu chargées:', {
        place: placeData,
        reviews: reviewsData.length,
        questions: questionsData.length,
        photos: photosData.length
      });
      
      setReviews(reviewsData);
      setQuestions(questionsData);
      setPhotos(photosData);
      setIsOwner(placeData?.user_id === user?.id);
    } catch (error) {
      if (passedPlace) {
        setPlace(passedPlace);
      } else {
        console.error('Failed to load place data:', error);
        Alert.alert('Erreur', 'Impossible de charger les détails du lieu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!newReview.text.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter un commentaire');
      return;
    }

    setSubmittingReview(true);
    try {
      // placeholder: handled inside service with fallback
      // refresh reviews
      const refreshed = await listReviews(placeId);
      setReviews(refreshed);
      setNewReview({ rating: 0, text: '' });
      Alert.alert('Succès', 'Avis ajouté !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'avis');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre question');
      return;
    }

    setSubmittingQuestion(true);
    try {
      await addQuestion(placeId, newQuestion);
      const q = await listQuestionsWithAnswers(placeId);
      setQuestions(q);
      setNewQuestion('');
      Alert.alert('Succès', 'Question ajoutée !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la question');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!newAnswer.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre réponse');
      return;
    }

    setSubmittingAnswer(true);
    try {
      await addAnswer(questionId, newAnswer);
      const q = await listQuestionsWithAnswers(placeId);
      setQuestions(q);
      setNewAnswer('');
      Alert.alert('Succès', 'Réponse ajoutée !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la réponse');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingPhoto(photoId);
            try {
              const success = await deletePhoto(photoId);
              if (success) {
                // Recharger les photos
                const updatedPhotos = await listPhotos(placeId);
                setPhotos(updatedPhotos);
                Alert.alert('Succès', 'Photo supprimée !');
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer la photo');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la photo');
            } finally {
              setDeletingPhoto(null);
            }
          },
        },
      ]
    );
  };

  const handlePhotoPress = (index: number) => {
    setSelectedPhotoIndex(index);
    setGalleryVisible(true);
  };

  const renderFeature = (icon: string, label: string, value: boolean, color: string = colors.success) => (
    <View style={styles.featureItem}>
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={value ? color : colors.textSecondary} 
      />
      <Text style={[styles.featureText, { color: value ? colors.text : colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );

  if (loading && !place) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Lieu non trouvé</Text>
        </View>
      </SafeAreaView>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header avec bouton retour */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Informations principales */}
        <View style={styles.mainInfo}>
          <Text style={styles.title}>{place.title}</Text>
          {place.description && place.description.trim() && (
            <Text style={styles.description}>{place.description}</Text>
          )}
          
          <View style={styles.metaInfo}>
            {place.view_type && (
              <View style={styles.viewTypeContainer}>
                <Ionicons name="eye" size={16} color={colors.primary} />
                <Text style={styles.viewType}>{place.view_type}</Text>
              </View>
            )}
            <Text style={styles.dateInfo}>
              Ajouté le {new Date(place.created_at || '').toLocaleDateString('fr-FR')}
            </Text>
          </View>

          {reviews.length > 0 && (
            <View style={styles.ratingContainer}>
              <RatingInput rating={Math.round(averageRating)} readonly size={20} onRatingChange={() => {}} />
              <Text style={styles.ratingText}>{averageRating.toFixed(1)} ({reviews.length} avis)</Text>
            </View>
          )}
        </View>

        {/* Section Caractéristiques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caractéristiques</Text>
          <View style={styles.featuresGrid}>
            {renderFeature('heart', 'Bon pour un date', place.is_good_for_date || false, colors.primary)}
            {renderFeature('umbrella', 'Ombre disponible', place.has_shade || false)}
            {renderFeature('flower', 'Fleurs', place.has_flowers || false)}
            {renderFeature('car', 'Parking', place.has_parking || false)}
            {renderFeature('medical', 'Toilettes', place.has_toilets || false)}
            {renderFeature('volume-low', 'Calme', place.is_quiet || false)}
          </View>
        </View>

        {/* Section Photos */}
        {photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
              {photos.map((photo, index) => (
                <TouchableOpacity 
                  key={photo.id} 
                  style={styles.photoWrapper}
                  onPress={() => handlePhotoPress(index)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: photo.url }} style={styles.photo} />
                  {isOwner && (
                    <TouchableOpacity
                      style={styles.deletePhotoButton}
                      onPress={(e) => {
                        e.stopPropagation(); // Empêcher l'ouverture de la galerie
                        handleDeletePhoto(photo.id);
                      }}
                      disabled={deletingPhoto === photo.id}
                    >
                      {deletingPhoto === photo.id ? (
                        <ActivityIndicator size={16} color={colors.surface} />
                      ) : (
                        <Ionicons name="close-circle" size={20} color={colors.surface} />
                      )}
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section Avis */}
        {!isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avis</Text>
            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Votre note</Text>
              <RatingInput rating={newReview.rating} onRatingChange={(rating) => setNewReview({ ...newReview, rating })} />
              <Input 
                label="Votre avis" 
                placeholder="Partagez votre expérience..." 
                value={newReview.text} 
                onChangeText={(text) => setNewReview({ ...newReview, text })} 
                multiline 
                numberOfLines={3} 
              />
              <Button 
                title="Ajouter un avis" 
                onPress={handleSubmitReview} 
                loading={submittingReview} 
                disabled={newReview.rating === 0 || !newReview.text.trim()} 
              />
            </View>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.user_nickname}</Text>
                  <RatingInput rating={review.rating} readonly size={16} onRatingChange={() => {}} />
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
                <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Section Questions/Réponses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions & Réponses</Text>
          
          {/* Formulaire pour poser une question (seulement si ce n'est pas notre lieu) */}
          {!isOwner && (
            <View style={styles.questionForm}>
              <Text style={styles.formLabel}>Poser une question</Text>
              <Input
                placeholder="Votre question..."
                value={newQuestion}
                onChangeText={setNewQuestion}
                multiline
                numberOfLines={3}
              />
              <Button
                title="Poser la question"
                onPress={handleSubmitQuestion}
                loading={submittingQuestion}
                disabled={!newQuestion.trim()}
                size="small"
              />
            </View>
          )}

          {/* Liste des questions */}
          {questions.map((question) => (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionAuthor}>{question.user_nickname}</Text>
                <Text style={styles.questionDate}>
                  {new Date(question.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Text style={styles.questionText}>{question.text}</Text>
              
              {/* Réponses */}
              {question.answers.map((answer: Answer) => (
                <View key={answer.id} style={styles.answerCard}>
                  <View style={styles.answerHeader}>
                    <Text style={styles.answerAuthor}>{answer.user_nickname}</Text>
                    <Text style={styles.answerDate}>
                      {new Date(answer.created_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Text style={styles.answerText}>{answer.text}</Text>
                </View>
              ))}
              
              {/* Formulaire de réponse (pour les propriétaires ou si pas de réponses) */}
              {(isOwner || question.answers.length === 0) && (
                <View style={styles.answerForm}>
                  <Input
                    placeholder="Votre réponse..."
                    value={newAnswer}
                    onChangeText={setNewAnswer}
                    multiline
                    numberOfLines={2}
                  />
                  <Button
                    title="Répondre"
                    onPress={() => handleSubmitAnswer(question.id)}
                    loading={submittingAnswer}
                    disabled={!newAnswer.trim()}
                    size="small"
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Galerie d'images */}
      <PhotoGallery
        photos={photos}
        visible={galleryVisible}
        onClose={() => setGalleryVisible(false)}
        initialIndex={selectedPhotoIndex}
      />
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
    backgroundColor: colors.background 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  centered: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  errorText: { 
    ...typography.h2, 
    color: colors.error 
  },
  mainInfo: { 
    backgroundColor: colors.surface, 
    padding: spacing.lg, 
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { 
    ...typography.h1, 
    color: colors.text, 
    marginBottom: spacing.sm 
  },
  description: { 
    ...typography.body, 
    color: colors.textSecondary, 
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewTypeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  viewType: { 
    ...typography.caption, 
    color: colors.primary, 
    marginLeft: spacing.xs, 
    fontWeight: '600' 
  },
  dateInfo: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ratingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  ratingText: { 
    ...typography.caption, 
    color: colors.textSecondary, 
    marginLeft: spacing.sm 
  },
  section: { 
    backgroundColor: colors.surface, 
    marginBottom: spacing.md, 
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: { 
    ...typography.h2, 
    color: colors.text, 
    marginBottom: spacing.lg 
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: '45%',
  },
  featureText: {
    ...typography.caption,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  formContainer: { 
    marginBottom: spacing.lg 
  },
  formLabel: { 
    ...typography.caption, 
    color: colors.text, 
    fontWeight: '600', 
    marginBottom: spacing.sm 
  },
  reviewCard: { 
    backgroundColor: colors.background, 
    borderRadius: borderRadius.md, 
    padding: spacing.md, 
    marginBottom: spacing.sm 
  },
  reviewHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.sm 
  },
  reviewAuthor: { 
    ...typography.caption, 
    color: colors.primary, 
    fontWeight: '600' 
  },
  reviewText: { 
    ...typography.body, 
    color: colors.text, 
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  reviewDate: { 
    ...typography.caption, 
    color: colors.textSecondary 
  },
  questionCard: { 
    backgroundColor: colors.background, 
    borderRadius: borderRadius.md, 
    padding: spacing.md, 
    marginBottom: spacing.md 
  },
  questionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.sm 
  },
  questionAuthor: { 
    ...typography.caption, 
    color: colors.primary, 
    fontWeight: '600' 
  },
  questionDate: { 
    ...typography.caption, 
    color: colors.textSecondary 
  },
  questionText: { 
    ...typography.body, 
    color: colors.text, 
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  answerCard: { 
    backgroundColor: colors.surface, 
    borderRadius: borderRadius.sm, 
    padding: spacing.sm, 
    marginBottom: spacing.sm, 
    marginLeft: spacing.md 
  },
  answerHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.xs 
  },
  answerAuthor: { 
    ...typography.caption, 
    color: colors.secondary, 
    fontWeight: '600' 
  },
  answerDate: { 
    ...typography.caption, 
    color: colors.textSecondary 
  },
  answerText: { 
    ...typography.body, 
    color: colors.text,
    lineHeight: 18,
  },
  answerForm: { 
    marginTop: spacing.sm 
  },
  questionForm: { 
    marginBottom: spacing.lg 
  },
  photosContainer: { 
    marginTop: spacing.sm 
  },
  photo: { 
    width: 120, 
    height: 80, 
    borderRadius: borderRadius.md, 
    marginRight: spacing.sm 
  },
  photoWrapper: { 
    position: 'relative', 
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  deletePhotoButton: { 
    position: 'absolute', 
    top: -8, 
    right: -8, 
    backgroundColor: colors.error, 
    borderRadius: 12, 
    padding: 2 
  },
});


