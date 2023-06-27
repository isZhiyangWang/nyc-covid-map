const fs = require('fs-extra');
const polylabel = require('polylabel')

// const path = require('path');

// input 1. node\long_lat\us_zipcode.json
/* 
"10001": {
      "LAT": 40.750633,
      "LNG": -73.997177
    },
*/
// input 2 nyc-zip-code.geojson
/*
data.features = [ 
    { "type": "Feature",
      "id": 0,
      "properties":
                                    { "OBJECTID": 1, "postalCode": "11372", "PO_NAME": "Jackson Heights", "STATE": "NY", "borough": "Queens", "ST_FIPS": "36", "CTY_FIPS": "081", "BLDGpostalCode": 0, "Shape_Leng": 20624.692316500000743, "Shape_Area": 20163283.8744, "@id": "http:\/\/nyc.pediacities.com\/Resource\/PostalCode\/11372" },
      "geometry": { "type": "Polygon", "coordinates": [ [ [ -73.869424572841751, 40.749156870967873 ], [ -73.895071432408557, 40.74646547081214 ], [ -73.896187378678192, 40.748509425180863 ], [ -73.895839541851387, 40.748546875706005 ], [ -73.895252427743955, 40.748306609450232 ], [ -73.896540410855607, 40.750541998143575 ], [ -73.895798686138278, 40.750619721332605 ], [ -73.89652230661433, 40.754388796109019 ], [ -73.87221855882477, 40.756943248067465 ], [ -73.87167992356791, 40.753987174396023 ], [ -73.87207046513889, 40.753862007052042 ], [ -73.869424572841751, 40.749156870967873 ] ] ] } }
]
    */

// sameple output nyc-long-lat.geojson
//  


let jsonPath1 = '../incomeHash.json';
let jsonPath2 = '../nyc-zip-code.geojson';

let outputPath1 = '../nyc-incomeHash.json';
let outputPath2 = '../nyc-long-lat.geojson';

let data1 = fs.readJsonSync(jsonPath1);
let data2 = fs.readJsonSync(jsonPath2)

// filter data1 based on zipcodes in data2[].properties.postalCode
let nycIncome = {};
for(const item of data2.features) {
    let postalCode = item.properties.postalCode;
    console.log('postalCode', postalCode)
    let income = data1[postalCode];
    nycIncome[postalCode] = income;
}

for(const item of data2.features) {
    let geometry = item.geometry
    let p = polylabel(geometry.coordinates, 1.0);
    let long = p[0]
    let lat = p[1]
    item.properties.coordinate = [long, lat]
}

fs.writeJsonSync(outputPath1, nycIncome, { spaces: 2 });
//fs.writeJsonSync(outputPath2, data2, { spaces: 2 });
