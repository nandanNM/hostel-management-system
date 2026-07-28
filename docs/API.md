# API Documentation

## Widget APIs

### GET /api/widgets/weather

Fetches current weather data for the configured location (Kalyani).

#### Authentication

None required (public endpoint)

#### Response (200 OK)

```json
{
  "location": "Kalyani",
  "temperature": 28,
  "humidity": 65,
  "wind": 12,
  "code": 1,
  "description": "Mainly clear",
  "group": "clear"
}
```

#### Response Fields

- `location` (string) - Location name
- `temperature` (number) - Temperature in Celsius (rounded)
- `humidity` (number) - Relative humidity percentage (rounded)
- `wind` (number) - Wind speed in km/h (rounded)
- `code` (number) - WMO weather code
- `description` (string) - Human-readable weather description
- `group` (string) - Weather category: `clear`, `cloudy`, `rain`, `snow`, `fog`, or `storm`

#### Error Response (502)

```json
{
  "error": "Weather unavailable"
}
```

#### Caching

- Data is cached for **15 minutes** (900 seconds)
- Uses Next.js ISR with `revalidate: 900`

#### Example Usage

```typescript
const response = await fetch("/api/widgets/weather")
const weather = await response.json()
console.log(`${weather.temperature}°C in ${weather.location}`)
```

#### Data Source

[Open-Meteo API](https://open-meteo.com/) - Free weather API with no authentication required

---

### GET /api/widgets/quote

Returns random inspirational quotes in both Hindi and English.

#### Authentication

None required (public endpoint)

#### Response (200 OK)

```json
{
  "hindi": {
    "text": "कर्म ही पूजा है।",
    "meaning": "Work is worship."
  },
  "english": {
    "text": "The secret of getting ahead is getting started.",
    "author": "Mark Twain"
  }
}
```

#### Response Fields

- `hindi.text` (string) - Hindi quote text
- `hindi.meaning` (string) - English translation/meaning
- `english.text` (string) - English quote text
- `english.author` (string) - Quote author attribution

#### Caching

- **No caching** - marked as `force-dynamic`
- Returns fresh random quotes on every request

#### Example Usage

```typescript
const response = await fetch("/api/widgets/quote")
const { hindi, english } = await response.json()
console.log(hindi.text) // Hindi quote
console.log(english.text) // English quote
```

#### Data Sources

1. **Hindi Quotes**: Curated local collection (7 quotes)
2. **English Quotes**:
   - Primary: [ZenQuotes API](https://zenquotes.io/)
   - Fallback: Local collection (3 quotes)

---

## Widget Components

### `<HomeWidgets />`

Client-side dashboard widget component displaying weather and quotes.

#### Location

`src/app/(root)/_components/home-widgets.tsx`

#### Features

- **Weather Card**: Current temperature, humidity, wind speed, and weather icon
- **Quote Card**: Dual-language inspirational quotes
- **Loading States**: Spinner while fetching data
- **Error Handling**: Graceful fallback messages
- **Auto-refresh**: Weather data cached for 15 minutes
- **Responsive**: 2-column grid on desktop, stacked on mobile

#### Usage

```tsx
import { HomeWidgets } from "@/app/(root)/_components/home-widgets"

export default function DashboardPage() {
  return (
    <div>
      <HomeWidgets />
    </div>
  )
}
```

#### Dependencies

- **React Query**: Data fetching and caching
- **Phosphor Icons**: Weather-specific icons
- **ky**: HTTP client

---

## Utility Functions

### Weather Utilities (`src/lib/widgets/weather.ts`)

#### `WEATHER_LOCATION`

Configuration object for weather location.

```typescript
{
  name: "Kalyani",
  latitude: 22.975,
  longitude: 88.434
}
```

**To customize**: Edit this object to change the default location.

#### `describeWeather(code: number): string`

Converts WMO weather code to human-readable description.

**Parameters:**

- `code` - WMO weather code (0-99)

**Returns:** Weather description string (e.g., "Clear sky", "Light rain")

**Example:**

```typescript
describeWeather(0) // "Clear sky"
describeWeather(61) // "Light rain"
describeWeather(95) // "Thunderstorm"
```

#### `weatherGroup(code: number): WeatherGroup`

Maps weather code to icon category.

**Parameters:**

- `code` - WMO weather code (0-99)

**Returns:** Weather group: `"clear"`, `"cloudy"`, `"rain"`, `"snow"`, `"fog"`, or `"storm"`

**Example:**

```typescript
weatherGroup(0) // "clear"
weatherGroup(61) // "rain"
weatherGroup(95) // "storm"
```

#### Weather Code Reference

| Code Range   | Description            | Group  |
| ------------ | ---------------------- | ------ |
| 0-1          | Clear/Mainly clear     | clear  |
| 2-3          | Partly cloudy/Overcast | cloudy |
| 45-48        | Fog                    | fog    |
| 51-67, 80-82 | Rain/Drizzle           | rain   |
| 71-77, 85-86 | Snow                   | snow   |
| 95-99        | Thunderstorm           | storm  |

---

### Quote Utilities (`src/lib/widgets/quotes.ts`)

#### `HINDI_QUOTES`

Array of 7 curated Hindi quotes with English meanings.

**Type:**

```typescript
type HindiQuote = {
  text: string // Hindi quote
  meaning: string // English translation
}
```

#### `ENGLISH_FALLBACK`

Array of 3 fallback English quotes (used when ZenQuotes API fails).

**Type:**

```typescript
type EnglishQuote = {
  text: string // Quote text
  author: string // Author name
}
```

#### `pickRandom<T>(items: T[]): T`

Selects a random item from an array.

**Parameters:**

- `items` - Array to select from

**Returns:** Random item from the array

**Example:**

```typescript
const quote = pickRandom(HINDI_QUOTES)
const fallback = pickRandom(ENGLISH_FALLBACK)
```

---

## Configuration

### Customizing Weather Location

Edit `src/lib/widgets/weather.ts`:

```typescript
export const WEATHER_LOCATION = {
  name: "Your City",
  latitude: 12.345,
  longitude: 67.89,
}
```

### Adding More Quotes

Edit `src/lib/widgets/quotes.ts`:

```typescript
export const HINDI_QUOTES: HindiQuote[] = [
  { text: "आपका हिंदी उद्धरण", meaning: "Your English meaning" },
  // Add more...
]

export const ENGLISH_FALLBACK: EnglishQuote[] = [
  { text: "Your quote text", author: "Author Name" },
  // Add more...
]
```

---

## Troubleshooting

### Weather Widget Shows "Weather is unavailable"

**Possible causes:**

1. Open-Meteo API is down (rare)
2. Network connectivity issues
3. Invalid coordinates in `WEATHER_LOCATION`

**Solution:** Check browser console for errors and verify coordinates.

### Quote Widget Shows "No quote available"

**Possible causes:**

1. Both ZenQuotes API failed AND local fallback arrays are empty
2. Code logic error

**Solution:** This should never happen with default configuration. Check if `HINDI_QUOTES` and `ENGLISH_FALLBACK` arrays are properly defined.

### Weather Data Not Updating

**Expected behavior:** Weather caches for 15 minutes to reduce API calls.

**To force refresh:** Clear Next.js cache or wait 15 minutes.
