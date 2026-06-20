import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import {
  GeoResult,
  getWeatherDescription,
  getWeatherIcon,
  useWeather,
} from "@/hooks/useWeather";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDayLabel(dateStr: string, index: number) {
  if (index === 0) return "Today";
  const d = new Date(dateStr);
  return DAYS[d.getDay()];
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Feather name={icon as any} size={20} color="rgba(255,255,255,0.7)" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { logout, username } = useAuth();
  const insets = useSafeAreaInsets();
  const { weather, loading, error, searchCity, searchResults, searching, fetchWeather } =
    useWeather();
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchWeather({
      id: 0,
      name: "London",
      country: "United Kingdom",
      country_code: "GB",
      latitude: 51.5085,
      longitude: -0.1257,
    });
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setShowDropdown(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchCity(text);
    }, 300);
  };

  const handleSelectCity = async (geo: GeoResult) => {
    await Haptics.selectionAsync();
    setQuery(geo.name);
    setShowDropdown(false);
    fetchWeather(geo);
  };

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/login");
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <LinearGradient
      colors={["#0A1E3D", "#1A3A6B", "#2B5FA6"]}
      style={styles.gradient}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad + 16,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>
              Hi, {username.split("@")[0]} 👋
            </Text>
            <Text style={styles.subGreeting}>Check today's weather</Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Feather name="log-out" size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={query}
              onChangeText={handleQueryChange}
              onFocus={() => setShowDropdown(true)}
              returnKeyType="search"
            />
            {searching && (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
            )}
            {query.length > 0 && !searching && (
              <Pressable
                onPress={() => {
                  setQuery("");
                  setShowDropdown(false);
                }}
              >
                <Feather name="x" size={16} color="rgba(255,255,255,0.6)" />
              </Pressable>
            )}
          </View>

          {showDropdown && searchResults.length > 0 && (
            <View style={styles.dropdown}>
              {searchResults.map((r) => (
                <Pressable
                  key={r.id}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    pressed && styles.dropdownItemPressed,
                  ]}
                  onPress={() => handleSelectCity(r)}
                >
                  <Feather name="map-pin" size={14} color="#1D6FD8" />
                  <Text style={styles.dropdownText}>
                    {r.name}, {r.country}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" />
            <Text style={styles.loadingText}>Fetching weather…</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {weather && !loading && (
          <>
            <View style={styles.currentCard}>
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={styles.locationText}>
                  {weather.city}, {weather.country}
                </Text>
              </View>
              <Text style={styles.bigTemp}>{weather.current.temperature}°</Text>
              <Text style={styles.condition}>
                {getWeatherDescription(weather.current.weatherCode)}
              </Text>
              <Text style={styles.feelsLike}>
                Feels like {weather.current.feelsLike}°
              </Text>

              <View style={styles.statsRow}>
                <StatCard
                  icon="droplet"
                  label="Humidity"
                  value={`${weather.current.humidity}%`}
                />
                <StatCard
                  icon="wind"
                  label="Wind"
                  value={`${weather.current.windSpeed} km/h`}
                />
                <StatCard
                  icon="thermometer"
                  label="Feels"
                  value={`${weather.current.feelsLike}°C`}
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>7-Day Forecast</Text>
            <View style={styles.forecastList}>
              {weather.daily.map((day, index) => (
                <View
                  key={day.date}
                  style={[
                    styles.forecastItem,
                    index === weather.daily.length - 1 && styles.forecastItemLast,
                  ]}
                >
                  <Text style={styles.forecastDay}>{getDayLabel(day.date, index)}</Text>
                  <Feather
                    name={getWeatherIcon(day.weatherCode) as any}
                    size={20}
                    color="rgba(255,255,255,0.8)"
                  />
                  <Text style={styles.forecastDesc}>
                    {getWeatherDescription(day.weatherCode)}
                  </Text>
                  <View style={styles.forecastTemps}>
                    <Text style={styles.forecastMax}>{day.maxTemp}°</Text>
                    <Text style={styles.forecastMin}>{day.minTemp}°</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  subGreeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  searchContainer: { marginBottom: 24, zIndex: 10 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginTop: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F6FF",
  },
  dropdownItemPressed: { backgroundColor: "#F0F6FF" },
  dropdownText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#0A1628",
  },

  loadingBox: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.15)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#FCA5A5",
    flex: 1,
  },

  currentCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
  },
  bigTemp: {
    fontSize: 80,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    lineHeight: 88,
  },
  condition: {
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  feelsLike: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
  },

  sectionLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 12,
  },
  forecastList: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  forecastItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  forecastItemLast: { borderBottomWidth: 0 },
  forecastDay: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    width: 52,
  },
  forecastDesc: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginLeft: 12,
  },
  forecastTemps: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  forecastMax: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  forecastMin: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
});
