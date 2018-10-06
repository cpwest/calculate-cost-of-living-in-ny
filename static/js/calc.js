const TAX_RATE_PERCENTAGE = 24;
const RENT_AFFORDABLE_FACTOR = 0.3;

// Method to calculate rent based on income
function getAffordableRent(income) {

    if (income === undefined || income === null) {
        return 0;
    }
    return income * ((100 - TAX_RATE_PERCENTAGE) / 100) * RENT_AFFORDABLE_FACTOR;
}

function getIncomeAfterTax(income) {
    if (income === undefined || income === null) {
        return 0;
    }
    return income * ((100 - TAX_RATE_PERCENTAGE) / 100);
}