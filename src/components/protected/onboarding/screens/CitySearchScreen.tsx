import { useState, useEffect } from 'react'

interface CitySearchScreenProps {
  value: string
  onChange: (value: string) => void
}

interface NominatimPlace {
  place_id: number
  display_name: string
  name: string
  lat: string
  lon: string
  address: {
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
    country_code?: string
  }
  type: string
}

export const CitySearchScreen: React.FC<CitySearchScreenProps> = ({ value, onChange }) => {
  const [searchText, setSearchText] = useState(value || '')
  const [showResults, setShowResults] = useState(false)
  const [cities, setCities] = useState<NominatimPlace[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Don't search if input is too short
    if (searchText.length < 2) {
      setCities([])
      return
    }

    // Debounce API calls
    const debounceTimer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(searchText)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `limit=10&` +
          `type=city`,
          {
            headers: {
              'Accept': 'application/json',
            }
          }
        )
        
        if (response.ok) {
          const data: NominatimPlace[] = await response.json()
          // Filter to only show cities, towns, and villages
          const filteredData = data.filter(place => 
            place.address.city || 
            place.address.town || 
            place.address.village
          )
          setCities(filteredData)
        } else {
          setCities([])
        }
      } catch (error) {
        console.error('Error fetching cities:', error)
        setCities([])
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(debounceTimer)
  }, [searchText])

  const formatCityName = (place: NominatimPlace): string => {
    const cityName = place.address.city || place.address.town || place.address.village || place.name
    const state = place.address.state
    const country = place.address.country
    
    // Format as "City, State" for US cities
    if (place.address.country_code === 'us' && state) {
      return `${cityName}, ${state}`
    }
    
    // Format as "City, Country" for international cities
    if (country) {
      return `${cityName}, ${country}`
    }
    
    return cityName
  }

  const handleCitySelect = (place: NominatimPlace) => {
    const formattedName = formatCityName(place)
    setSearchText(formattedName)
    onChange(formattedName)
    setShowResults(false)
  }

  const handleClearSearch = () => {
    setSearchText('')
    onChange('')
    setShowResults(false)
    setCities([])
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-blue-600 text-sm">
        Select by enter address and distance
      </p>
      
      <div className="relative">
        <div className="relative flex items-center border-2 border-blue-600 rounded-lg overflow-hidden bg-white">
          <div className="pl-3 pr-2">
            <svg 
              className="w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          
          <input
            type="text"
            placeholder="City Name"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => {
              // Delay hiding results to allow click events to fire
              setTimeout(() => setShowResults(false), 200)
            }}
            className="flex-1 px-2 py-3 outline-none text-gray-700 placeholder-gray-400"
          />
          
          {searchText && (
            <button
              onClick={handleClearSearch}
              className="pr-3 pl-2 hover:opacity-70"
            >
              <svg 
                className="w-5 h-5 text-gray-400" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
          )}
        </div>

        {showResults && searchText && (
          <div className="absolute w-full bg-blue-50 border border-gray-200 rounded-b-lg mt-0 z-10 shadow-lg max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-3 text-center text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </div>
              </div>
            ) : cities.length > 0 ? (
              cities.map((place) => (
                <button
                  key={place.place_id}
                  onClick={() => handleCitySelect(place)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-100 transition-colors border-b border-gray-200 last:border-b-0 text-gray-700"
                >
                  {formatCityName(place)}
                </button>
              ))
            ) : searchText.length >= 2 ? (
              <div className="px-4 py-3 text-center text-gray-600">
                No cities found
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}