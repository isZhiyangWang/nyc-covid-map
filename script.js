// API info
const BASE_URL = 'https://jht1493.net/COVID-19-Impact/Dashboard/a0/c_data/nyc/c_subs/'
const BRONX = 'Bronx'
const BROOKLYN = 'Brooklyn'
const MANHATTAN = 'Manhattan'
const QUEENS = 'Queens'
const STATEN_ISLAND = 'Staten_Island'
const nyc_data_url = 'https://jht1493.net/COVID-19-Impact/Dashboard/a0/c_data/nyc/c_subs/Brooklyn/c_meta.json'

// D3 map info
const width = 800
const height = 800
const margin = [50,50]

const svg = d3.selectAll("#nyc-zipcode-map").attr("viewBox", [0,0,width,height])
                .style("border", "1px solid #000")

const g = svg.append("g").attr("id", "path-group")

let zoom = d3.zoom()
    .scaleExtent([0.2, 2])
    .on('zoom', handleZoom)

makeMap('nyc-zip-code.geojson')
//getNewYorkData(nyc_data_url)


//https://github.com/EP-Visual-Design/COVID-19-parsed-data/blob/main/c_data/nyc/c_subs/Brooklyn/c_meta.json
//loadData('https://jht1493.net/COVID-19-Impact/Dashboard/a0/c_data/nyc/c_subs/Brooklyn/c_meta.json')

async function loadData(url) {
    const response = await fetch(url)
    const json = await response.json()
    return json
}

async function makeMap(url) {
    const geojson = await loadData(url)
    // get each zipcode's data
    const zipcode_data = await getNewYorkData(nyc_data_url)
    let zipcode_data_hash = {}
    zipcode_data.map(obj => {
        const zipcode = obj.c_ref
        const daily = obj.daily
        const totals = obj.totals
        zipcode_data_hash[zipcode] = {zipcode, daily, totals}
    })
    console.log(zipcode_data)
    //console.log(zipcode_data_hash)
    //console.log(geojson)
    let path = d3.geoPath()
    let center = path.centroid(geojson)
    let brooklyn_data = geojson.features.filter(d => d.properties.borough === 'Brooklyn')
    //console.log(brooklyn_data)
    let brooklyn_geojson = {
        type: 'FeatureCollection',
        features: brooklyn_data
    }
    let center_bk = path.centroid(brooklyn_geojson)
    let projection = d3.geoMercator().scale(140000).center(center).translate([width/2,height/2])//.fitExtent([[50,50],[width-margin[0], height-margin[1]]], geojson)
    // .fitSize([width,height], geojson)
    let geoGenerator = d3.geoPath().projection(projection);

    let colorScale = d3.scaleLinear().domain([0, d3.max(zipcode_data, d => d.totals.Cases)]).range(['#ffffff', "#0000ff"])

    // append paths
    g.selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', geoGenerator)
        .attr('id', d => d.properties.postalCode)
        .attr('fill', d => {
            const zipcode = d.properties.postalCode
            const current_zipcode_data = zipcode_data_hash[zipcode]
            //if (current_zipcode_data) console.log(current_zipcode_data)
            return current_zipcode_data ? colorScale(current_zipcode_data.totals.Cases) : "grey"  
        })
    // init Zoom-in Zoom-out
    initZoom()
    

    
}

async function getNewYorkData(url) {
    const data = await loadData(url)
    const current_date = data.c_dates[data.c_dates.length-1]
    console.log(current_date)
    const current_date_url = `https://jht1493.net/COVID-19-Impact/Dashboard/a0/c_data/nyc/c_subs/Brooklyn/c_days/${current_date}.json`
    const current_date_json = await loadData(current_date_url)
    //console.log(current_date_json)
    return current_date_json
}

function initZoom() {
    d3.select('svg').call(zoom)
}

function handleZoom(e) {
    d3.select('svg g')
        .attr('transform', e.transform)
}