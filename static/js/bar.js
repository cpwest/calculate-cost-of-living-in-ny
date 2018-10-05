// Plot the route once the page loads

plotBarGraph(profession);

// $(window).resize(function() {
//     setTimeout(function() {
//         plotBarGraph(profession);
//     }, 500);
// });



function plotBarGraph(profession) {
    var url = "/barchart?profession=" + profession;
    d3.json(url).then(function (data) {
        console.log("data:", data);
        // plot only if valid data is returned
        if (data.Mean !== undefined) {
            var incomeValues = [];
            var experienceValues = ["Entry", "Mean", "Experienced"];
            incomeValues.push(data.Entry[0]);
            incomeValues.push(data.Mean[0]);
            incomeValues.push(data.Experienced[0]);
            var plot_data = {
                "x": experienceValues,
                "y": incomeValues,
                "type": "bar",
                "opacity": .8,
                "text": incomeValues,
                "textposition": 'auto',
                "orientation": "v",
                "marker": {
                    "color": "#2b6aff",
                    "line": {
                        "width": 2
                    }
                }
            }
            plot_data = [plot_data];
            console.log("plot_data", plot_data);
            var layout = {
                margin: {t: 40, b: 20},
                title: profession,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',

            };

            Plotly.plot("bar", plot_data, layout);
        }
    });
}
