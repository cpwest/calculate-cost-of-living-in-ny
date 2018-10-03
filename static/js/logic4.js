// Creating map object
var map = L.map("mapid", {
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



var link = "http://data.beta.nyc//dataset/0ff93d2d-90ba-457c-9f7e-39e47bf2ac5f/resource/" +
"35dd04fb-81b3-479b-a074-a27a37888ce7/download/d085e2f8d0b54d4590b1e7d1f35594c1pediacitiesnycneighborhoods.geojson";

// Function that will determine the color of a neighborhood based on the borough it belongs to
function chooseColor(borough) {
  switch (borough) {
  case "Brooklyn":
    return "yellow";
  case "Bronx":
    return "red";
  case "Manhattan":
    return "orange";
  case "Queens":
    return "green";
  case "Staten Island":
    return "purple";
  default:
    return "black";
  }
}

var Carlos = [];

function getMeanRent(neighborhood){
  var url = "/neighborhoods/" + neighborhood;
  d3.json(url, function (response) {
    var neigh = response.Neighborhood;
    var result = {Neighborhood : response.Neighborhood, MeanRent: response.MeanRent};
      // console.log(response);

    // return response.getMeanRent;
      // console.log(response);
      // console.log(response.MeanRent);
    Carlos.push(result);
    // console.log(Carlos);
    
      // console.log(renting);
  });
  // return result;
}
var renting = {}

// Grabbing our GeoJSON data..
d3.json(link, function(data) {
  console.log(Carlos);
  for (let i = 0; i < data.length; i++) {
    console.log(data[i]);
    for (let j = 0; j < Carlos.length; j++) {
      // console.log(Carlos[j]);
    }
  }

  // Creating a geoJSON layer with the retrieved data
  L.geoJson(data, {
    // Style each feature (in this case a neighborhood)
    style: function(feature) {
      console.log(feature);
      return {
        color: "white",
        // Call the chooseColor function to decide which color to color our neighborhood (color based on borough)
        fillColor: chooseColor(feature.properties.borough),
        fillOpacity: 0.5,
        weight: 1.5
      };
    },
    // Called on each feature
    onEachFeature: function(feature, layer) {
      // Set mouse events to change map styling
      layer.on({
        // When a user's mouse touches a map feature, the mouseover event calls this function, that feature's opacity changes to 90% so that it stands out
        mouseover: function(event) {
          layer = event.target;
          layer.setStyle({
            fillOpacity: 0.9
          });
        },
        // When the cursor no longer hovers over a map feature - when the mouseout event occurs - the feature's opacity reverts back to 50%
        mouseout: function(event) {
          layer = event.target;
          layer.setStyle({
            fillOpacity: 0.5
          });
        },
        // When a feature (neighborhood) is clicked, it is enlarged to fit the screen
        click: function(event) {
          map.fitBounds(event.target.getBounds());
        }
      });

      // function getMeanRent(neighborhood){

      //   var url = "/neighborhoods/" + neighborhood;
      //   d3.json(url, function (response) {
            
          
      //       console.log(response);
      //       console.log(response.MeanRent);
      //       var renting = response.MeanRent
            
      //   });
      // }

      function printMeanRent(obj, neigh){
        // console.log(obj);
        for (c of obj){
          if (c.Neighborhood == neigh){
            return c.MeanRent;
          }
        }
      }
      // var Cath = getMeanRent(feature.properties.neighborhood);
      // console.log(Cath);
      getMeanRent(feature.properties.neighborhood);
      // console.log(Carlos);

      // var renting = getMeanRent(feature.properties.neighborhood)

      // Giving each feature a pop-up with information pertinent to it
      setTimeout(function(){

        layer.bindPopup("<h1>" + feature.properties.neighborhood + "</h1> <hr> <h2>" + printMeanRent(Carlos, feature.properties.neighborhood)+ "</h2> <hr> <h2>" + feature.properties.borough + "</h2>");
      },1000);

    }
  }).addTo(map);
});


// CODE for Drop Down menu -- NOT WORKING 
// SOURCE https://github.com/ahalota/Leaflet.CountrySelect/

// L.ProfessionSelect = {};
// L.ProfessionSelect.titles = 

// L.ProfessionSelect = L.Control.extend({
// 	options: {
// 		position: 'topright',
// 		title: 'Professions',
// 		exclude: [],
// 		include: [],
// 		professions: L.ProfessionSelect.titles,
// 	},
// 	onAdd: function(map) {
// 		this.div = L.DomUtil.create('div','leaflet-professionselect-container');
// 		this.select = L.DomUtil.create('select','leaflet-professionselect',this.div);
// 		var content = '';
		
// 		if (this.options.title.length > 0 ){
// 			content += '<option>'+this.options.title+'</option>';
// 		}
		
// 		var professions = (Array.isArray(this.options.include) && this.options.include.length > 0) ? this.options.include : this.options.professions;

// 		var professionKeys = Object.keys(professions).sort();
// 		for (i in professionKeys){
// 			if (this.options.exclude.indexOf(professionKeys[i]) == -1){
// 				content+='<option>'+professionKeys[i]+'</option>';
// 			}
// 		}
		
// 		this.select.innerHTML = content;

// 		this.select.onmousedown = L.DomEvent.stopPropagation;
		
// 		return this.div;
// 	},
// 	on: function(type,handler){
// 		if (type == 'change'){
// 			this.onChange = handler;
// 			L.DomEvent.addListener(this.select,'change',this._onChange,this);			
// 		} else if (type == 'click'){ //don't need this here probably, but for convenience?
// 			this.onClick = handler;
// 			L.DomEvent.addListener(this.select,'click',this.onClick,this);			
// 		} else {
// 			console.log('ProfessionSelect - cannot handle '+type+' events.')
// 		}
// 	},
// 	_onChange: function(e) {
// 		var selectedProfession = this.select.options[this.select.selectedIndex].value;
// 		e.feature = this.options.professions[selectedProfession];
// 		this.onChange(e);
// 	}
// });

// L.ProfessionSelect = function(id,options){
// 	return new L.ProfessionSelect(id,options);
// };

setTimeout(function(){
  console.log(Carlos);
}, 3000);

