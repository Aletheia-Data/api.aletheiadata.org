exports.isNumber = (n) => { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }