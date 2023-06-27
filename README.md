# nyc-covid-map

## Income data

[income by zipcode](income.json)

```
Data source for income

https://censusreporter.org/data/map/?table=B19013&geo_ids=04000US36,860|04000US36&primary_geo_id=04000US36#column|B19013001,sumlev|860
Median Household Income in the Past 12 Months (In 2021 Inflation-adjusted Dollars)

New York State Searched by Median Household Income at the Zipcode Summary Level

search
  "name": "11239",
  "B19013001": 33736.0 --> $33,736

# node setup

cd node
npm install

# Create income.json from acs2021_5yr_B19013_86000US14068.geojson

node parseIncome.js

```
```
Data source for zipcodes
https://csvjson.com/csv2json
https://gist.github.com/erichurst/7882666
https://www.kaggle.com/datasets/saidakbarp/nyc-zipcode-geodata

Data and Json
nyc-zip-code.geojson
us_zipcode.json

the approach is abandoned due to missing zipcodes in us_zipcode.json
we are going with this algorithm
https://blog.mapbox.com/a-new-algorithm-for-finding-a-visual-center-of-a-polygon-7c77e6492fbc
```
