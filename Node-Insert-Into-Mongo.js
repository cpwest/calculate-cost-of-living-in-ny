var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

var d3 = require("d3");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
/* 
    IMPORTANT NOTE: 
    I had to modify the actual d3.js file in order to get this to work!!
    It is located at node_modules/d3/d3.js
*/

var fetch = require("fetch");
/*
    ANOTHER IMPORTANT NOTE: 
    This may help work around a problem if you are getting
    ReferenceError: fetch is not defined
*/

// Connect to the geoJSON 
var geoJSONdata = "http://data.beta.nyc//dataset/0ff93d2d-90ba-457c-9f7e-39e47bf2ac5f/resource/35dd04fb-81b3-479b-a074-a27a37888ce7/download/d085e2f8d0b54d4590b1e7d1f35594c1pediacitiesnycneighborhoods.geojson";
var features = [];

//geoJSON data into MongoDB documents
var documents = d3.json(geoJSONdata, function(data)
{
    //console.log(data);
    for(x=0;x<data.features.length;x++)
    {   
        //console.log(x);
        features.push(data.features[x]);
        //console.log(data.features[x]);
    }

    console.log(features.length);
    //console.log(features[0].toString());

    //Take individual JSON features and load them into your MongoDB
    loadMongoDB(features);
});

//Remember that JS doesnt execute in order -- so this test had to happen within the loop!
//console.log(features.length);

function loadMongoDB(features)
{
    MongoClient.connect(url, function(err, db)
    {
        if (err) throw err;
        
        //Database Name
        var dbo = db.db("nyc_neighborhoods");

        //This loops through each individual record.
        //You may also try using insertMany
        for(i = 0; i < features.length; i++)
        {
            dbo.collection("neighborhoods").insertOne(features[i], function(err, res)
            {
                if (err)
                {
                    console.log("Error");  
                    throw err
                }
                else
                {
                    console.log("Document Inserted");  
                    //console.log(res)
                }
            });
        }
        db.close();
    });
}