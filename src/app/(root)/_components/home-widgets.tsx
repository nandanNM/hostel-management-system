"use client"

import {
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Drop,
  MapPin,
  Quotes,
  Sun,
  Wind,
  type Icon,
} from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import kyInstance from "@/lib/ky"
import type { WeatherGroup } from "@/lib/widgets/weather"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"

type Weather = {
  location: string
  temperature: number
  humidity: number
  wind: number
  code: number
  description: string
  group: WeatherGroup
}

type QuoteData = {
  hindi: { text: string; meaning: string }
  english: { text: string; author: string }
}

/**
 * Maps weather groups to their corresponding Phosphor icons
 */
const WEATHER_ICON: Record<WeatherGroup, Icon> = {
  clear: Sun,
  cloudy: CloudSun,
  rain: CloudRain,
  snow: CloudSnow,
  fog: CloudFog,
  storm: CloudLightning,
}

/**
 * HomeWidgets Component
 *
 * Displays weather and inspirational quote widgets on the dashboard.
 * Fetches data from dedicated API endpoints with automatic caching and error handling.
 *
 * **Features:**
 * - Real-time weather data with temperature, humidity, and wind speed
 * - Dual-language quotes (Hindi with meaning + English with author)
 * - Loading states with spinner
 * - Graceful error handling
 * - Responsive grid layout
 * - Auto-refresh: Weather data cached for 15 minutes
 *
 * @component
 * @example
 * ```tsx
 * <HomeWidgets />
 * ```
 */
export function HomeWidgets() {
  const weather = useQuery({
    queryKey: ["widget", "weather"],
    queryFn: () => kyInstance.get("/api/widgets/weather").json<Weather>(),
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const quote = useQuery({
    queryKey: ["widget", "quote"],
    queryFn: () => kyInstance.get("/api/widgets/quote").json<QuoteData>(),
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const WeatherIcon = weather.data ? WEATHER_ICON[weather.data.group] : Sun

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <MapPin className="size-4" />
            {weather.data?.location ?? "Weather"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weather.isLoading ? (
            <Loader variant="dither" size={22} />
          ) : weather.isError || !weather.data ? (
            <p className="text-muted-foreground text-sm">
              Weather is unavailable right now.
            </p>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-foreground text-4xl font-bold">
                  {weather.data.temperature}°C
                </div>
                <div className="text-muted-foreground mt-1 text-sm">
                  {weather.data.description}
                </div>
                <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Drop className="size-3.5" /> {weather.data.humidity}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="size-3.5" /> {weather.data.wind} km/h
                  </span>
                </div>
              </div>
              <WeatherIcon className="text-primary size-14" weight="duotone" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Quotes className="size-4" weight="fill" />
            Quote of the moment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quote.isLoading ? (
            <Loader variant="dither" size={22} />
          ) : quote.isError || !quote.data ? (
            <p className="text-muted-foreground text-sm">
              No quote available right now.
            </p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-foreground text-lg leading-snug font-medium">
                  {quote.data.hindi.text}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {quote.data.hindi.meaning}
                </p>
              </div>
              <div className="border-border/60 border-t pt-3">
                <p className="text-foreground text-sm italic">
                  &ldquo;{quote.data.english.text}&rdquo;
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  — {quote.data.english.author}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
