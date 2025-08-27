# 🧺 Picnic Map - Application de lieux de pique-nique

Application mobile cross-platform (iOS/Android) pour découvrir et partager les meilleurs lieux de pique-nique.

## 🚀 Configuration pour l'application en ligne

### 1\. Configuration Supabase

1. **Créez un compte Supabase** : <https://supabase.com>
2. **Créez un nouveau projet**
3. **Récupérez vos clés API** :  
   * Allez dans `Settings > API`  
   * Copiez `Project URL` et `anon/public key`
4. **Configurez le fichier .env** :  
cp env.example .env  
Puis remplacez les valeurs dans `.env` :  
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co  
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-ici

### 2\. Configuration Google Maps (optionnel mais recommandé)

**Pour une meilleure expérience sur Android :**

1. **Allez sur Google Cloud Console** : <https://console.cloud.google.com/>
2. **Créez un projet ou sélectionnez un existant**
3. **Activez l'API Maps SDK for Android**
4. **Créez une clé API** dans `Credentials`
5. **Ajoutez la clé dans .env** :  
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=votre-clé-google-maps-ici

**Note :** L'application fonctionne sans clé Google Maps, mais avec des fonctionnalités limitées sur Android.

### 3\. Configuration de la base de données

1. **Dans Supabase, allez dans `SQL Editor`**
2. **Copiez et exécutez le script SQL** depuis `SUPABASE_SCHEMA.sql`
3. **Vérifiez que les tables sont créées** dans `Table Editor`

### 4\. Installation et lancement

# Installer les dépendances
npm install

# Lancer l'application
npx expo start

## 📱 Fonctionnalités

### ✅ Implémentées

* **Carte interactive** avec sélection précise des lieux
* **Ajout de lieux** avec titre, description, type de vue, photos
* **Système d'avis** (notes + commentaires)
* **Questions/Réponses** entre utilisateurs
* **Recherche et filtres** par type de vue
* **Onglet "Mes lieux"** pour gérer vos créations
* **Interface moderne** avec thème cohérent
* **Authentification locale** par surnom
* **Navigation externe** vers Google Maps / Apple Maps / Waze

### 🔄 En cours

* Notifications push
* Partage de lieux
* Photos multiples
* Géolocalisation avancée

## 🏗️ Architecture

* **Frontend** : React Native + Expo
* **Backend** : Supabase (PostgreSQL + Auth + Storage)
* **Navigation** : React Navigation v6
* **Maps** : react-native-maps (Google Maps sur iOS, OpenStreetMap sur Android par défaut)
* **UI** : Composants personnalisés + Ionicons

## 📊 Base de données

Tables principales :

* `users` : Utilisateurs avec surnoms
* `places` : Lieux de pique-nique
* `photos` : Photos des lieux
* `reviews` : Avis et notes
* `questions` : Questions des utilisateurs
* `answers` : Réponses aux questions

## 🔧 Développement

### Mode développement (sans Supabase)

L'application fonctionne avec des données de test si Supabase n'est pas configuré.

### Mode production (avec Supabase)

Configuration complète pour une vraie application en ligne avec persistance des données.

## 📝 Notes importantes

* Les lieux ajoutés sont persistants et partagés entre tous les utilisateurs
* L'authentification est locale (par surnom) pour simplifier l'usage
* Les photos sont stockées dans Supabase Storage
* L'application fonctionne hors ligne pour la consultation
* Sur Android, la carte utilise OpenStreetMap par défaut (pas de clé API requise)
* Sur iOS, la carte utilise Google Maps (clé API recommandée)

## 🐛 Dépannage

### Problème : "Supabase non configuré"

**Solution** : Configurez le fichier `.env` avec vos vraies clés Supabase

### Problème : "Network request failed"

**Solution** : Vérifiez votre connexion internet et les clés Supabase

### Problème : Tables manquantes

**Solution** : Exécutez le script SQL dans Supabase SQL Editor

### Problème : Carte ne s'affiche pas sur Android

**Solution** : 
1. Vérifiez que vous avez une connexion internet
2. L'application utilise OpenStreetMap par défaut sur Android
3. Pour une meilleure expérience, configurez une clé Google Maps API

### Problème : Carte ne s'affiche pas sur iOS

**Solution** : 
1. Vérifiez que vous avez une connexion internet
2. Configurez une clé Google Maps API dans `.env`
3. Redémarrez l'application après avoir ajouté la clé
