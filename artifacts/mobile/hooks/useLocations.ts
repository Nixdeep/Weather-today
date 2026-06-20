import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import { GeoResult } from "./useWeather";

const LOCATIONS_KEY = "skyview_saved_locations";

export interface SavedLocation {
  id: string;
  name: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  addedAt: string;
}

function geoToLocation(geo: GeoResult): SavedLocation {
  return {
    id: `${geo.latitude},${geo.longitude}`,
    name: geo.name,
    country: geo.country,
    country_code: geo.country_code,
    latitude: geo.latitude,
    longitude: geo.longitude,
    addedAt: new Date().toISOString(),
  };
}

export function useLocations() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LOCATIONS_KEY).then((raw) => {
      setLocations(raw ? JSON.parse(raw) : []);
      setLoaded(true);
    });
  }, []);

  const save = useCallback(async (updated: SavedLocation[]) => {
    setLocations(updated);
    await AsyncStorage.setItem(LOCATIONS_KEY, JSON.stringify(updated));
  }, []);

  const addLocation = useCallback(
    async (geo: GeoResult) => {
      const id = `${geo.latitude},${geo.longitude}`;
      if (locations.some((l) => l.id === id)) return;
      await save([...locations, geoToLocation(geo)]);
    },
    [locations, save]
  );

  const removeLocation = useCallback(
    async (id: string) => {
      await save(locations.filter((l) => l.id !== id));
    },
    [locations, save]
  );

  const isSaved = useCallback(
    (geo: { latitude: number; longitude: number } | null) => {
      if (!geo) return false;
      const id = `${geo.latitude},${geo.longitude}`;
      return locations.some((l) => l.id === id);
    },
    [locations]
  );

  return { locations, loaded, addLocation, removeLocation, isSaved };
}
