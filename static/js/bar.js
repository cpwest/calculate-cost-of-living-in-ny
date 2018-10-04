// Plot the default route once the page loads


var defaultProfession = "Marketing Managers";
plotBarGraph(defaultProfession);

function plotBarGraph(defaultProfession){
    console.log("plotBarGraph called...")
    var url = "/bar/" + defaultProfession;
    console.log("URL: ", url)
    d3.json(url).then(function(data) {
        console.log("data:", data);
        var xValues = [];
        var yValues = ["Mean", "Entry", "Experienced"];
        xValues.push(data.Mean[0]);
        xValues.push(data.Entry[0]);
        xValues.push(data.Experienced[0]);
        var plot_data = {
            "x": xValues,
            "y": yValues,
            "type": "bar",
            "orientation": "h"
        }
        plot_data = [plot_data];
        console.log("plot_data", plot_data);
        var layout = { margin: { t: 30, b: 100 } };
        Plotly.plot("bar", plot_data, layout);
    });
}




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