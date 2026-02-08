import json
import os
import re
from bisect import bisect_left, bisect_right
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from fastapi import APIRouter, HTTPException, status
from schemas import CitySearchRequest, CityData, CitySearchResponse
router = APIRouter()

# ============================================================================
# LOAD CITIES DATABASE + PRE-BUILT INDEXES
# ============================================================================

def load_cities_database():
    """Load cities from JSON file"""
    data_file = Path(__file__).parent.parent / "data" / "us_cities.json"
    with open(data_file, 'r') as f:
        return json.load(f)


# US state name to abbreviation mapping for query parsing
STATE_ABBREV_MAP: Dict[str, str] = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
    "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN",
    "mississippi": "MS", "missouri": "MO", "montana": "MT", "nebraska": "NE",
    "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
    "new mexico": "NM", "new york": "NY", "north carolina": "NC",
    "north dakota": "ND", "ohio": "OH", "oklahoma": "OK", "oregon": "OR",
    "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
    "vermont": "VT", "virginia": "VA", "washington": "WA",
    "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "district of columbia": "DC",
}

# Reverse map: abbreviation -> abbreviation (for when users type "CA", "TX", etc.)
STATE_ABBREV_SET = set(STATE_ABBREV_MAP.values())


def build_indexes(cities_db: List[dict]) -> dict:
    """
    Pre-build all indexes at startup so search is O(log n) prefix + O(k) scoring
    instead of O(n) fuzzy scan on every request.
    """
    # --- Index 1: Sorted lowercase city names for binary search prefix lookup ---
    # Each entry is (lowercase_city_name, original_index) so we can handle
    # duplicate city names (e.g., multiple "Franklin" entries) correctly.
    sorted_entries: List[Tuple[str, int]] = []
    for idx, city in enumerate(cities_db):
        sorted_entries.append((city['city'].lower(), idx))
    sorted_entries.sort(key=lambda x: x[0])

    sorted_keys = [entry[0] for entry in sorted_entries]
    sorted_indices = [entry[1] for entry in sorted_entries]

    # --- Index 2: Precomputed lowercase names with index for substring fallback ---
    # Stores (lowercase_name, lowercase_state, original_index)
    lowercase_lookup: List[Tuple[str, str, int]] = [
        (city['city'].lower(), city['state'].lower(), idx)
        for idx, city in enumerate(cities_db)
    ]

    return {
        "sorted_keys": sorted_keys,
        "sorted_indices": sorted_indices,
        "lowercase_lookup": lowercase_lookup,
    }


# Load once at module init
CITIES_DB = load_cities_database()
INDEXES = build_indexes(CITIES_DB)


# ============================================================================
# QUERY PARSING
# ============================================================================

def parse_query(raw_query: str) -> Tuple[str, Optional[str]]:
    """
    Parse user input to extract city query and optional state filter.
    
    Supports formats:
      - "Portland"           -> ("portland", None)
      - "Portland, OR"       -> ("portland", "OR")
      - "Portland OR"        -> ("portland", "OR")
      - "Springfield, Illinois" -> ("springfield", "IL")
      - "San Francisco CA"   -> ("san francisco", "CA")
    """
    raw = raw_query.strip()
    if not raw:
        return ("", None)

    city_part = raw.lower()
    state_filter: Optional[str] = None

    # Try comma-separated: "City, State"
    if "," in raw:
        parts = raw.split(",", 1)
        city_candidate = parts[0].strip().lower()
        state_candidate = parts[1].strip().lower()

        resolved = _resolve_state(state_candidate)
        if resolved:
            city_part = city_candidate
            state_filter = resolved
        # If state doesn't resolve, treat entire string as city query
    else:
        # Try space-separated: check if last word(s) are a state
        # Check last word first (for abbreviations like "CA", "TX")
        words = raw.split()
        if len(words) >= 2:
            last_word = words[-1].strip().lower()
            resolved = _resolve_state(last_word)
            if resolved:
                city_part = " ".join(words[:-1]).lower()
                state_filter = resolved
            else:
                # Check last two words (for "New York", "North Carolina", etc.)
                if len(words) >= 3:
                    last_two = " ".join(words[-2:]).strip().lower()
                    resolved = _resolve_state(last_two)
                    if resolved:
                        city_part = " ".join(words[:-2]).lower()
                        state_filter = resolved

    return (city_part.strip(), state_filter)


def _resolve_state(candidate: str) -> Optional[str]:
    """Resolve a string to a 2-letter state abbreviation, or None."""
    upper = candidate.upper()
    if upper in STATE_ABBREV_SET:
        return upper
    lower = candidate.lower()
    if lower in STATE_ABBREV_MAP:
        return STATE_ABBREV_MAP[lower]
    return None


# ============================================================================
# SEARCH ENGINE
# ============================================================================

def _prefix_search(query: str, limit: int) -> List[int]:
    """
    Binary search on sorted city names to find all entries that start with `query`.
    Returns original DB indices. O(log n + k) where k = number of prefix matches.
    """
    sorted_keys = INDEXES["sorted_keys"]
    sorted_indices = INDEXES["sorted_indices"]

    # Find the range [lo, hi) where city names start with the query prefix
    lo = bisect_left(sorted_keys, query)
    # Upper bound: query with last char incremented
    # e.g., "san" -> "sao" to capture "san" through "san~"
    if not query:
        return []
    upper = query[:-1] + chr(ord(query[-1]) + 1)
    hi = bisect_left(sorted_keys, upper)

    # Collect original indices for all prefix matches
    return [sorted_indices[i] for i in range(lo, min(hi, lo + limit * 5))]


def _substring_search(query: str, limit: int) -> List[int]:
    """
    Fallback: linear scan for substring matches in city names.
    Only called when prefix search yields too few results.
    """
    results = []
    for lower_name, _, idx in INDEXES["lowercase_lookup"]:
        if query in lower_name and not lower_name.startswith(query):
            results.append(idx)
            if len(results) >= limit * 3:
                break
    return results


def search_cities_autocomplete(query: str, limit: int = 10) -> List[CityData]:
    """
    Tiered autocomplete search:
      1. Parse query for optional state filter
      2. Prefix match via binary search (fast, most relevant for autocomplete)
      3. If insufficient results, fall back to substring match
      4. Score and rank results by relevance + population
      5. Apply state filter if provided
    """
    city_query, state_filter = parse_query(query)

    if not city_query:
        return []

    # --- Tier 1: Prefix matches (binary search, O(log n)) ---
    prefix_indices = _prefix_search(city_query, limit)

    # --- Tier 2: Substring fallback if prefix matches are sparse ---
    substring_indices: List[int] = []
    if len(prefix_indices) < limit:
        substring_indices = _substring_search(city_query, limit)

    # --- Combine and deduplicate (prefix matches first) ---
    seen: set = set()
    combined_indices: List[Tuple[int, int]] = []  # (db_index, tier)

    for idx in prefix_indices:
        if idx not in seen:
            seen.add(idx)
            combined_indices.append((idx, 1))  # tier 1 = prefix

    for idx in substring_indices:
        if idx not in seen:
            seen.add(idx)
            combined_indices.append((idx, 2))  # tier 2 = substring

    # --- Apply state filter ---
    if state_filter:
        combined_indices = [
            (idx, tier) for idx, tier in combined_indices
            if CITIES_DB[idx]['state'] == state_filter
        ]

    # --- Score and sort ---
    scored: List[Tuple[float, int]] = []
    for idx, tier in combined_indices:
        city = CITIES_DB[idx]
        city_lower = city['city'].lower()
        population = city.get('population', 0)

        # Relevance score (higher = better)
        score = 0.0

        # Exact match bonus
        if city_lower == city_query:
            score += 100000

        # Prefix match bonus (tier 1)
        if tier == 1:
            score += 50000
            # Shorter names that match the prefix are more relevant
            # "San Jose" is more relevant for "san" than "San Buenaventura"
            length_penalty = len(city_lower) - len(city_query)
            score -= length_penalty * 100

        # Population weight (normalized, acts as tiebreaker)
        score += min(population, 10000000) / 100

        scored.append((score, idx))

    # Sort by score descending
    scored.sort(key=lambda x: x[0], reverse=True)

    # Take top results
    results = scored[:limit]

    return [
        CityData(
            city=CITIES_DB[idx]['city'],
            state=CITIES_DB[idx]['state'],
            zipcode=CITIES_DB[idx]['zipcode']
        )
        for _, idx in results
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