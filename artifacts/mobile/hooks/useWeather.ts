import { useState, useCallback } from "react";

export interface GeoResult {
  id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  country_code: string;
}

export interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
}

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  feelsLike: number;
}

export interface WeatherData {
  city: string;
  country: string;
  current: CurrentWeather;
  daily: DailyForecast[];
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear Sky",
  1: "Mostly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Icy Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  80: "Rain Showers",
  81: "Showers",
  82: "Heavy Showers",
  85: "Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ Hail",
  99: "Severe Thunderstorm",
};

const WMO_ICONS: Record<number, string> = {
  0: "sun",
  1: "sun",
  2: "cloud-sun",
  3: "cloud",
  45: "smog",
  48: "smog",
  51: "cloud-drizzle",
  53: "cloud-drizzle",
  55: "cloud-drizzle",
  61: "cloud-rain",
  63: "cloud-rain",
  65: "cloud-showers-heavy",
  71: "snowflake",
  73: "snowflake",
  75: "snowflake",
  80: "cloud-rain",
  81: "cloud-rain",
  82: "cloud-showers-heavy",
  85: "snowflake",
  86: "snowflake",
  95: "zap",
  96: "zap",
  99: "zap",
};

export function getWeatherDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? "Unknown";
}

export function getWeatherIcon(code: number): string {
  return WMO_ICONS[code] ?? "cloud";
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);

  const searchCity = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const fetchWeather = useCallback(async (geo: GeoResult) => {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      const data = await res.json();
      const c = data.current;
      const d = data.daily;

      const daily: DailyForecast[] = (d.time as string[]).map((date: string, i: number) => ({
        date,
        maxTemp: Math.round(d.temperature_2m_max[i]),
        minTemp: Math.round(d.temperature_2m_min[i]),
        weatherCode: d.weather_code[i],
      }));

      setWeather({
        city: geo.name,
        country: geo.country,
        current: {
          temperature: Math.round(c.temperature_2m),
          humidity: c.relative_humidity_2m,
          windSpeed: Math.round(c.wind_speed_10m),
          weatherCode: c.weather_code,
          feelsLike: Math.round(c.apparent_temperature),
        },
        daily,
      });
    } catch {
      setError("Failed to fetch weather. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { weather, loading, error, searchCity, searchResults, searching, fetchWeather };
}
