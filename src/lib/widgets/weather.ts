/**
 * Default location for weather data fetching.
 * Change these coordinates to customize the weather location.
 */
export const WEATHER_LOCATION = {
  name: "Kalyani",
  latitude: 22.975,
  longitude: 88.434,
}

/**
 * Weather condition categories for icon mapping and UI display.
 * Each group represents a broader weather condition.
 */
export type WeatherGroup =
  | "clear"
  | "cloudy"
  | "rain"
  | "snow"
  | "fog"
  | "storm"

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
}

/**
 * Converts WMO weather code to human-readable description.
 *
 * @param code - WMO weather code from Open-Meteo API
 * @returns Human-readable weather description
 *
 * @example
 * ```typescript
 * describeWeather(0) // "Clear sky"
 * describeWeather(61) // "Light rain"
 * ```
 */
export function describeWeather(code: number): string {
  return WEATHER_CODES[code] ?? "—"
}

/**
 * Maps WMO weather code to a broader weather group category.
 * Used for selecting appropriate weather icons in the UI.
 *
 * @param code - WMO weather code from Open-Meteo API
 * @returns Weather group category for icon mapping
 *
 * @example
 * ```typescript
 * weatherGroup(0) // "clear"
 * weatherGroup(61) // "rain"
 * weatherGroup(95) // "storm"
 * ```
 */
export function weatherGroup(code: number): WeatherGroup {
  if (code === 0 || code === 1) return "clear"
  if (code === 2 || code === 3) return "cloudy"
  if (code === 45 || code === 48) return "fog"
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain"
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow"
  if (code >= 95) return "storm"
  return "cloudy"
}
