import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  Switch,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform,
  Animated,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, borderRadius, typography } from '../theme';
import { listPlaces, createPlace } from '../services/places';
import { uploadPhoto } from '../services/photos';
import { useUser } from '../context/UserContext';
import * as ImagePicker from 'expo-image-picker';
import type { Place } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

type RootStackParamList = {
  Map: undefined;
  PlaceDetail: { placeId: string };
  EditPlace: { placeId: string };
};

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface FilterState {
  isGoodForDate: boolean | null;
  hasShade: boolean | null;
  hasFlowers: boolean | null;
  hasView: boolean | null;
  hasParking: boolean | null;
  hasToilets: boolean | null;
  isQuiet: boolean | null;
  maxDistance: number;
}

export default function MapScreen() {
  const navigation = useNavigation<Navigation>();
  const mapRef = useRef<MapView>(null);
  const filterAnim = useRef(new Animated.Value(0)).current;
  const chipsRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const appState = useRef(AppState.currentState);
  const [mapKey, setMapKey] = useState(0);
  const mapReadyRef = useRef(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  
  // États pour l'ajout de lieu
  const [newPlaceTitle, setNewPlaceTitle] = useState('');
  const [newPlaceDescription, setNewPlaceDescription] = useState('');
  const [newPlaceViewType, setNewPlaceViewType] = useState('');
  const [isGoodForDate, setIsGoodForDate] = useState(false);
  const [hasShade, setHasShade] = useState(false);
  const [hasFlowers, setHasFlowers] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasToilets, setHasToilets] = useState(false);
  const [isQuiet, setIsQuiet] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [addingPlace, setAddingPlace] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ address: string; latitude: number; longitude: number }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // États pour les filtres
  const [filters, setFilters] = useState<FilterState>({
    isGoodForDate: null,
    hasShade: null,
    hasFlowers: null,
    hasView: null,
    hasParking: null,
    hasToilets: null,
    isQuiet: null,
    maxDistance: 5,
  });

  // Log de l'état des filtres à chaque changement
  useEffect(() => {
    console.log('🔄 État des filtres mis à jour:', filters);
    
    // Protection contre les états invalides
    const hasInvalidState = Object.values(filters).some(value => 
      value !== null && value !== true && value !== false && typeof value !== 'number'
    );
    
    if (hasInvalidState) {
      console.error('❌ État invalide détecté dans les filtres, réinitialisation...');
      setFilters({
        isGoodForDate: null,
        hasShade: null,
        hasFlowers: null,
        hasView: null,
        hasParking: null,
        hasToilets: null,
        isQuiet: null,
        maxDistance: 5,
      });
    }
  }, [filters]);

  // Fonction helper pour basculer les filtres de manière sécurisée
  const toggleFilter = useCallback((filterKey: keyof FilterState) => {
    try {
      console.log(`🖱️ Clic sur ${filterKey}, état actuel:`, filters[filterKey]);
      
      // Protection contre les états invalides
      const currentValue = filters[filterKey];
      let newValue: boolean | null;
      
      // Logique simple : true → null → true
      if (currentValue === true) {
        newValue = null;
      } else {
        newValue = true;
      }
      
      console.log(`🔄 ${filterKey}: ${currentValue} → ${newValue}`);
      
      setFilters(prev => ({
        ...prev,
        [filterKey]: newValue
      }));
      
    } catch (error) {
      console.error(`❌ Erreur lors du clic sur ${filterKey}:`, error);
      // En cas d'erreur, réinitialiser le filtre
      setFilters(prev => ({
        ...prev,
        [filterKey]: null
      }));
    }
  }, [filters]);

  useEffect(() => {
    requestLocationPermission();
    loadPlaces();
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        // Force un remount du composant MapView pour résoudre les écrans noirs/blancs après retour app
        setMapKey((k) => k + 1);
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // Gérer le centrage sur un lieu depuis la liste
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState().routes.find(route => route.name === 'Map')?.params as any;
      if (params?.centerOnPlace) {
        const { latitude, longitude, placeId } = params.centerOnPlace;
        
        // Centrer la carte sur le lieu
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
        
        // Nettoyer les paramètres
        navigation.setParams({ centerOnPlace: undefined });
      }
    });

    return unsubscribe;
  }, [navigation]);

  const toggleFilters = () => {};
  const focusFilters = () => {
    try {
      chipsRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    } catch (e) {}
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        const region: Region = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setMapRegion(region);
        
        if (mapRef.current && mapReadyRef.current) {
          try {
            // Essaye une caméra précise
            await (mapRef.current as any).animateCamera?.({ center: { latitude: region.latitude, longitude: region.longitude }, zoom: 12 }, { duration: 500 });
          } catch {}
          mapRef.current.animateToRegion(region, 500);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadPlaces = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des lieux...');
      const placesData = await listPlaces();
      console.log('📊 Lieux chargés:', placesData.length, 'lieux');
      console.log('🔍 Premier lieu:', placesData[0]);
      setPlaces(placesData);
    } catch (error) {
      console.error('Error loading places:', error);
      Alert.alert('Erreur', 'Impossible de charger les lieux');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      try {
        // Géocodage de l'adresse recherchée
        const geocodeResult = await Location.geocodeAsync(searchQuery.trim());
        
        if (geocodeResult.length > 0) {
          const location = geocodeResult[0];
          setSearchLocation({ latitude: location.latitude, longitude: location.longitude });
          
          // Déplacer la carte vers la localisation trouvée
          const newRegion: Region = {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setMapRegion(newRegion);
          if (mapRef.current) {
            try {
              await (mapRef.current as any).animateCamera?.({ center: { latitude: newRegion.latitude, longitude: newRegion.longitude }, zoom: 12 }, { duration: 600 });
            } catch {}
            mapRef.current.animateToRegion(newRegion, 600);
          }
          
          // Filtrage des lieux autour de cette localisation
          const filtered = places.filter(place => {
            const distance = calculateDistance(
              location.latitude,
              location.longitude,
              place.latitude,
              place.longitude
            );
            
            // Si pas de limite de distance, afficher tous les lieux
            if (filters.maxDistance === -1) return true;
            
            return distance <= filters.maxDistance;
          });
          
          setSearchResults(filtered);
        } else {
          // Si pas de géocodage, recherche textuelle simple
          const filtered = places.filter(place => 
            place.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            place.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            place.view_type?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Erreur de géocodage:', error);
        // Fallback vers la recherche textuelle
        const filtered = places.filter(place => 
          place.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.view_type?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
      }
      setIsSearching(false);
    }
  };

  const searchAddressSuggestions = async (query: string) => {
    try {
      const geocodeResult = await Location.geocodeAsync(query);
      const suggestions = geocodeResult.slice(0, 5).map(result => ({
        address: query, // Pour l'instant on utilise la requête, on pourrait améliorer avec reverse geocoding
        latitude: result.latitude,
        longitude: result.longitude
      }));
      
      setAddressSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Erreur lors de la recherche de suggestions:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectAddressSuggestion = (suggestion: { address: string; latitude: number; longitude: number }) => {
    setSearchQuery(suggestion.address);
    setSearchLocation({ latitude: suggestion.latitude, longitude: suggestion.longitude });
    setShowSuggestions(false);
    setAddressSuggestions([]);
    
    // Déplacer la carte vers la localisation sélectionnée
    const newRegion: Region = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setMapRegion(newRegion);
    if (mapRef.current) {
      try {
        (mapRef.current as any).animateCamera?.({ center: { latitude: newRegion.latitude, longitude: newRegion.longitude }, zoom: 12 }, { duration: 600 });
      } catch {}
      mapRef.current.animateToRegion(newRegion, 600);
    }
    
    // Filtrer les lieux autour de cette localisation
    const filtered = places.filter(place => {
      const distance = calculateDistance(
        suggestion.latitude,
        suggestion.longitude,
        place.latitude,
        place.longitude
      );
      
      if (filters.maxDistance === -1) return true;
      return distance <= filters.maxDistance;
    });
    
    setSearchResults(filtered);
  };

  const clearSearch = async () => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
    setSearchLocation(null);
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

    const getFilteredPlaces = useMemo((): Place[] => {
    // Si on a des résultats de recherche, on les utilise
    const placesToFilter = searchResults.length > 0 ? searchResults : places;
    
    // Si pas de localisation de référence, retourner tous les lieux
    const referenceLocation = searchLocation || userLocation;
    if (!referenceLocation) return placesToFilter;

    try {
      console.log(`🔍 Filtrage: ${placesToFilter.length} lieux, filtres actifs:`, filters);
      
      const filtered = placesToFilter.filter(place => {
        try {
          // Vérification de la distance (sauf si pas de limite)
          if (filters.maxDistance !== -1) {
            let refLat, refLng;
            
            if ('coords' in referenceLocation) {
              // C'est un LocationObject (userLocation)
              refLat = referenceLocation.coords.latitude;
              refLng = referenceLocation.coords.longitude;
            } else {
              // C'est un objet simple (searchLocation)
              refLat = referenceLocation.latitude;
              refLng = referenceLocation.longitude;
            }
            
            const distance = calculateDistance(
              refLat,
              refLng,
              place.latitude,
              place.longitude
            );
            
            if (distance > filters.maxDistance) {
              return false;
            }
          }

          // Filtres booléens simplifiés
          if (filters.isGoodForDate === true && !Boolean(place.is_good_for_date)) return false;
          if (filters.hasShade === true && !Boolean((place as any).has_shade)) return false;
          if (filters.hasFlowers === true && !Boolean((place as any).has_flowers)) return false;
          if (filters.hasView === true && !Boolean(place.view_type && place.view_type.trim() !== '')) return false;
          if (filters.hasParking === true && !Boolean((place as any).has_parking)) return false;
          if (filters.hasToilets === true && !Boolean((place as any).has_toilets)) return false;
          if (filters.isQuiet === true && !Boolean((place as any).is_quiet)) return false;

          return true;
        } catch (error) {
          console.error(`❌ Erreur lors du filtrage de ${place.title}:`, error);
          return true; // Garder le lieu en cas d'erreur
        }
      });
      
      console.log(`✅ Filtrage terminé: ${filtered.length}/${places.length} lieux conservés`);
      return filtered;
    } catch (error) {
      console.error('❌ Erreur dans le filtrage:', error);
      return places; // Retourner tous les lieux en cas d'erreur
    }
  }, [places, userLocation, filters]);

  // Fonction sécurisée pour basculer les filtres
  const safeToggleFilter = useCallback((filterKey: keyof FilterState, value?: boolean | number) => {
    console.log(`🔄 Toggle filtre: ${filterKey}, valeur: ${value}`);
    
    try {
      setFilters(prev => {
        const currentValue = prev[filterKey];
        let newValue: boolean | null | number;
        
        if (value !== undefined) {
          newValue = value;
        } else {
          // Toggle: true -> null -> true (pour les booléens)
          if (typeof currentValue === 'boolean') {
            newValue = currentValue === true ? null : true;
          } else {
            newValue = currentValue;
          }
        }
        
        console.log(`✅ Filtre ${filterKey}: ${currentValue} → ${newValue}`);
        
        return {
          ...prev,
          [filterKey]: newValue
        };
      });
    } catch (error) {
      console.error('❌ Erreur lors du toggle du filtre:', error);
    }
  }, []);

  const handleMapPress = (event: any) => {
    setSelectedLocation(event.nativeEvent.coordinate);
  };

  const handleAddPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setSelectedPhotos([...selectedPhotos, ...newPhotos]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter des photos');
    }
  };

  const handleSubmitPlace = async () => {
    if (!selectedLocation || !newPlaceTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le titre et sélectionner un emplacement');
      return;
    }

    setAddingPlace(true);
    try {
      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté pour ajouter un lieu');
        return;
      }
      
      const newPlace = await createPlace({
        title: newPlaceTitle.trim(),
        description: newPlaceDescription.trim(),
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        view_type: newPlaceViewType.trim() || null,
        is_good_for_date: isGoodForDate,
        has_shade: hasShade,
        has_flowers: hasFlowers,
        has_parking: hasParking,
        has_toilets: hasToilets,
        is_quiet: isQuiet,
        user_id: user.id,
      } as any);

      for (const photoUri of selectedPhotos) {
        await uploadPhoto(newPlace.id, photoUri);
      }

      setNewPlaceTitle('');
      setNewPlaceDescription('');
      setNewPlaceViewType('');
      setIsGoodForDate(false);
      setHasShade(false);
      setHasFlowers(false);
      setHasParking(false);
      setHasToilets(false);
      setIsQuiet(false);
      setSelectedPhotos([]);
      setShowAddModal(false);
      setSelectedLocation(null);

      await loadPlaces();
      Alert.alert('Succès', 'Lieu ajouté avec succès !');
    } catch (error) {
      console.error('Error adding place:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le lieu');
    } finally {
      setAddingPlace(false);
    }
  };

  const handleMarkerPress = (place: Place) => {
    navigation.navigate('PlaceDetail', { placeId: place.id });
  };

  const filteredPlaces = getFilteredPlaces;
  const activeFiltersCount = useMemo(() => {
    try {
      const keys: (keyof FilterState)[] = ['isGoodForDate','hasShade','hasFlowers','hasView','hasParking','hasToilets','isQuiet'];
      const base = keys.reduce((acc, key) => acc + (filters[key] !== null ? 1 : 0), 0);
      const count = base + (filters.maxDistance !== 5 ? 1 : 0);
      console.log(`🎯 Filtres actifs: ${count}`, filters);
      return count;
    } catch {
      return 0;
    }
  }, [filters]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Carte en plein écran */}
      <View style={styles.mapContainer}>
        <MapView
          key={mapKey}
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          showsScale
          showsBuildings
          showsPointsOfInterest
          showsTraffic
          showsIndoors
          loadingEnabled
          loadingIndicatorColor="#4ecdc4"
          loadingBackgroundColor="#ffffff"
          onPress={handleMapPress}
          region={mapRegion ?? {
            latitude: userLocation?.coords.latitude || 48.8566,
            longitude: userLocation?.coords.longitude || 2.3522,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
          onMapReady={() => { mapReadyRef.current = true; }}
          customMapStyle={[
            {
              "elementType": "geometry",
              "stylers": [{"color": "#f5f5f5"}]
            },
            {
              "elementType": "labels.icon",
              "stylers": [{"visibility": "off"}]
            },
            {
              "elementType": "labels.text.fill",
              "stylers": [{"color": "#1a1a2e"}]
            },
            {
              "elementType": "labels.text.stroke",
              "stylers": [{"color": "#ffffff"}]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#4ecdc4"}]
            },
            {
              "featureType": "administrative.land_parcel",
              "elementType": "labels.text.fill",
              "stylers": [{"color": "#45b7d1"}]
            },
            {
              "featureType": "poi.park",
              "elementType": "geometry",
              "stylers": [{"color": "#96ceb4"}]
            },
            {
              "featureType": "poi.park",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#2e7d32"}]
            },
            {
              "featureType": "poi.park",
              "elementType": "labels.text.fill",
              "stylers": [{"color": "#1b5e20"}]
            },
            {
              "featureType": "road",
              "elementType": "geometry",
              "stylers": [{"color": "#ffffff"}]
            },
            {
              "featureType": "road",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#ff6b6b"}]
            },
            {
              "featureType": "road",
              "elementType": "labels.text.fill",
              "stylers": [{"color": "#1a1a2e"}]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry",
              "stylers": [{"color": "#f39c12"}]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#e67e22"}]
            },
            {
              "featureType": "road.highway",
              "elementType": "labels.text.fill",
              "stylers": [{"color": "#ffffff"}]
            },
            {
              "featureType": "transit",
              "elementType": "geometry",
              "stylers": [{"color": "#3498db"}]
            },
            {
              "featureType": "transit.station",
              "elementType": "geometry",
              "stylers": [{"color": "#2980b9"}]
            },
            {
              "featureType": "water",
              "elementType": "geometry",
              "stylers": [{"color": "#74b9ff"}]
            },
            {
              "featureType": "water",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#0984e3"}]
            },
            {
              "featureType": "water",
              "elementType": "labels.text.fill",
              "stylers": [{"color": "#ffffff"}]
            },
            {
              "featureType": "landscape.natural",
              "elementType": "geometry",
              "stylers": [{"color": "#a8e6cf"}]
            },
            {
              "featureType": "landscape.natural.terrain",
              "elementType": "geometry",
              "stylers": [{"color": "#81c784"}]
            },
            {
              "featureType": "poi.business",
              "elementType": "geometry",
              "stylers": [{"color": "#f8f9fa"}]
            },
            {
              "featureType": "poi.business",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#e9ecef"}]
            },
            {
              "featureType": "poi.school",
              "elementType": "geometry",
              "stylers": [{"color": "#f8f9fa"}]
            },
            {
              "featureType": "poi.school",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#e9ecef"}]
            },
            {
              "featureType": "poi.medical",
              "elementType": "geometry",
              "stylers": [{"color": "#f8f9fa"}]
            },
            {
              "featureType": "poi.medical",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#e9ecef"}]
            },
            {
              "featureType": "poi",
              "elementType": "geometry",
              "stylers": [{"color": "#f8f9fa"}]
            },
            {
              "featureType": "poi",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#e9ecef"}]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry",
              "stylers": [{"color": "#f8f9fa"}]
            },
            {
              "featureType": "administrative.locality",
              "elementType": "geometry",
              "stylers": [{"color": "#f8f9fa"}]
            },
            {
              "featureType": "administrative.neighborhood",
              "elementType": "geometry",
              "stylers": [{"color": "#f8f9fa"}]
            }
          ]}
        >
          {selectedLocation && (
            <Marker coordinate={selectedLocation}>
              <View style={styles.selectedPin}>
                <View style={styles.selectedPinDot} />
                <View style={styles.selectedPinRing} />
              </View>
            </Marker>
          )}
          {filteredPlaces.map((place) => (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              onPress={() => handleMarkerPress(place)}
              tracksViewChanges={false}
            >
              <View style={styles.markerContainer}>
                <View style={[
                  styles.marker,
                  place.is_good_for_date && styles.markerDate
                ]}>
                  <Ionicons 
                    name="restaurant" 
                    size={14} 
                    color={place.is_good_for_date ? "#fff" : "#1a1a2e"} 
                  />
                </View>
                {place.is_good_for_date && (
                  <View style={styles.dateBadge}>
                    <Ionicons name="heart" size={8} color="#ff6b6b" />
                  </View>
                )}
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Header adaptatif pour tous les appareils */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        {/* Barre de recherche élégante avec distance intégrée */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color="#6b7280" />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une ville ou un lieu..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.length > 2) {
                  searchAddressSuggestions(text);
                } else {
                  setAddressSuggestions([]);
                  setShowSuggestions(false);
                }
              }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              onFocus={() => {
                if (addressSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
            
            {/* Indicateur de distance intégré */}
            {userLocation && (
              <TouchableOpacity 
                style={styles.distanceButton}
                onPress={() => {
                  Alert.alert(
                    'Distance maximale',
                    `Distance actuelle : ${filters.maxDistance === -1 ? 'Pas de limite' : filters.maxDistance + ' km'}`,
                    [
                      { text: '1 km', onPress: () => setFilters(prev => ({ ...prev, maxDistance: 1 })) },
                      { text: '3 km', onPress: () => setFilters(prev => ({ ...prev, maxDistance: 3 })) },
                      { text: '5 km', onPress: () => setFilters(prev => ({ ...prev, maxDistance: 5 })) },
                      { text: '10 km', onPress: () => setFilters(prev => ({ ...prev, maxDistance: 10 })) },
                      { text: '20 km', onPress: () => setFilters(prev => ({ ...prev, maxDistance: 20 })) },
                      { text: 'Pas de limite', onPress: () => setFilters(prev => ({ ...prev, maxDistance: -1 })) },
                      { text: 'Annuler', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Ionicons name="navigate" size={16} color="#45b7d1" />
                <Text style={styles.distanceButtonText}>
                  {filters.maxDistance === -1 ? '∞' : `${filters.maxDistance}km`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Suggestions d'adresses */}
          {showSuggestions && addressSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {addressSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => selectAddressSuggestion(suggestion)}
                >
                  <Ionicons name="location" size={16} color="#4ecdc4" />
                  <Text style={styles.suggestionText}>{suggestion.address}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Section filtres (inchangée) */}
        <View style={styles.filtersSection}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>
              Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
            ref={chipsRef}
          >
            <TouchableOpacity
              style={[
                styles.miniFilterChip, 
                filters.isGoodForDate === true && { backgroundColor: '#ff6b6b', borderColor: '#ff6b6b', shadowColor: '#ff6b6b' }
              ]}
              onPress={() => toggleFilter('isGoodForDate')}
            >
              <Ionicons name="heart" size={14} color={filters.isGoodForDate === true ? '#fff' : '#ff6b6b'} />
              <Text style={[styles.miniFilterChipText, filters.isGoodForDate === true && styles.miniFilterChipTextActive]}>Date</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.miniFilterChip, 
                filters.hasShade === true && { backgroundColor: '#4ecdc4', borderColor: '#4ecdc4', shadowColor: '#4ecdc4' }
              ]}
              onPress={() => toggleFilter('hasShade')}
            >
              <Ionicons name="umbrella" size={14} color={filters.hasShade === true ? '#fff' : '#4ecdc4'} />
              <Text style={[styles.miniFilterChipText, filters.hasShade === true && styles.miniFilterChipTextActive]}>Ombre</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.miniFilterChip, 
                filters.hasFlowers === true && { backgroundColor: '#45b7d1', borderColor: '#45b7d1', shadowColor: '#45b7d1' }
              ]}
              onPress={() => toggleFilter('hasFlowers')}
            >
              <Ionicons name="flower" size={14} color={filters.hasFlowers === true ? '#fff' : '#45b7d1'} />
              <Text style={[styles.miniFilterChipText, filters.hasFlowers === true && styles.miniFilterChipTextActive]}>Fleurs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.miniFilterChip, 
                filters.hasView === true && { backgroundColor: '#96ceb4', borderColor: '#96ceb4', shadowColor: '#96ceb4' }
              ]}
              onPress={() => toggleFilter('hasView')}
            >
              <Ionicons name="eye" size={14} color={filters.hasView === true ? '#fff' : '#96ceb4'} />
              <Text style={[styles.miniFilterChipText, filters.hasView === true && styles.miniFilterChipTextActive]}>Vue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.miniFilterChip, 
                filters.hasParking === true && { backgroundColor: '#f39c12', borderColor: '#f39c12', shadowColor: '#f39c12' }
              ]}
              onPress={() => toggleFilter('hasParking')}
            >
              <Ionicons name="car" size={14} color={filters.hasParking === true ? '#fff' : '#f39c12'} />
              <Text style={[styles.miniFilterChipText, filters.hasParking === true && styles.miniFilterChipTextActive]}>Parking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.miniFilterChip, 
                filters.hasToilets === true && { backgroundColor: '#3498db', borderColor: '#3498db', shadowColor: '#3498db' }
              ]}
              onPress={() => toggleFilter('hasToilets')}
            >
              <Ionicons name="water" size={14} color={filters.hasToilets === true ? '#fff' : '#3498db'} />
              <Text style={[styles.miniFilterChipText, filters.hasToilets === true && styles.miniFilterChipTextActive]}>WC</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.miniFilterChip, 
                filters.isQuiet === true && { backgroundColor: '#9b59b6', borderColor: '#9b59b6', shadowColor: '#9b59b6' }
              ]}
              onPress={() => toggleFilter('isQuiet')}
            >
              <Ionicons name="volume-low" size={14} color={filters.isQuiet === true ? '#fff' : '#9b59b6'} />
              <Text style={[styles.miniFilterChipText, filters.isQuiet === true && styles.miniFilterChipTextActive]}>Calme</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.miniFilterChip}
              onPress={() => {
                Alert.alert(
                  'Distance maximale',
                  `Distance actuelle : ${filters.maxDistance} km`,
                  [
                    { text: '1 km', onPress: () => {
                      console.log('🖱️ Changement distance: 1km');
                      setFilters(prev => ({ ...prev, maxDistance: 1 }));
                    }},
                    { text: '3 km', onPress: () => {
                      console.log('🖱️ Changement distance: 3km');
                      setFilters(prev => ({ ...prev, maxDistance: 3 }));
                    }},
                    { text: '5 km', onPress: () => {
                      console.log('🖱️ Changement distance: 5km');
                      setFilters(prev => ({ ...prev, maxDistance: 5 }));
                    }},
                    { text: '10 km', onPress: () => {
                      console.log('🖱️ Changement distance: 10km');
                      setFilters(prev => ({ ...prev, maxDistance: 10 }));
                    }},
                    { text: 'Annuler', style: 'cancel' }
                  ]
                );
              }}
            >
              <Ionicons name="navigate" size={14} color="#1a1a2e" />
              <Text style={styles.miniFilterChipText}>{filters.maxDistance}km</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>


      {/* Bouton d'ajout flottant */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <View style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="white" />
        </View>
      </TouchableOpacity>

      {/* Tutoriel au démarrage */}
      {showTutorial && (
        <View style={styles.tutorialOverlay}>
          <View style={styles.tutorialCard}>
            <View style={styles.tutorialHeader}>
              <Ionicons name="bulb" size={24} color="#ff6b6b" />
              <Text style={styles.tutorialTitle}>Bienvenue sur Picnic ! 🎉</Text>
            </View>
            <Text style={styles.tutorialText}>
              Appuyez sur le bouton rouge en bas à droite pour ajouter votre premier lieu de pique-nique !
            </Text>
            <TouchableOpacity
              style={styles.tutorialButton}
              onPress={() => setShowTutorial(false)}
            >
              <Text style={styles.tutorialButtonText}>Compris !</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal d'ajout de lieu */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowAddModal(false);
                setSelectedLocation(null);
              }}
            >
              <Ionicons name="close" size={24} color="#1a1a2e" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>✨ Nouveau lieu</Text>
            <TouchableOpacity
              style={[styles.submitButton, !newPlaceTitle.trim() && styles.submitButtonDisabled]}
              onPress={handleSubmitPlace}
              disabled={!newPlaceTitle.trim() || addingPlace}
            >
              <Text style={styles.submitButtonText}>
                {addingPlace ? '⏳ Ajout...' : '✅ Ajouter'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom du lieu *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Parc de la Tête d'Or"
                value={newPlaceTitle}
                onChangeText={setNewPlaceTitle}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez ce lieu..."
                value={newPlaceDescription}
                onChangeText={setNewPlaceDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type de vue</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Vue sur la mer, Montagne..."
                value={newPlaceViewType}
                onChangeText={setNewPlaceViewType}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.optionsContainer}>
              <Text style={styles.optionsTitle}>Caractéristiques</Text>
              
              <View style={styles.optionRow}>
                <View style={styles.optionInfo}>
                  <Ionicons name="heart" size={20} color="#ff6b6b" />
                  <Text style={styles.optionLabel}>Bon pour un date</Text>
                </View>
                <Switch
                  value={isGoodForDate}
                  onValueChange={setIsGoodForDate}
                  trackColor={{ false: "#e0e0e0", true: "#ff6b6b" }}
                  thumbColor={isGoodForDate ? 'white' : '#f4f3f4'}
                />
              </View>

              <View style={styles.optionRow}>
                <View style={styles.optionInfo}>
                  <Ionicons name="umbrella" size={20} color="#4ecdc4" />
                  <Text style={styles.optionLabel}>Ombragé</Text>
                </View>
                <Switch
                  value={hasShade}
                  onValueChange={setHasShade}
                  trackColor={{ false: "#e0e0e0", true: "#4ecdc4" }}
                  thumbColor={hasShade ? 'white' : '#f4f3f4'}
                />
              </View>

              <View style={styles.optionRow}>
                <View style={styles.optionInfo}>
                  <Ionicons name="flower" size={20} color="#45b7d1" />
                  <Text style={styles.optionLabel}>Fleurs</Text>
                </View>
                <Switch
                  value={hasFlowers}
                  onValueChange={setHasFlowers}
                  trackColor={{ false: "#e0e0e0", true: "#45b7d1" }}
                  thumbColor={hasFlowers ? 'white' : '#f4f3f4'}
                />
              </View>

              <View style={styles.optionRow}>
                <View style={styles.optionInfo}>
                  <Ionicons name="car" size={20} color="#f39c12" />
                  <Text style={styles.optionLabel}>Parking à proximité</Text>
                </View>
                <Switch
                  value={hasParking}
                  onValueChange={setHasParking}
                  trackColor={{ false: "#e0e0e0", true: "#f39c12" }}
                  thumbColor={hasParking ? 'white' : '#f4f3f4'}
                />
              </View>

              <View style={styles.optionRow}>
                <View style={styles.optionInfo}>
                  <Ionicons name="water" size={20} color="#3498db" />
                  <Text style={styles.optionLabel}>Toilettes publiques</Text>
                </View>
                <Switch
                  value={hasToilets}
                  onValueChange={setHasToilets}
                  trackColor={{ false: "#e0e0e0", true: "#3498db" }}
                  thumbColor={hasToilets ? 'white' : '#f4f3f4'}
                />
              </View>

              <View style={styles.optionRow}>
                <View style={styles.optionInfo}>
                  <Ionicons name="volume-low" size={20} color="#9b59b6" />
                  <Text style={styles.optionLabel}>Endroit calme</Text>
                </View>
                <Switch
                  value={isQuiet}
                  onValueChange={setIsQuiet}
                  trackColor={{ false: "#e0e0e0", true: "#9b59b6" }}
                  thumbColor={isQuiet ? 'white' : '#f4f3f4'}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleAddPhoto}
            >
              <Ionicons name="camera" size={20} color="#1a1a2e" />
              <Text style={styles.photoButtonText}>
                {selectedPhotos.length > 0 
                  ? `📸 ${selectedPhotos.length} photo(s) sélectionnée(s)`
                  : '📸 Ajouter des photos'
                }
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statsScrollContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f3f4',
    minWidth: 140,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  statTextContainer: {
    flex: 1,
  },
  filtersSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filtersRow: {
    paddingVertical: spacing.sm,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  searchIconContainer: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a2e',
    paddingVertical: spacing.xs,
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  distanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 50,
    justifyContent: 'center',
  },
  distanceButtonText: {
    fontSize: 12,
    color: '#45b7d1',
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f3f4',
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a2e',
    marginLeft: spacing.sm,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#1a1a2e',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  filtersPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
    paddingTop: isIOS ? 48 : (StatusBar.currentHeight || 0) + 12,
    maxHeight: 160,
  },
  filtersScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 80,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#1a1a2e',
    borderColor: '#1a1a2e',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginLeft: spacing.sm,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  selectedPin: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  selectedPinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ecdc4',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedPinRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderWidth: 2,
    borderColor: '#4ecdc4',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl + 20,
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    flex: 1,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#4ecdc4',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#e9ecef',
    fontSize: 16,
    color: '#1a1a2e',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: '#f8f9fa',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionLabel: {
    fontSize: 16,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    marginLeft: spacing.md,
    fontSize: 16,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  markerContainer: {
    position: 'relative',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  markerDate: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  dateBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 9,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  tutorialOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  tutorialCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    margin: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 300,
  },
  tutorialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tutorialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  tutorialText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  tutorialButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  tutorialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactChipsOverlay: {
    position: 'absolute',
    top: isIOS ? 92 : (StatusBar.currentHeight || 0) + 68,
    left: 0,
    right: 0,
    zIndex: 9,
  },
  compactChipsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filtersHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  filtersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: borderRadius.lg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  miniFilterChipActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  miniFilterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6c757d',
    marginLeft: 6,
  },
  miniFilterChipTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
});


