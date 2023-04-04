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
