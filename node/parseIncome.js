const fs = require('fs-extra');
// const path = require('path');

let jsonPath = './income-json-acs2021_5yr_B19013_86000US14068/acs2021_5yr_B19013_86000US14068.geojson';
//let outputPath = '../income.json';
let outputPath = '../incomeHash.json';

let data = fs.readJsonSync(jsonPath);

// console.log('data', data);

// data {
//   type: 'FeatureCollection',
//   name: 'acs2021_5yr_B19013_86000US14068',
//   crs: {
//     type: 'name',
//     properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
//   },
//   features: [
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },

// "type": "FeatureCollection",
// "name": "acs2021_5yr_B19013_86000US14068",
// "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
// "features": [
// { "type": "Feature", "properties": { "geoid": "04000US36", "name": "New York", "B19013001": 75157.0, "B19013001, Error": 322.0 }, ...
// { "type": "Feature", "properties": { "geoid": "86000US06390", "name": "06390", "B19013001": 46250.0, "B19013001, Error": 6648.0 },  ...
// { "type": "Feature", "properties": { "geoid": "86000US10001", "name": "10001", "B19013001": 101409.0, "B19013001, Error": 11816.0 }, ...

let index = 0;
let incomeNullCount = 0;
let incomeArr = [];
for (let ent of data.features) {
  // console.log(index, 'ent', ent);
  let zipcode = ent.properties.name;
  let income = ent.properties.B19013001;
  // console.log(index, 'zipcode', zipcode, 'income', income);
  incomeArr.push({ zipcode, income });
  index++;
  if (income === null) {
    incomeNullCount++;
  }
}
let incomeHash = {}
for(let item of incomeArr) {
  incomeHash[item.zipcode] = item.income
}

//fs.writeJsonSync(outputPath, incomeArr, { spaces: 2 });
fs.writeJsonSync(outputPath, incomeHash, { spaces: 2 });
//index 1786 incomeNullCount 159
console.log('index', index, 'incomeNullCount', incomeNullCount);
