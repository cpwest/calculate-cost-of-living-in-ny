// Fetch data
data = "///db/data.sqlite";

// Sort the data array using the greekSearchResults value
data.sort(function(wages) {
    return wages.Mean - wages.Title;
});


//Slice the first 10 objects for plotting
data = data.slice(0, 5);

// Reverse the array due to Plotly's defaults
data = data.reverse();

console.log(data);


// Trace1 for the Greek Data
var trace1 = {
    x: data.map(row => row.Mean),
    y: data.map(row => row.Title),
    name: "Professions",
    type: "bar",
    orientation: "h",
    marker: {
        color: 'rgba(255,0,0,1.0)',
    }
};


// data
var data = [trace1];

// Apply the group bar mode to the layout
var layout = {
    title: "Greek gods search results",
    margin: {
        l: 50,
        r: 50,
        t: 50,
        b: 50
    }
};

// Render the plot to the div tag with id "plot"
Plotly.newPlot("plot", data, layout);