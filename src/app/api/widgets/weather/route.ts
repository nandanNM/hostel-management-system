import {
  describeWeather,
  WEATHER_LOCATION,
  weatherGroup,
} from "@/lib/widgets/weather"

/**
 * Weather Widget API Endpoint
 *
 * Fetches current weather data from Open-Meteo API for the configured location.
 *
 * @returns JSON response with weather data or error
 *
 * **Success Response (200):**
 * ```json
 * {
 *   "location": "Kalyani",
 *   "temperature": 28,
 *   "humidity": 65,
 *   "wind": 12,
 *   "code": 1,
 *   "description": "Mainly clear",
 *   "group": "clear"
 * }
 * ```
 *
 * **Error Response (502):**
 * ```json
 * { "error": "Weather unavailable" }
 * ```
 *
 * **Caching:** Data is cached for 15 minutes (900 seconds)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/widgets/weather')
 * const weather = await response.json()
 * ```
 */
export async function GET() {
  try {
    const { latitude, longitude, name } = WEATHER_LOCATION
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`

    const res = await fetch(url, { next: { revalidate: 900 } })
    if (!res.ok) {
      return Response.json({ error: "Weather unavailable" }, { status: 502 })
    }

    const data = await res.json()
    const current = data?.current
    if (!current) {
      return Response.json({ error: "Weather unavailable" }, { status: 502 })
    }

    return Response.json({
      location: name,
      temperature: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m),
      wind: Math.round(current.wind_speed_10m),
      code: current.weather_code,
      description: describeWeather(current.weather_code),
      group: weatherGroup(current.weather_code),
    })
  } catch {
    return Response.json({ error: "Weather unavailable" }, { status: 502 })
  }
}
