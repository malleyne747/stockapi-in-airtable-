

/*
function: percent_diff(val1, val2)
pre: two numbers integer or float are fine 
post: calculates the difference in percent between two numbers 
*/

function percent_diff(val1 , val2){ 
return ( (Math.abs(val1-val2))/ ((val1 + val2)/2) )  * 100; }

let table = base.getTable("Stocks"); 
let result  = await table.selectRecordsAsync(); 
let records = result.records;
// add aditional fields here if you want to calculate or grab additional stock data to add to next column ... ***make sure to add to json object built inside loop too ***
let nameField =  table.getField("Name"); 
let clsField = table.getField("Last close"); 
let changeField = table.getField("Change"); 
var greatest_difference = 0;
var greatest_symbol =''; 

let stocks_to_update = []; 
for(let record of records){ // for every record in table .... 
    if(record.getCellValue("Name") == undefined) {continue;} // skip to next record if this item has no value in name field 
    // call api to get updated stock json via api 
    let stockResponse = await fetch("https://financialmodelingprep.com/api/v3/historical-price-full/" + record.getCellValue("Name") + "?timeseries=5", {mode:"cors", headers:{origin:"*"}}); 
    let stockJSON = await stockResponse.json(); 
    if(stockResponse.ok == false || stockJSON.symbol == undefined){output.text("bad stock name given: '"+ record.getCellValue("Name")+ "' please correct" ); continue} // notify user a stock name was incorrect and jump to next record
    //then add the new stock information to an array as: array <[ {id: record, fields:  {[field1.id]: value1, [field2.id], value2 ... ect} } ]>
    stocks_to_update.push({
        id: record.id,
        fields: {
            [nameField.id] : record.getCellValue("Name"), 
            
            [clsField.id] : stockJSON.historical[0].close,
            
            [changeField.id]: percent_diff(stockJSON.historical[0].close, stockJSON.historical[4].close ) /100, // pass first day and fifth day stock closing price to percent diff function to calculate *note:* *divide by 100 to allow airtable to recalculate as percent* 
            //You can add additional fields to be inserted into the table here....                         
        }
    }); 
    // update greatest 5 day percent change found if current is greater than last and update symbol 
    if(greatest_difference <  percent_diff(stockJSON.historical[0].close, stockJSON.historical[4].close )){greatest_difference =  percent_diff(stockJSON.historical[0].close, stockJSON.historical[4].close );greatest_symbol= stockJSON.symbol}  
}
output.text("the total number of stocks updated is: " + stocks_to_update.length); 
output.text(`the stock with the greatest change in difference is: ${greatest_symbol} Calculated as: ${(greatest_difference).toFixed(2)}% five day percent difference!`); 

while(stocks_to_update.length > 0 ){
    await table.updateRecordsAsync(stocks_to_update.slice(0,50)); 
    stocks_to_update = stocks_to_update.slice(50); 
}







