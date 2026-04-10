import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const RootLayout = () => (
  <GestureHandlerRootView style={styles.root}>
    <SafeAreaProvider>
      <Stack />
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

export default RootLayout;

const styles = StyleSheet.create({
  root: { flex: 1 },
});
