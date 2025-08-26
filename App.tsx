import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation';
import { UserProvider } from './src/context/UserContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UserProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
