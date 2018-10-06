plotlineGraph('Fresh Meadows');
// plotlineGraph('Upper East Side');

function plotlineGraph(regionName) {

    var url = "/linedata";
    d3.json(url).then(function (data) {
        console.log("data:", data);

        var regionList = data.RegionName;
        var dataIndex = 0;

        for (var i = 0; i < regionList.length; i++) {
            if (regionList[i] === regionName) {
                dataIndex = i;
            }
        }

        console.log("DataIndex: " + dataIndex);

        var xValues = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
        var yValues = [];
        yValues.push(data.Jan2017[dataIndex]);
        yValues.push(data.Feb2017[dataIndex]);
        yValues.push(data.Mar2017[dataIndex]);
        yValues.push(data.Apr2017[dataIndex]);
        yValues.push(data.May2017[dataIndex]);
        yValues.push(data.Jun2017[dataIndex]);
        yValues.push(data.Jul2017[dataIndex]);
        yValues.push(data.Aug2017[dataIndex]);

        var plot_data = {
            "x": xValues,
            "y": yValues,
            "type": "line",
            "opacity": .8,
            "text": yValues,
            "textposition": 'auto',
            "mode": 'lines+markers',
            "name": "'linear'",
            "line": {
                "shape": 'linear',
                "width": 4
            },
            "marker": {
                "color": "#5193e6",
                "line": {
                    "width": 4
                }
            }
        }
        plot_data = [plot_data];


        var layout = {
            margin: {t: 40, b: 20},
            title: regionName,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',

        };

        Plotly.newPlot('lineGraph', plot_data, layout);
    });
}

