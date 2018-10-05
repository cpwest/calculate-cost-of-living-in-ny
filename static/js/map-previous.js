



const betaLink = "http://data.beta.nyc//dataset/0ff93d2d-90ba-457c-9f7e-39e47bf2ac5f/resource/" +
    "35dd04fb-81b3-479b-a074-a27a37888ce7/download/d085e2f8d0b54d4590b1e7d1f35594c1pediacitiesnycneighborhoods.geojson";

var data = {};
var Carlos = [];

const fetcher = (url) => {
    fetch(url)
        .then(function (response) {
            return response.json();
        })
        .then(function (betaData) {
            data = betaData;
            fetch('readcsv')
                .then(response => response.text())
                .then(zillow => {
                    console.log("zillow:", zillow);
                    var zillow = zillow.split('\n');
                    zillow.forEach((e, i) => {
                        zillow[i] = zillow[i].split(',');
                    });
                    // console.log(zillow);
                    data.features.forEach(f => {
                        // console.log(f);
                        zillow.forEach((z, i) => {
                            if (f.properties.neighborhood == zillow[i][1]) {
                                zillow[i][4] = parseInt(zillow[i][4], 10);
                                f.properties.zillow = zillow[i][4];
                                // console.log(f.properties);
                                // console.log(f);
                                Carlos.push(f);
                            }
                        })
                    })
                })

        });
};

fetcher(betaLink);

setTimeout(function () {

    console.log(Carlos);


    var map = L.map("myMap", {
        center: [40.7128, -74.0059],
        zoom: 11
    });

// Adding tile layer
    L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.streets",
        accessToken: API_KEY
    }).addTo(map);

    console.log(" layer created...");

    var geoJson = Carlos;
    var userinputtest = 3000


    L.geoJson(geoJson, {

        style(feature) {

            if (userinputtest >= feature.properties.zillow) {
                return {
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.3,
                    fillColor: '#0eaa00'
                };
            } else {
                return {
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.3,
                    fillColor: '#666666'
                };
            }
            ;
        },
        // Called on each feature
        onEachFeature: function (feature, layer) {
            // Set mouse events to change map styling
            layer.on({
                // When a user's mouse touches a map feature, the mouseover event calls this function, that feature's opacity changes to 90% so that it stands out
                mouseover: function (event) {
                    layer = event.target;
                    layer.setStyle({
                        fillOpacity: 0.9
                    });
                },
                // When the cursor no longer hovers over a map feature - when the mouseout event occurs - the feature's opacity reverts back to 50%
                mouseout: function (event) {
                    layer = event.target;
                    layer.setStyle({
                        fillOpacity: 0.5
                    });
                },
                // When a feature (neighborhood) is clicked, it is enlarged to fit the screen
                click: function (event) {
                    map.fitBounds(event.target.getBounds());
                }
            });
            // Giving each feature a pop-up with information pertinent to it
            layer.bindPopup("<h1>" + feature.properties.neighborhood + "</h1> <hr> <h2>" + feature.properties.borough + "</h2>");

        }
    }).addTo(map);

    console.log("**** addToMap finished ....");
}, 5000);
