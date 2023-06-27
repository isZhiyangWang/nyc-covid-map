// API info
const BASE_URL = 'https://jht1493.net/COVID-19-Impact/Dashboard/a0/c_data/nyc/c_subs/'

const BRONX = 'Bronx'
const BROOKLYN = 'Brooklyn'
const MANHATTAN = 'Manhattan'
const QUEENS = 'Queens'
const STATEN_ISLAND = 'Staten_Island'
const RECENT_DATES_URL = `${BASE_URL}${BROOKLYN}/c_meta.json`
const METRIC = 'Deaths' // 'Cases'
const brooklyn_zipcode = `${BASE_URL}${BROOKLYN}/c_meta.json`
const bronx_zipcode = `${BASE_URL}${BRONX}/c_meta.json`
const manhattan_zipcode = `${BASE_URL}${MANHATTAN}/c_meta.json`
const queens_zipcode = `${BASE_URL}${QUEENS}/c_meta.json`
const staten_island_zipcode = `${BASE_URL}${STATEN_ISLAND}/c_meta.json`

// D3 map info
const width = 800
const height = 800
const margin = [50,50]
const INTENSE_COLOR = '#AA2222'
const LIGHT_COLOR = '#ECD15B'
const NODATA_COLOR = '#D3D3D3'
const STROKE_LIGHT = '#EAEAEA'
const STROKE_DARK = '#050404'

// HTML elements
const form = document.getElementById('form')
const date_input = document.getElementById('date_input')
const raw_or_per100k = document.getElementById("raw_or_per100k")
const select_boro = document.getElementById("select_boro")
const zipcode_input = document.getElementById('zipcode_input')
let dateRange
const dateSlider = document.getElementById("myRange");
const dateOutput = document.getElementById("demo");
let maxLegend
let maxLegendObj
let maxLegendRaw
let maxLegendPer100K