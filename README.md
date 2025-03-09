# Toronto Attractions API Documentation

This API provides access to Toronto's Places of Interest and Attractions dataset in GeoJSON format.

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### GET /attractions

Returns all attractions as a GeoJSON FeatureCollection.

**Response Format:**
```json
{
  "type": "FeatureCollection",
  "name": "Places of Interest and Attractions - 4326",
  "crs": { 
    "type": "name", 
    "properties": { 
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84" 
    } 
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "_id": 1,
        "NAME": "299 Queen Street West",
        "CATEGORY": "Landmark",
        // ...
      },
      "geometry": {
        "type": "MultiPoint",
        "coordinates": [[-79.39044, 43.64942]]
      }
    }
    // ...
  ]
}
```

### GET /attractions/:id

Returns a single attraction by ID.

**Parameters:**
- `id` (path parameter): The unique identifier of the attraction

**Response Format:**
```json
{
  "type": "Feature",
  "properties": {
    "_id": 1,
    "NAME": "299 Queen Street West",
    "CATEGORY": "Landmark",
    //...
  },
  "geometry": {
    "type": "MultiPoint",
    "coordinates": [[-79.39044, 43.64942]]
  }
}
```

### GET /attractions/search

Searches attractions by name, description, or category.

**Query Parameters:**
- `query` (optional): Search term to match against name or attraction description
- `category` (optional): Filter by category (e.g., "Museum", "Landmark")

**Response Format:**
Same as the GET /attractions endpoint, but filtered according to search criteria.

### GET /attractions/nearby

Finds attractions within a specified radius of a geographic point.

**Query Parameters:**
- `lat` (required): Latitude of center point
- `lng` (required): Longitude of center point
- `radius` (optional, default: 5): Radius in kilometers

**Response Format:**
Same as the GET /attractions endpoint, but filtered by proximity.

### GET /categories

Returns a list of all unique categories in the dataset.

**Response Format:**
```json
{
  "categories": [
    "Landmark",
    "Museum",
    "Performing Arts",
    "Nature/ Park"
  ]
}
```

### POST /attractions

Creates a new attraction.

**Request Body:**
```json
{
  "properties": {
    "NAME": "New Attraction Name",
    "CATEGORY": "Museum",
    "ADDRESS_FULL": "123 Example St",
    "CITY": "Toronto",
    "ATTRACTION": "Description of the attraction"
    //...
  },
  "geometry": {
    "type": "MultiPoint",
    "coordinates": [[-79.3832, 43.6532]]
  }
}
```

**Required Fields (in properties):**
- NAME
- CATEGORY
- ADDRESS_FULL
- CITY

**Response:**
Returns the created attraction with a 201 status code, including the newly assigned ID.

### PUT /attractions/:id

Updates an existing attraction.

**Parameters:**
- `id` (path parameter): The unique identifier of the attraction

**Request Body:**
```json
{
  "properties": {
    "NAME": "Updated Attraction Name",
    "CATEGORY": "Updated Category"
    //...
  },
  "geometry": {
    // Optional geometry
  }
}
```

**Response:**
Returns the updated attraction.

### DELETE /attractions/:id

Deletes an attraction.

**Parameters:**
- `id` (path parameter): The unique identifier of the attraction

**Response:**
204 No Content on success.

## Data Structure

Each attraction is represented as a GeoJSON Feature with the following structure in its properties:

| Field | Description |
|-------|-------------|
| _id | Unique identifier |
| ADDRESS_INFO | Additional location information |
| NAME | Name of attraction |
| CATEGORY | Category (e.g., Museum, Landmark) |
| PHONE | Business phone number |
| EMAIL | Business email |
| WEBSITE | Website URL |
| GEOID | Geographic ID |
| ADDRESS_FULL | Full address |
| POSTAL_CODE | Postal code |
| MUNICIPALITY | Municipality name |
| CITY | City name |
| ATTRACTION | Description of the attraction |
| MAP_ACCESS | Whether map access is available (Y/N) |

## Example Requests

Here are some example URLs to test the API:

1. **Get all attractions**:
   ```
   GET http://localhost:3000/api/attractions
   ```

2. **Search attractions by name**:
   ```
   GET http://localhost:3000/api/attractions/search?query=CN+Tower
   ```

3. **Search by category**:
   ```
   GET http://localhost:3000/api/attractions/search?category=Museum
   ```

4. **Get nearby attractions** (5km radius around downtown Toronto):
   ```
   GET http://localhost:3000/api/attractions/nearby?lat=43.6532&lng=-79.3832&radius=5
   ```

5. **Get a specific attraction by ID**:
   ```
   GET http://localhost:3000/api/attractions/1
   ```