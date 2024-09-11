// Store our API endpoint as queryUrl (using past 30 days and 2.5+).
let queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson";

// Perform a GET request to the query URL.
d3.json(queryUrl).then(function (data) {
  // Once we get a response, send the data.features object to the createFeatures function.
  createFeatures(data.features);
});

// Function to determine the color of the marker based on depth
function getColor(depth) {
  // Define the min and max depth values for scaling (you can adjust these)
  const minDepth = 0;
  const maxDepth = 42;

  // Use d3's interpolateYlOrRd to get a color between yellow and red
  const scale = d3.scaleLinear()
                  .domain([minDepth, maxDepth])
                  .range([0, 1]);  // Maps depth to a value between 0 and 1

  return d3.interpolateYlOrRd(scale(depth));
}

function createFeatures(earthquakeData) {
  
    // Function to determine the size of the marker based on magnitude
    function getSize(magnitude) {
        return magnitude * magnitude; // Scale size as needed
    }

    // Define a function that we want to run once for each feature in the features array.
    // Give each feature a popup that describes the place and time of the earthquake.
    function onEachFeature(feature, layer) {
        layer.bindPopup(`<h3>${feature.properties.place}</h3><hr><p>Magnitude: ${feature.properties.mag}<br>Location: (${feature.geometry.coordinates[0]},${feature.geometry.coordinates[1]})<br>Depth: ${feature.geometry.coordinates[2]} km<br>${new Date(feature.properties.time)}</p>`);
    }

    // Create a GeoJSON layer that contains the features array on the earthquakeData object.
    // Run the onEachFeature function once for each piece of data in the array.
    let earthquakes = L.geoJSON(earthquakeData, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                radius: getSize(feature.properties.mag), // Size of the marker
                fillColor: getColor(feature.geometry.coordinates[2]), // Color based on depth
                color: "#000", // Border color
                weight: 1, // Border weight
                opacity: 1,
                fillOpacity: 0.7 // Fill opacity
            });
        },
        onEachFeature: onEachFeature
    });

    // Send our earthquakes layer to the createMap function.
    createMap(earthquakes);
}

function createMap(earthquakes) {

    // Create the base layers.
    let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    // Create a baseMaps object.
    let baseMaps = {
      "Street Map": street,
      "Topographic Map": topo
    };

    // Create an overlay object to hold our overlay.
    let overlayMaps = {
      Earthquakes: earthquakes
    };

    // Create our map, giving it the streetmap and earthquakes layers to display on load.
    let myMap = L.map("map", {
      center: [
        37.09, -95.71
      ],
      zoom: 5,
      layers: [street, earthquakes]
    });

    // Create a layer control.
    // Pass it our baseMaps and overlayMaps.
    // Add the layer control to the map.
    L.control.layers(baseMaps, overlayMaps, {
      collapsed: false
    }).addTo(myMap);

    // Create a legend control.
    let legend = L.control({ position: "bottomright" });

    legend.onAdd = function (map) {
        let div = L.DomUtil.create("div", "info legend"),
            depths = [0, 10, 20, 30, 40],
            labels = [];
    
        // Loop through depth intervals and generate a label with a colored square for each interval
        for (let i = 0; i < depths.length; i++) {
            let from = depths[i];
            let to = depths[i + 1];
    
            labels.push(
                '<i style="background:' + getColor(from + 1) + '"></i> ' +
                from + (to ? '&ndash;' + to : '+'));
        }
    
        div.innerHTML = labels.join('<br>');
        return div;
    };
    
    legend.addTo(myMap);
}