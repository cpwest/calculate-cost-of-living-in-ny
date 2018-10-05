// Store our API endpoint inside queryUrl
// var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson";
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";


// Perform a GET request to the query URL
d3.json(queryUrl, function (d) {
    console.log("query results:", d);
    // Once we get a response, send the data.features object to the createFeatures function
    createFeatures(d.features);
});


function markerSize(mag) {
    console.log("mag: " + mag);
    return (mag * 25000);
}


function createFeatures(featureList) {

    // Sending our earthquakes layer to the createMap function
    createMap(featureList);
}


function createMap(featureList) {

    // Create the tile layers that will be the background of our map
    var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.light",
        accessToken: API_KEY
    });

    var darkmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.dark",
        accessToken: API_KEY
    });

    console.log("Running function 2");

    // Define arrays to hold created city and state markers
    var featureMarkers = [];


    // Loop through the cities array and create one marker for each city object
    for (var i = 0; i < featureList.length; i++) {


        // Conditionals for countries points
        var color = "";
        if (featureList[i].properties.mag >= 2.5) {
            color = "#E25403";
        }
        else if (featureList[i].properties.mag >= 1.5) {
            color = "#E28838";
        }
        else if (featureList[i].properties.mag >= 0.5) {
            color = "#E2BB15";
        }
        else {
            color = "#E2150F";
        }

        console.log("Now processing:", featureList[i]);
        console.log("Now processing 2:", featureList[i].geometry.coordinates.slice(0, 2));

        var location = [];
        location.push(featureList[i].geometry.coordinates[1]);
        location.push(featureList[i].geometry.coordinates[0]);

        featureMarkers.push(
            L.circle(location, {
                stroke: false,
                fillOpacity: 0.65,
                color: "white",
                fillColor: color,
                // Setting our circle's radius equal to the output of our markerSize function
                // This will make our marker's size proportionate to its population
                radius: markerSize(featureList[i].properties.mag)
            }).bindPopup("<h3 style='color: #3c3c3c; font-size: 20px'> Magnitude " + featureList[i].properties.mag +
                "</h3><hr><p>" + new Date(featureList[i].properties.time) + "</p>")
        );
    }


    // Create two separate layer groups: one for cities and one for states
    var featureLayer = L.layerGroup(featureMarkers);

// Create a baseMaps object
    var baseMaps = {
        "Street Map": lightmap,
        "Dark Map": darkmap
    };

// Create an overlay object
    var overlayMaps = {
        "Earthquakes": featureLayer
    };

    var myMap = L.map("map", {
        center: [
            38.80, -116.41
        ],
        zoom: 5,
        layers: [lightmap, featureLayer]
    });

    // Add the layer control to the map
    L.control.layers(baseMaps, overlayMaps, {
        collapsed: true
    }).addTo(myMap);

    // Create a legend to display information about our map
    var info = L.control({
        position: "bottomright"
    });

    // Add the info legend to the map
    info.onAdd = function () {
        var div = L.DomUtil.create("div", "legend");
        grades = [0, 1, 2, 3, 4, 5, 6];
        labels = [];
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="color:' + getColor(grades[i] + 1) + '">' +
                grades[i] + (grades[i + 1] ? '&nbsp;&ndash;&nbsp;' + grades[i + 1] + '</i><br>' : '+');
        }

        return div;
    };
    info.addTo(myMap);

}

function getColor(mag) {
    return mag >= 6 ? '#800026' :
        mag >= 5 ? '#BD0026' :
            mag >= 4 ? '#E31A1C' :
                mag >= 3 ? '#FC4E2A' :
                    mag >= 2 ? '#FD8D3C' :
                        mag >= 1 ? '#FEB24C' :
                            mag >= 0 ? '#FED976' :
                                '#FFEDA0';
}
