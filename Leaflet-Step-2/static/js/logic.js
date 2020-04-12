// ==================================================================================================== //
// Set initial variables
// ==================================================================================================== //
// Create variable holding endpoint for the data
// (Last 7 days, all earthquakes)
var queryURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

// (Last 30 days, all earthquakes)
// var queryURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"

// (Last 30 days, earthquakes > 4.5)
// var queryURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson"

// (past day, all earthquakes) Note: Testing using this since it is a smaller dataset so map and browser is more responsive.
// var queryURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"

// (past day, earthquakes > 4.5) Note: Testing using this since it is a smaller dataset so map and browser is more responsive.
// var queryURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson"

// var tectonicPlateLink = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"
var tectonicPlateLink = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json"
// var tectonicPlateLink = "static/data/tectonic_plate_boundaries.json"

// ================================================== //
// Setup markerSize function
    // based on earthquake magnitude
// ================================================== //
function markerSize(magnitude) {
    return magnitude * 10000;
};
  
// ================================================== //
// Setup markerColor function
    // based on earthquake magnitude
        // note: used in both the markers and the legend
// ================================================== //
function markerColor(magnitude) {
color = "";
if (magnitude < 1) {
    color = "#4ecc00";
}
else if (magnitude < 2) {
    color = "#bfff00";
}
else if (magnitude < 3) {
    color = "#ffff00";
}
else if (magnitude < 4) {
    color = "#ffbf00";
}
else if (magnitude < 5) {
    color = "#ff8000";
}
else if (magnitude < 6) {
    color = "#ff3000";
}
else if (magnitude < 7) {
    color = "#cc0000";
}
else if (magnitude < 8) {
    color = "#990000";
}
else if (magnitude >= 8) {
    color = "#660c00";
}
else {
    color = "rbg(0,0,0)";
}
return color;
};
  
// ================================================== //
// Create and setup legend
    // to appear on the map (using Leaflet control with position to the bottom right) when the layer control is called and added below
// ================================================== //
var legend = L.control({
position: "bottomright"
});

legend.onAdd = function(map) {

    // Add a <div> element with class of "legend" within the Leaflet "leaflet-bottom leaflet-right" class <div> element
    var div = L.DomUtil.create("div", "legend"),

    // Create array of magnitudes that create the scale of the legend
    magnitudes = [0,1,2,3,4,5,6,7,8];

    // Loop through the intervals and generate a label with a colored square for each interval corresponding to the earthquake magnitudes on the map (adding html elements; brought out and stylized using CSS file)
    for (var i = 0; i < magnitudes.length; i++) {
        
        // Add html to the element by calling the markerColor function from above, passing through the magnitude from the magnitudes list to determine the square's color
        div.innerHTML += "<i style='background:"
                    + markerColor(magnitudes[i])
                    + "'></i>"

                    // Create the ranges
                    + magnitudes[i]
                    + (magnitudes[i + 1] ? " &ndash; "+ magnitudes[i + 1] + "<br>" : " +");
    };

    // Return the div element when the legend.addTo(myMap) layer control is called and added below
    return div;
};
  
// ================================================== //
// Create map using Leaflet and d3.json, passing through the USGS geoJson object (queryURL)
// ================================================== //
d3.json(queryURL, d => createMap(d.features));

// Create function createMap, passing through earthquakeData, to create the map layers
function createMap(earthquakeData) {
    // Create layers group (not using L.geoJson); loop through locations and marker elements
    earthquakeMarkers = earthquakeData.map((feature) =>
        // IMPORTANT NOTE: geoJson 'FORMAT' lat/lng coordinates are stored in reverse (features.geometry.coordinates stores as an array [lng, lat, depth])
        // Create a circle for each set of earthquake coordinates
        L.circle([feature.geometry.coordinates[1],feature.geometry.coordinates[0]], {
            color: markerColor(feature.properties.mag),
            // fillColor: markerColor(feature.properties.mag),
            fillOpacity: 0.50,
            radius: markerSize(feature.properties.mag)
        })
        .bindPopup(
            "<h2>" + feature.properties.mag + " magnitude</h2>"
            + "<hr>"
            + "<h4>" + feature.properties.place + "</h4>"
            + "<p>" + new Date(feature.properties.time) + "</p>"
        )
    );

    // Add the earthquakes layer to a marker cluster group
    var earthquakes = L.layerGroup(earthquakeMarkers);

    // Create Tectonic Plate lines by reading in and passing through the tectonicPlateLink
    tectonicPlateLines = d3.json(tectonicPlateLink, function(data) {
        // Create geojson layer with the plateBoundariesLink data
        L.geoJson(data, {
            style: function(feature) {
                return {
                    color: "#FF4b00",
                    fillOpacity: 0.0,
                    weight: 3
                };
            },
        }).addTo(myMap);
    });

    // Add the tectonic plates layer to a marker cluster group
    var plates = L.layerGroup(tectonicPlateLines);

    // Define streetmap (light) layer, passing through MapBox API info from config.py file
    var streetmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.streets",
        accessToken: API_KEY
    });

    // Define darkmap layer, passing through MapBox API info from config.py file
    var darkmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.dark",
        accessToken: API_KEY
    });

    // Define satellite layer, passing through MapBox API info from config.py file
    var satellite = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.satellite",
        accessToken: API_KEY
    });

    // Define streets-satellite layer, passing through MapBox API info from config.py file
    var streetsSatellite = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.streets-satellite",
        accessToken: API_KEY
    });

    // Define pirates layer, passing through MapBox API info from config.py file
    var pirates = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.pirates",
        accessToken: API_KEY
    });

    // Define high-contrast layer, passing through MapBox API info from config.py file
    var highContrast = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.high-contrast",
        accessToken: API_KEY
    });

    // Define baseMaps object to hold base layers of the map (streetmap/light and darkmap layers, others...)
    var baseMaps = {
        "Streets-Satellite": streetsSatellite,
        "Street Map": streetmap,
        "Dark Map": darkmap,
        "Satellite": satellite,
        "Pirates": pirates,
        "High Contrast": highContrast
    };

    // Create an overlay object to hold the overlay layer (earthquake markers)
    var overlayMaps = {
        "Earthquakes": earthquakes,
        "Tectonic Plates": plates
    };

    // Create the map; adding layers to display when the html loads and renders in the browser window
    var myMap = L.map("map", {
        center: [37.09, -95.71],
        zoom: 5,
        layers: [streetsSatellite, earthquakes, plates]
    });

    // Add the legend created above to myMap
    legend.addTo(myMap);

    // Create the layer control pannel in the top right (allowing user to toggle between streetmap/light and darkmap layers and toggling off the earthquakes layer, passing through those variables created above and adding to myMap)
    L.control.layers(baseMaps, overlayMaps, {
        collapsed: true
    }).addTo(myMap);
};
  