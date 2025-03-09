const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;
const GEOJSON_FILE = path.join(__dirname, 'tourist.geojson');

app.use(cors());
app.use(bodyParser.json());

async function readGeoJSON() {
  try {
    const data = await fs.readFile(GEOJSON_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading GeoJSON file:', error);
    return {
      type: "FeatureCollection",
      name: "Places of Interest and Attractions - 4326",
      crs: { 
        type: "name", 
        properties: { 
          name: "urn:ogc:def:crs:OGC:1.3:CRS84" 
        } 
      },
      features: []
    };
  }
}

async function writeGeoJSON(data) {
  try {
    await fs.writeFile(GEOJSON_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing GeoJSON file:', error);
    return false;
  }
}

app.get('/api/attractions', async (req, res) => {
  try {
    const geoJSON = await readGeoJSON();
    res.json(geoJSON);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve attractions' });
  }
});

app.get('/api/attractions/search', async (req, res) => {
  try {
    const { query, category } = req.query;
    const geoJSON = await readGeoJSON();
    
    let filteredFeatures = [...geoJSON.features];
    
    if (query) {
      filteredFeatures = filteredFeatures.filter(f => 
        f.properties.NAME.toLowerCase().includes(query.toLowerCase()) || 
        (f.properties.ATTRACTION && f.properties.ATTRACTION.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    if (category) {
      filteredFeatures = filteredFeatures.filter(f => 
        f.properties.CATEGORY.toLowerCase() === category.toLowerCase()
      );
    }
    
    res.json({
      type: "FeatureCollection",
      name: "Search Results",
      crs: geoJSON.crs,
      features: filteredFeatures
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search attractions' });
  }
});

app.get('/api/attractions/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    const geoJSON = await readGeoJSON();
    const nearby = geoJSON.features.filter(feature => {
      if (!feature.geometry || !feature.geometry.coordinates || !feature.geometry.coordinates[0]) {
        return false;
      }
      const coords = feature.geometry.coordinates[0];
      const dlat = Math.abs(coords[1] - parseFloat(lat));
      const dlng = Math.abs(coords[0] - parseFloat(lng));
      const distance = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
      return distance <= parseFloat(radius);
    });
    res.json({
      type: "FeatureCollection",
      name: "Nearby Attractions",
      crs: geoJSON.crs,
      features: nearby
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to find nearby attractions' });
  }
});

app.get('/api/attractions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const geoJSON = await readGeoJSON();
    const feature = geoJSON.features.find(f => f.properties._id === id);
    if (!feature) {
      return res.status(404).json({ error: 'Attraction not found' });
    }
    res.json(feature);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve attraction' });
  }
});

app.post('/api/attractions', async (req, res) => {
  try {
    const newAttractionData = req.body;
    const geoJSON = await readGeoJSON();
    const requiredFields = ['NAME', 'CATEGORY', 'ADDRESS_FULL', 'CITY'];
    const missingFields = requiredFields.filter(field => 
      !newAttractionData.properties || !newAttractionData.properties[field]
    );
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        fields: missingFields 
      });
    }
    
    const maxId = geoJSON.features.length > 0 
      ? Math.max(...geoJSON.features.map(f => f.properties._id || 0))
      : 0;
    const newId = maxId + 1;
    const newAttraction = {
      type: "Feature",
      properties: {
        _id: newId,
        ...newAttractionData.properties
      },
      geometry: newAttractionData.geometry || {
        type: "MultiPoint",
        coordinates: [[0, 0]]
      }
    };
    
    geoJSON.features.push(newAttraction);
    const success = await writeGeoJSON(geoJSON);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save attraction' });
    }
    res.status(201).json(newAttraction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create attraction' });
  }
});

app.put('/api/attractions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updateData = req.body;
    const geoJSON = await readGeoJSON();
    const index = geoJSON.features.findIndex(f => f.properties._id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Attraction not found' });
    }
    
    const updatedAttraction = {
      ...geoJSON.features[index],
      properties: {
        ...geoJSON.features[index].properties,
        ...(updateData.properties || {}),
        _id: id
      }
    };
    
    if (updateData.geometry) {
      updatedAttraction.geometry = updateData.geometry;
    }
    
    geoJSON.features[index] = updatedAttraction;
    const success = await writeGeoJSON(geoJSON);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update attraction' });
    }
    res.json(updatedAttraction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update attraction' });
  }
});

app.delete('/api/attractions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const geoJSON = await readGeoJSON();
    
    const index = geoJSON.features.findIndex(f => f.properties._id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Attraction not found' });
    }
    
    geoJSON.features.splice(index, 1);
    const success = await writeGeoJSON(geoJSON);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete attraction' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete attraction' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const geoJSON = await readGeoJSON();
    
    const categories = [...new Set(
      geoJSON.features
        .map(f => f.properties.CATEGORY)
        .filter(category => category)
    )];
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

app.listen(port, async () => {
  console.log(`Toronto Attractions API running on port ${port}`);
  
  try {
    await fs.access(GEOJSON_FILE);
    console.log('GeoJSON file found.');
  } catch (error) {
    console.log('GeoJSON file not found. Creating initial file...');
    
    const initialData = {
      type: "FeatureCollection",
      name: "Places of Interest and Attractions - 4326",
      crs: { 
        type: "name", 
        properties: { 
          name: "urn:ogc:def:crs:OGC:1.3:CRS84" 
        } 
      },
      features: []
    };
    
    await writeGeoJSON(initialData);
    console.log('Initial GeoJSON file created.');
  }
});

module.exports = app;
