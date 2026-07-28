import {
  describeWeather,
  WEATHER_LOCATION,
  weatherGroup,
} from "@/lib/widgets/weather"

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
