// Plot the default route once the page loads


var defaultProfession = "Chief Executives";


function plotBarGraph(defaultProfession){
    console.log("plotBarGraph called...")
    var url = "/bar/" + defaultProfession;
    d3.json(url).then(function(data) {
        var data = [data];
        console.log("bar data", data);

        var layout = { margin: { t: 30, b: 100 } };
        Plotly.plot("bar", data, layout);
    });
}


plotBarGraph(defaultProfession);


// Update the plot with new data
function updatePlotly(newdata) {
    Plotly.restyle("bar", "x", [newdata.x]);
    Plotly.restyle("bar", "y", [newdata.y]);
}

// Get new data whenever the dropdown selection changes
function getData(route) {
    console.log(route);
    d3.json(`/${route}`).then(function(data) {
        console.log("newdata", data);
        updatePlotly(data);
    });
}