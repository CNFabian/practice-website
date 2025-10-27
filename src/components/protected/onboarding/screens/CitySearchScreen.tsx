import { useState, useEffect } from 'react'

interface CitySearchScreenProps {
  value: string
  onChange: (value: string) => void
}

interface ZipResult {
  'post code': string
  'country abbreviation': string
  places: Array<{
    'place name': string
    'state': string
    'state abbreviation': string
  }>
}

export const CitySearchScreen: React.FC<CitySearchScreenProps> = ({ value, onChange }) => {
  const [searchText, setSearchText] = useState(value || '')
  const [showResults, setShowResults] = useState(false)
  const [cities, setCities] = useState<Array<{ zipcode: string; city: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (searchText.length < 1) {
      setCities([])
      return
    }

    // Debounce API calls
    const debounceTimer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const searchInput = searchText.trim()
        
        if (/^\d+$/.test(searchInput)) { // Only digits
          const results: Array<{ zipcode: string; city: string }> = []
          
          if (searchInput.length === 5) {
            // Complete zipcode - direct search
            try {
              const response = await fetch(
                `https://api.zippopotam.us/us/${searchInput}`
              )
              
              if (response.ok) {
                const data: ZipResult = await response.json()
                data.places.forEach(place => {
                  results.push({
                    zipcode: data['post code'],
                    city: `${place['place name']}, ${place['state abbreviation']}`
                  })
                })
              }
            } catch (error) {
              console.error('Error fetching zipcode:', error)
            }
          } else {
            // Partial zipcode
            const prefix = searchInput
            const maxAttempts = 20
            let foundCount = 0
            
            for (let i = 0; i < 1000 && foundCount < maxAttempts; i++) {
              const paddedNumber = String(i).padStart(5 - prefix.length, '0')
              const testZip = prefix + paddedNumber
              
              try {
                const response = await fetch(
                  `https://api.zippopotam.us/us/${testZip}`
                )
                
                if (response.ok) {
                  const data: ZipResult = await response.json()
                  data.places.forEach(place => {
                    const exists = results.find(r => 
                      r.zipcode === data['post code'] && 
                      r.city === `${place['place name']}, ${place['state abbreviation']}`
                    )
                    if (!exists) {
                      results.push({
                        zipcode: data['post code'],
                        city: `${place['place name']}, ${place['state abbreviation']}`
                      })
                      foundCount++
                    }
                  })
                }
              } catch (error) {
                // Skip invalid zipcodes silently
              }
              
              if (foundCount >= maxAttempts) break
            }
          }
          
          setCities(results)
        } else {
          setCities([])
        }
      } catch (error) {
        console.error('Error fetching zipcode data:', error)
        setCities([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchText])

  const handleCitySelect = (zipcode: string, city: string) => {
    const formattedValue = `${city} (${zipcode})`
    setSearchText(formattedValue)
    onChange(formattedValue)
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
        Select city by entering zipcode
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
            placeholder="Enter zipcode"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => {
              setTimeout(() => setShowResults(false), 200)
            }}
            className="flex-1 px-2 py-3 outline-none text-gray-700 placeholder-gray-400"
            maxLength={5}
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
              cities.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleCitySelect(item.zipcode, item.city)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-100 transition-colors border-b border-gray-200 last:border-b-0 text-gray-700"
                >
                  <div className="flex justify-between items-center">
                    <span>{item.city}</span>
                    <span className="text-sm text-gray-500">{item.zipcode}</span>
                  </div>
                </button>
              ))
            ) : searchText.length >= 1 && /^\d+$/.test(searchText) ? (
              <div className="px-4 py-3 text-center text-gray-600">
                No cities found for this zipcode
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}