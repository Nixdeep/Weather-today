import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { SavedLocation, useLocations } from "@/hooks/useLocations";
import {
  GeoResult,
  getWeatherDescription,
  getWeatherIcon,
  useWeather,
} from "@/hooks/useWeather";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

interface LocationRowProps {
  loc: SavedLocation;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function LocationRow({ loc, isActive, onSelect, onRemove }: LocationRowProps) {
  const [temp, setTemp] = useState<number | null>(null);
  const [code, setCode] = useState<number | null>(null);

  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}` +
        `&current=temperature_2m,weather_code&timezone=auto`
    )
      .then((r) => r.json())
      .then((d) => {
        setTemp(Math.round(d.current.temperature_2m));
        setCode(d.current.weather_code);
      })
      .catch(() => {});
  }, [loc.id]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.savedLocRow,
        isActive && styles.savedLocRowActive,
        pressed && styles.savedLocRowPressed,
      ]}
      onPress={onSelect}
    >
      <View style={[styles.locationDot, isActive && styles.locationDotActive]} />
      <View style={styles.locationInfo}>
        <Text style={[styles.locationName, isActive && styles.locationNameActive]}>
          {loc.name}
        </Text>
        <Text style={styles.locationCountry}>{loc.country}</Text>
      </View>
      <View style={styles.locationRight}>
        {temp !== null && code !== null ? (
          <View style={styles.locationWeather}>
            <Feather
              name={getWeatherIcon(code) as any}
              size={16}
              color={isActive ? "#FFFFFF" : "#6B7FA3"}
            />
            <Text style={[styles.locationTemp, isActive && styles.locationTempActive]}>
              {temp}°
            </Text>
          </View>
        ) : (
          <ActivityIndicator size="small" color={isActive ? "#FFFFFF" : "#6B7FA3"} />
        )}
        <Pressable
          style={styles.removeBtn}
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          hitSlop={8}
        >
          <Feather name="x" size={16} color={isActive ? "rgba(255,255,255,0.6)" : "#9BADC8"} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { logout, user } = useAuth();
  const insets = useSafeAreaInsets();
  const { weather, loading, error, searchCity, searchResults, searching, fetchWeather } =
    useWeather();
  const { locations, addLocation, removeLocation, isSaved } = useLocations();

  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeGeo, setActiveGeo] = useState<GeoResult | null>(null);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defaultGeo: GeoResult = {
    id: 0,
    name: "London",
    country: "United Kingdom",
    country_code: "GB",
    latitude: 51.5085,
    longitude: -0.1257,
  };

  useEffect(() => {
    setActiveGeo(defaultGeo);
    fetchWeather(defaultGeo);
  }, []);

  const openLocations = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocationsOpen(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 180,
    }).start();
  };

  const closeLocations = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setLocationsOpen(false));
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setShowDropdown(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchCity(text), 300);
  };

  const handleSelectCity = async (geo: GeoResult) => {
    await Haptics.selectionAsync();
    setQuery(geo.name);
    setShowDropdown(false);
    setActiveGeo(geo);
    fetchWeather(geo);
  };

  const handleSelectSavedLocation = async (loc: SavedLocation) => {
    await Haptics.selectionAsync();
    const geo: GeoResult = {
      id: 0,
      name: loc.name,
      country: loc.country,
      country_code: loc.country_code,
      latitude: loc.latitude,
      longitude: loc.longitude,
    };
    setActiveGeo(geo);
    setQuery(loc.name);
    fetchWeather(geo);
    closeLocations();
  };

  const handleAddCurrent = async () => {
    if (!activeGeo) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addLocation(activeGeo);
  };

  const handleRemove = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await removeLocation(id);
  };

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/login");
  };

  const currentIsSaved = isSaved(activeGeo);
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const panelTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  return (
    <LinearGradient colors={["#0A1E3D", "#1A3A6B", "#2B5FA6"]} style={styles.gradient}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>
              Hi, {user?.name?.split(" ")[0] ?? user?.email?.split("@")[0]} 👋
            </Text>
            <Text style={styles.subGreeting}>Check today's weather</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={openLocations} style={styles.iconBtn}>
              <Feather name="map" size={20} color="rgba(255,255,255,0.85)" />
              {locations.length > 0 && (
                <View style={styles.locationsBadge}>
                  <Text style={styles.locationsBadgeText}>{locations.length}</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.iconBtn}>
              <Feather name="log-out" size={20} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <View style={[styles.searchBar, { flex: 1 }]}>
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
              {searching && <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />}
              {query.length > 0 && !searching && (
                <Pressable onPress={() => { setQuery(""); setShowDropdown(false); }}>
                  <Feather name="x" size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>
              )}
            </View>

            {activeGeo && (
              <Pressable
                style={[styles.saveBtn, currentIsSaved && styles.saveBtnSaved]}
                onPress={handleAddCurrent}
                disabled={currentIsSaved}
              >
                <Feather
                  name={currentIsSaved ? "bookmark" : "bookmark"}
                  size={18}
                  color={currentIsSaved ? "#3B82F6" : "rgba(255,255,255,0.7)"}
                />
              </Pressable>
            )}
          </View>

          {showDropdown && searchResults.length > 0 && (
            <View style={styles.dropdown}>
              {searchResults.map((r) => (
                <Pressable
                  key={r.id}
                  style={({ pressed }) => [styles.dropdownItem, pressed && styles.dropdownItemPressed]}
                  onPress={() => handleSelectCity(r)}
                >
                  <Feather name="map-pin" size={14} color="#1D6FD8" />
                  <Text style={styles.dropdownText}>{r.name}, {r.country}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" />
            <Text style={styles.loadingText}>Fetching weather…</Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Current Weather */}
        {weather && !loading && (
          <>
            <View style={styles.currentCard}>
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={styles.locationText}>{weather.city}, {weather.country}</Text>
                {currentIsSaved && (
                  <View style={styles.savedPill}>
                    <Feather name="bookmark" size={10} color="#3B82F6" />
                    <Text style={styles.savedPillText}>Saved</Text>
                  </View>
                )}
              </View>
              <Text style={styles.bigTemp}>{weather.current.temperature}°</Text>
              <Text style={styles.condition}>{getWeatherDescription(weather.current.weatherCode)}</Text>
              <Text style={styles.feelsLike}>Feels like {weather.current.feelsLike}°</Text>
              <View style={styles.statsRow}>
                <StatCard icon="droplet" label="Humidity" value={`${weather.current.humidity}%`} />
                <StatCard icon="wind" label="Wind" value={`${weather.current.windSpeed} km/h`} />
                <StatCard icon="thermometer" label="Feels" value={`${weather.current.feelsLike}°C`} />
              </View>
            </View>

            <Text style={styles.sectionLabel}>7-Day Forecast</Text>
            <View style={styles.forecastList}>
              {weather.daily.map((day, index) => (
                <View
                  key={day.date}
                  style={[styles.forecastItem, index === weather.daily.length - 1 && styles.forecastItemLast]}
                >
                  <Text style={styles.forecastDay}>{getDayLabel(day.date, index)}</Text>
                  <Feather name={getWeatherIcon(day.weatherCode) as any} size={20} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.forecastDesc}>{getWeatherDescription(day.weatherCode)}</Text>
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

      {/* Locations Panel Modal */}
      <Modal
        visible={locationsOpen}
        transparent
        animationType="none"
        onRequestClose={closeLocations}
      >
        <TouchableWithoutFeedback onPress={closeLocations}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.panel,
            {
              paddingBottom: insets.bottom + 20,
              transform: [{ translateY: panelTranslate }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.panelHandle} />

          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>My Locations</Text>
              <Text style={styles.panelSubtitle}>
                {locations.length === 0
                  ? "No saved locations yet"
                  : `${locations.length} saved location${locations.length > 1 ? "s" : ""}`}
              </Text>
            </View>
            <Pressable onPress={closeLocations} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#6B7FA3" />
            </Pressable>
          </View>

          {locations.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="map" size={32} color="#D0E2FF" />
              </View>
              <Text style={styles.emptyTitle}>No saved locations</Text>
              <Text style={styles.emptyBody}>
                Search for a city and tap the bookmark icon to save it here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={locations}
              keyExtractor={(l) => l.id}
              scrollEnabled={locations.length > 5}
              style={styles.locationsList}
              contentContainerStyle={{ paddingBottom: 8 }}
              renderItem={({ item }) => (
                <LocationRow
                  loc={item}
                  isActive={activeGeo ? item.id === `${activeGeo.latitude},${activeGeo.longitude}` : false}
                  onSelect={() => handleSelectSavedLocation(item)}
                  onRemove={() => handleRemove(item.id)}
                />
              )}
            />
          )}

          {activeGeo && !currentIsSaved && (
            <Pressable style={styles.addCurrentBtn} onPress={handleAddCurrent}>
              <LinearGradient
                colors={["#1D6FD8", "#3B82F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addCurrentGradient}
              >
                <Feather name="plus" size={18} color="#fff" />
                <Text style={styles.addCurrentText}>
                  Save "{weather?.city ?? activeGeo.name}"
                </Text>
              </LinearGradient>
            </Pressable>
          )}
        </Animated.View>
      </Modal>
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
  greeting: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  subGreeting: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 10 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  locationsBadge: {
    position: "absolute", top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#3B82F6",
    alignItems: "center", justifyContent: "center",
  },
  locationsBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },

  searchContainer: { marginBottom: 24, zIndex: 10 },
  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14, height: 50, gap: 10,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#FFFFFF" },
  saveBtn: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  saveBtnSaved: {
    backgroundColor: "rgba(59,130,246,0.2)",
    borderColor: "rgba(59,130,246,0.4)",
  },

  dropdown: {
    backgroundColor: "#FFFFFF", borderRadius: 14, marginTop: 6,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 10,
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: "#F0F6FF",
  },
  dropdownItemPressed: { backgroundColor: "#F0F6FF" },
  dropdownText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#0A1628" },

  loadingBox: { alignItems: "center", paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(239,68,68,0.15)",
    borderRadius: 12, padding: 14, marginBottom: 20,
  },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#FCA5A5", flex: 1 },

  currentCard: {
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 24,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    padding: 24, marginBottom: 24, alignItems: "center",
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  locationText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  savedPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(59,130,246,0.2)",
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },
  savedPillText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#3B82F6" },
  bigTemp: { fontSize: 80, fontFamily: "Inter_700Bold", color: "#FFFFFF", lineHeight: 88 },
  condition: { fontSize: 18, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.9)", marginTop: 4 },
  feelsLike: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginTop: 4, marginBottom: 24 },
  statsRow: { flexDirection: "row", gap: 12, width: "100%" },
  statCard: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14, padding: 12, alignItems: "center", gap: 4,
  },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginTop: 4 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },

  sectionLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.8)", marginBottom: 12 },
  forecastList: {
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", overflow: "hidden",
  },
  forecastItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  forecastItemLast: { borderBottomWidth: 0 },
  forecastDay: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFFFFF", width: 52 },
  forecastDesc: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginLeft: 12 },
  forecastTemps: { flexDirection: "row", gap: 8, alignItems: "center" },
  forecastMax: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  forecastMin: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)" },

  /* Locations Panel */
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  panel: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12, paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.72,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
  },
  panelHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#D0E2FF",
    alignSelf: "center", marginBottom: 16,
  },
  panelHeader: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 20,
  },
  panelTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#0A1628" },
  panelSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B7FA3", marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F0F6FF",
    alignItems: "center", justifyContent: "center",
  },

  locationsList: { maxHeight: SCREEN_HEIGHT * 0.4 },
  savedLocRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F8FAFF", borderRadius: 16,
    padding: 14, marginBottom: 8, gap: 12,
  },
  savedLocRowActive: { backgroundColor: "#1D6FD8" },
  savedLocRowPressed: { opacity: 0.85 },
  locationDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#D0E2FF" },
  locationDotActive: { backgroundColor: "#FFFFFF" },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#0A1628" },
  locationNameActive: { color: "#FFFFFF" },
  locationCountry: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B7FA3", marginTop: 1 },
  locationRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  locationWeather: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationTemp: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0A1628" },
  locationTempActive: { color: "#FFFFFF" },
  removeBtn: { padding: 2 },

  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#F0F6FF",
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0A1628" },
  emptyBody: {
    fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B7FA3",
    textAlign: "center", lineHeight: 20, paddingHorizontal: 20,
  },

  addCurrentBtn: { borderRadius: 14, overflow: "hidden", marginTop: 14 },
  addCurrentGradient: {
    height: 52, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  addCurrentText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
});
