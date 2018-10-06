var searchButton = d3.select("#search-btn");


function updateRentStats() {

    var div =  d3.select("#affordableRent");
    div.innerHTML = "";
    var innerDiv = div.append("div");
    innerDiv.text(getAffordableRent(income));


    var divIncomeAfterTax =  d3.select("#incomeAfterTax");
    divIncomeAfterTax.innerHTML = "";
    var innerDivIncomeAfterTax = divIncomeAfterTax.append("div");
    innerDivIncomeAfterTax.text(getIncomeAfterTax(income));

}

updateRentStats()


// function fetchWagesByProfession(profession) {
//
//     var url = "/wages/" + profession;
//     d3.json(url).then(function (data) {
//         console.log("Data", data);
//         // perform calucations
//         // Dispay results
//     });
// }