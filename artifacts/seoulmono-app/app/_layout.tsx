import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen
        name="product/[id]"
        options={{ presentation: "card", headerShown: false }}
      />
      <Stack.Screen
        name="checkout"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="order/[id]"
        options={{ presentation: "card", headerShown: false }}
      />
      <Stack.Screen
        name="notices"
        options={{ presentation: "card", headerShown: false }}
      />
      <Stack.Screen
        name="events"
        options={{ presentation: "card", headerShown: false }}
      />
      <Stack.Screen
        name="addresses"
        options={{ presentation: "card", headerShown: false }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{ presentation: "card", headerShown: false }}
      />
      <Stack.Screen
        name="inquiry"
        options={{ presentation: "card", headerShown: false }}
      />
      <Stack.Screen
        name="order-history"
        options={{ presentation: "card", headerShown: false }}
      />
      <Stack.Screen
        name="webshop"
        options={{ presentation: "card", headerShown: false }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -1,
  },
  splashSub: {
    fontSize: 15,
    color: "#888",
    fontWeight: "400",
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>ソウルモノ</Text>
        <Text style={styles.splashSub}>良い商品を、納得の価格で</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
