const decimalToCents = v => Number(v)*100;        //12.34→1234
const centsToDecimal = c => Number(((Number(c)||0)/100).toFixed(2)); //1234→12.34

function with2Decimals(value)
    {
    return (Number(value??0)).toFixed(2);
    }
