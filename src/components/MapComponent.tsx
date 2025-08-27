import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    isGoodForDate?: boolean;
  }>;
  onMarkerPress?: (markerId: string) => void;
  onMapPress?: (latitude: number, longitude: number) => void;
  style?: any;
}

export default function MapComponent({
  latitude,
  longitude,
  zoom = 13,
  markers = [],
  onMarkerPress,
  onMapPress,
  style
}: MapComponentProps) {
  const webViewRef = useRef<WebView>(null);

  const generateMapHTML = () => {
    const markersData = markers.map(marker => ({
      id: marker.id,
      lat: marker.latitude,
      lng: marker.longitude,
      title: marker.title,
      isGoodForDate: marker.isGoodForDate
    }));

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              margin: 0; 
              padding: 0; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: #f8f9fa;
              overflow: hidden;
            }
            
            #map { 
              width: 100%; 
              height: 100vh; 
              position: relative;
            }
            
            .leaflet-container {
              background: #f8f9fa;
            }
            
            /* Style carte pastel personnalisé */
            .leaflet-tile-pane {
              filter: saturate(0.8) contrast(0.9) brightness(1.1);
            }
            
            /* Personnalisation des couleurs de la carte */
            .leaflet-overlay-pane svg path[stroke="#666"],
            .leaflet-overlay-pane svg path[stroke="#333"],
            .leaflet-overlay-pane svg path[stroke="#000"] {
              stroke: #e8e8e8 !important;
              stroke-width: 2px !important;
            }
            
            .leaflet-overlay-pane svg path[fill="#666"],
            .leaflet-overlay-pane svg path[fill="#333"],
            .leaflet-overlay-pane svg path[fill="#000"] {
              fill: #ffffff !important;
            }
            
            /* Parcs en vert pastel */
            .leaflet-overlay-pane svg path[fill="#90EE90"],
            .leaflet-overlay-pane svg path[fill="#98FB98"],
            .leaflet-overlay-pane svg path[fill="#32CD32"],
            .leaflet-overlay-pane svg path[fill="#228B22"],
            .leaflet-overlay-pane svg path[fill="#006400"] {
              fill: #b8e6b8 !important;
            }
            
            /* Eau en bleu pastel */
            .leaflet-overlay-pane svg path[fill="#87CEEB"],
            .leaflet-overlay-pane svg path[fill="#4682B4"],
            .leaflet-overlay-pane svg path[fill="#1E90FF"],
            .leaflet-overlay-pane svg path[fill="#4169E1"],
            .leaflet-overlay-pane svg path[fill="#0000FF"] {
              fill: #b3d9ff !important;
            }
            
            /* Routes principales en blanc avec bordures */
            .leaflet-overlay-pane svg path[stroke="#FF0000"],
            .leaflet-overlay-pane svg path[stroke="#FF4500"] {
              stroke: #ffffff !important;
              stroke-width: 4px !important;
            }
            
            .leaflet-overlay-pane svg path[fill="#FF0000"],
            .leaflet-overlay-pane svg path[fill="#FF4500"] {
              fill: #ffffff !important;
            }
            
            /* Routes secondaires en gris très clair */
            .leaflet-overlay-pane svg path[stroke="#FFA500"],
            .leaflet-overlay-pane svg path[stroke="#FFFF00"] {
              stroke: #f0f0f0 !important;
              stroke-width: 2px !important;
            }
            
            .leaflet-overlay-pane svg path[fill="#FFA500"],
            .leaflet-overlay-pane svg path[fill="#FFFF00"] {
              fill: #f8f8f8 !important;
            }
            
            .custom-marker {
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
              cursor: pointer;
              transition: all 0.2s ease;
              position: relative;
              border: 2px solid white;
              font-size: 14px;
            }
            
            .custom-marker:hover {
              transform: scale(1.15);
              box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15);
            }
            
            .custom-marker.normal {
              background: linear-gradient(135deg, #a8e6cf 0%, #88d8c0 100%);
            }
            
            .custom-marker.date {
              background: linear-gradient(135deg, #ffb3ba 0%, #ff8a95 100%);
            }
            
            .custom-marker.date::after {
              content: '💕';
              position: absolute;
              top: -8px;
              right: -8px;
              font-size: 12px;
              animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.3); }
              100% { transform: scale(1); }
            }
            
            .custom-controls {
              position: absolute;
              top: 20px;
              right: 20px;
              z-index: 1000;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            
            .control-btn {
              width: 44px;
              height: 44px;
              background: white;
              border: none;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-size: 18px;
              font-weight: 500;
              color: #5f6368;
              transition: all 0.2s ease;
            }
            
            .control-btn:hover {
              background: #f8f9fa;
              transform: scale(1.05);
              box-shadow: 0 4px 12px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.15);
            }
            
            .control-btn:active {
              transform: scale(0.95);
            }
            
            .location-btn {
              background: #b3d9ff;
              color: white;
              box-shadow: 0 2px 8px rgba(179, 217, 255, 0.3), 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .location-btn:hover {
              background: #99ccff;
              box-shadow: 0 4px 12px rgba(179, 217, 255, 0.4), 0 2px 6px rgba(0,0,0,0.15);
            }
            
            .loading-indicator {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              z-index: 1000;
              background: white;
              padding: 16px 20px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              display: flex;
              align-items: center;
              gap: 12px;
              font-weight: 500;
              color: #5f6368;
            }
            
            .spinner {
              width: 20px;
              height: 20px;
              border: 2px solid #e8eaed;
              border-top: 2px solid #a8e6cf;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            .user-location-marker {
              background: #b3d9ff;
              border: 3px solid white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              box-shadow: 0 2px 8px rgba(179, 217, 255, 0.3), 0 1px 3px rgba(0,0,0,0.1);
              animation: pulse-blue 2s infinite;
            }
            
            @keyframes pulse-blue {
              0% { 
                transform: scale(1);
                box-shadow: 0 2px 8px rgba(179, 217, 255, 0.3), 0 1px 3px rgba(0,0,0,0.1);
              }
              50% { 
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(179, 217, 255, 0.4), 0 2px 6px rgba(0,0,0,0.15);
              }
              100% { 
                transform: scale(1);
                box-shadow: 0 2px 8px rgba(179, 217, 255, 0.3), 0 1px 3px rgba(0,0,0,0.1);
              }
            }
            
            .leaflet-control-zoom {
              border: none !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
              border-radius: 8px !important;
              overflow: hidden;
            }
            
            .leaflet-control-zoom a {
              background: white !important;
              color: #5f6368 !important;
              border: none !important;
              transition: all 0.2s ease;
            }
            
            .leaflet-control-zoom a:hover {
              background: #f8f9fa !important;
              color: #202124 !important;
            }
            
            .leaflet-control-attribution {
              background: rgba(255, 255, 255, 0.9) !important;
              border-radius: 6px;
              padding: 4px 8px;
              font-size: 11px;
              color: #5f6368;
            }
            
            /* Cursor animation */
            .map-cursor {
              position: absolute;
              width: 12px;
              height: 12px;
              background: rgba(179, 217, 255, 0.6);
              border: 1.5px solid rgba(255, 255, 255, 0.8);
              border-radius: 50%;
              pointer-events: none;
              z-index: 1000;
              opacity: 0;
              transition: opacity 0.3s ease, transform 0.2s ease, left 0.1s ease-out, top 0.1s ease-out;
              box-shadow: 0 1px 3px rgba(179, 217, 255, 0.2);
              backdrop-filter: blur(2px);
              will-change: left, top, opacity, transform;
            }
            
            .map-cursor.visible {
              opacity: 1;
              transform: scale(1);
            }
            
            .map-cursor:hover {
              transform: scale(1.2);
              background: rgba(179, 217, 255, 0.8);
            }
            
            /* Hide popups completely */
            .leaflet-popup {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div id="map">
            <div class="loading-indicator" id="loading">
              <div class="spinner"></div>
              Chargement...
            </div>
            <div class="map-cursor" id="cursor"></div>
          </div>
          
          <div class="custom-controls">
            <button class="control-btn location-btn" onclick="centerOnUser()" title="Ma position">
              📍
            </button>
            <button class="control-btn" onclick="zoomIn()" title="Zoom +">
              +
            </button>
            <button class="control-btn" onclick="zoomOut()" title="Zoom -">
              −
            </button>
          </div>
          
          <script>
            // Initialiser la carte avec style pastel
            const map = L.map('map', {
              zoomControl: false,
              attributionControl: true
            }).setView([${latitude}, ${longitude}], ${zoom});
            
            // Utiliser un style de carte clair avec couleurs pastel
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 18,
              minZoom: 1
            }).addTo(map);
            
            // Variables globales
            let userLocation = null;
            let markers = ${JSON.stringify(markersData)};
            let markerLayers = [];
            let userMarker = null;
            let selectedLocationMarker = null;
            let cursor = null;
            
            // Masquer l'indicateur de chargement
            setTimeout(() => {
              const loading = document.getElementById('loading');
              if (loading) {
                loading.style.opacity = '0';
                setTimeout(() => loading.style.display = 'none', 300);
              }
            }, 1000);
            
            // Initialiser le curseur
            function initCursor() {
              cursor = document.getElementById('cursor');
              if (!cursor) return;
              
              let cursorTimeout;
              let animationFrame;
              let targetX = 0, targetY = 0;
              let currentX = 0, currentY = 0;
              
              function updateCursorPosition() {
                if (cursor) {
                  const dx = targetX - currentX;
                  const dy = targetY - currentY;
                  
                  // Interpolation douce pour un mouvement fluide
                  currentX += dx * 0.15;
                  currentY += dy * 0.15;
                  
                  cursor.style.left = (currentX - 6) + 'px';
                  cursor.style.top = (currentY - 6) + 'px';
                  
                  // Continuer l'animation si le mouvement n'est pas terminé
                  if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                    animationFrame = requestAnimationFrame(updateCursorPosition);
                  }
                }
              }
              
              document.addEventListener('mousemove', (e) => {
                if (cursor) {
                  targetX = e.clientX;
                  targetY = e.clientY;
                  
                  // Initialiser la position si c'est le premier mouvement
                  if (currentX === 0 && currentY === 0) {
                    currentX = targetX;
                    currentY = targetY;
                  }
                  
                  cursor.classList.add('visible');
                  
                  // Démarrer l'animation fluide
                  if (!animationFrame) {
                    animationFrame = requestAnimationFrame(updateCursorPosition);
                  }
                  
                  // Masquer le curseur après 2 secondes d'inactivité
                  clearTimeout(cursorTimeout);
                  cursorTimeout = setTimeout(() => {
                    cursor.classList.remove('visible');
                  }, 2000);
                }
              });
              
              document.addEventListener('mouseleave', () => {
                if (cursor) {
                  cursor.classList.remove('visible');
                }
              });
              
              // Masquer le curseur quand on clique
              document.addEventListener('mousedown', () => {
                if (cursor) {
                  cursor.style.transform = 'scale(0.8)';
                }
              });
              
              document.addEventListener('mouseup', () => {
                if (cursor) {
                  cursor.style.transform = 'scale(1)';
                }
              });
            }
            
            // Fonction pour créer un marqueur personnalisé avec icônes mignonnes
            function createCustomMarker(markerData) {
              const isDate = markerData.isGoodForDate;
              const markerHtml = \`
                <div class="custom-marker \${isDate ? 'date' : 'normal'}">
                  \${isDate ? '🌸' : '🌳'}
                </div>
              \`;
              
              const icon = L.divIcon({
                html: markerHtml,
                className: 'custom-div-icon',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
                popupAnchor: [0, -14]
              });
              
              const marker = L.marker([markerData.lat, markerData.lng], { icon: icon })
                .addTo(map);
              
              // Animation d'apparition
              marker.getElement().style.opacity = '0';
              marker.getElement().style.transform = 'scale(0.5)';
              setTimeout(() => {
                marker.getElement().style.transition = 'all 0.3s ease';
                marker.getElement().style.opacity = '1';
                marker.getElement().style.transform = 'scale(1)';
              }, Math.random() * 300);
              
              marker.on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'marker',
                  id: markerData.id
                }));
              });
              
              return marker;
            }
            
            // Ajouter tous les marqueurs avec animation
            markers.forEach((markerData, index) => {
              setTimeout(() => {
                const marker = createCustomMarker(markerData);
                markerLayers.push(marker);
              }, index * 50);
            });
            
            // Gérer les clics sur la carte pour l'ajout de lieu
            map.on('click', function(e) {
              // Supprimer l'ancien marqueur de sélection s'il existe
              if (selectedLocationMarker) {
                map.removeLayer(selectedLocationMarker);
              }
              
              // Créer un nouveau marqueur de sélection (icône mignonne)
              const selectionIcon = L.divIcon({
                html: '<div style="background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3), 0 1px 3px rgba(0,0,0,0.1); font-size: 12px; animation: pulse 1s infinite;">✨</div>',
                className: 'selection-div-icon',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              });
              
              selectedLocationMarker = L.marker([e.latlng.lat, e.latlng.lng], { icon: selectionIcon })
                .addTo(map);
              
              // Envoyer les coordonnées à React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapPress',
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
              }));
            });
            
            // Fonctions de contrôle
            function zoomIn() {
              map.zoomIn();
              animateButton(event.target);
            }
            
            function zoomOut() {
              map.zoomOut();
              animateButton(event.target);
            }
            
            function centerOnUser() {
              animateButton(event.target);
              if (userLocation) {
                map.setView([userLocation.lat, userLocation.lng], 15, {
                  animate: true,
                  duration: 1
                });
              } else {
                // Demander la géolocalisation
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(function(position) {
                    userLocation = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    };
                    map.setView([userLocation.lat, userLocation.lng], 15, {
                      animate: true,
                      duration: 1
                    });
                    
                    // Ajouter un marqueur pour la position utilisateur
                    if (userMarker) {
                      map.removeLayer(userMarker);
                    }
                    
                    userMarker = L.marker([userLocation.lat, userLocation.lng], {
                      icon: L.divIcon({
                        html: '<div class="user-location-marker"></div>',
                        className: 'user-location-div-icon',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                      })
                    }).addTo(map);
                  });
                }
              }
            }
            
            function animateButton(button) {
              button.style.transform = 'scale(0.9)';
              setTimeout(() => {
                button.style.transform = 'scale(1.05)';
                setTimeout(() => {
                  button.style.transform = 'scale(1)';
                }, 100);
              }, 50);
            }
            
            // Initialiser la géolocalisation
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(function(position) {
                userLocation = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
              });
            }
            
            // Gérer les changements de vue
            map.on('moveend', function() {
              const center = map.getCenter();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapMove',
                latitude: center.lat,
                longitude: center.lng,
                zoom: map.getZoom()
              }));
            });
            
            // Ajouter des contrôles de zoom personnalisés
            L.control.zoom({
              position: 'bottomright'
            }).addTo(map);
            
            // Initialiser le curseur après le chargement
            setTimeout(initCursor, 500);
          </script>
        </body>
      </html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'marker' && onMarkerPress) {
        onMarkerPress(data.id);
      } else if (data.type === 'mapPress' && onMapPress) {
        onMapPress(data.latitude, data.longitude);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        bounces={false}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
