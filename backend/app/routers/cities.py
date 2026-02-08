import json
import os
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from rapidfuzz import fuzz, process

router = APIRouter()

# ============================================================================
# SCHEMAS
# ============================================================================

class CitySearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=100)

class CityData(BaseModel):
    city: str
    state: str
    zipcode: str

class CitySearchResponse(BaseModel):
    cities: List[CityData]

# ============================================================================
# LOAD CITIES DATABASE
# ============================================================================

def load_cities_database():
    """Load cities from JSON file"""
    data_file = Path(__file__).parent.parent / "data" / "us_cities.json"
    with open(data_file, 'r') as f:
        return json.load(f)

CITIES_DB = load_cities_database()

# ============================================================================
# SEARCH
# ============================================================================

def search_cities_autocomplete(query: str, limit: int = 10) -> List[CityData]:
    """Fast fuzzy search with population ranking"""
    query_lower = query.lower().strip()
    
    # Get city names for fuzzy matching
    city_names = [city['city'] for city in CITIES_DB]
    
    # Fuzzy match
    matches = process.extract(
        query,
        city_names,
        scorer=fuzz.partial_ratio,
        limit=limit * 2
    )
    
    # Filter good matches (score > 60)
    good_matches = [
        CITIES_DB[city_names.index(match[0])]
        for match in matches
        if match[1] > 60
    ]
    
    # Sort by population, limit results
    good_matches.sort(key=lambda x: x.get('population', 0), reverse=True)
    results = good_matches[:limit]
    
    return [
        CityData(
            city=city['city'],
            state=city['state'],
            zipcode=city['zipcode']
        )
        for city in results
    ]

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/search", response_model=CitySearchResponse)
async def search_cities(search_request: CitySearchRequest) -> CitySearchResponse:
    """Autocomplete search for US cities"""
    try:
        cities = search_cities_autocomplete(search_request.query, limit=10)
        return CitySearchResponse(cities=cities)
    except Exception as e:
        print(f"Error in city search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search error"
        )