var searchButton = d3.select("#search-btn");


// Event handlers for filter button
searchButton.on("click", function () {
});


function fetchProfessions() {
    var url = "/professions";
    d3.json(url).then(function (data) {
        console.log("Data", data);
        // Update drop down list
    });
}

function fetchWagesByProfession(profession) {

    var url = "/wages/" + profession;
    d3.json(url).then(function (data) {
        console.log("Data", data);
        // perform calucations
        // Dispay results
    });
}