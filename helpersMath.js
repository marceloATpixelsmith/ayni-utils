// js/helpersFormatting.js
window.AyniUtils = window.AyniUtils || {};
window.AyniUtils.math = {
  version: '2025.10.30a',
  toYmd(d){
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
  }
};




const decimalToCents = v => Number(v)*100;        //12.34→1234
const centsToDecimal = c => Number(((Number(c)||0)/100).toFixed(2)); //1234→12.34

function with2Decimals(value)
    {
    return (Number(value??0)).toFixed(2);
    }
