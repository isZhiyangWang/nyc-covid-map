const nyc_data_url = 'https://jht1493.net/COVID-19-Impact/Dashboard/a0/c_data/nyc/c_subs/Brooklyn/c_meta.json'

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
getNewYorkData(nyc_data_url)


//https://github.com/EP-Visual-Design/COVID-19-parsed-data/blob/main/c_data/nyc/c_subs/Brooklyn/c_meta.json
//loadData('https://jht1493.net/COVID-19-Impact/Dashboard/a0/c_data/nyc/c_subs/Brooklyn/c_meta.json')

async function loadData(url) {
    const response = await fetch(url)
    const json = await response.json()
    return json
}

async function makeMap(url) {
    const geojson = await loadData(url)
    //console.log(geojson)
    let path = d3.geoPath()
    let center = path.centroid(geojson)
    let brooklyn_data = geojson.features.filter(d => d.properties.borough === 'Brooklyn')
    console.log(brooklyn_data)
    let brooklyn_geojson = {
        type: 'FeatureCollection',
        features: brooklyn_data
    }
    let center_bk = path.centroid(geojson)
    let projection = d3.geoMercator().scale(140000).center(center).translate([width/2,height/2])//.fitExtent([[50,50],[width-margin[0], height-margin[1]]], geojson)
    // .fitSize([width,height], geojson)
    let geoGenerator = d3.geoPath().projection(projection);
    
    // append paths
    g.selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', geoGenerator);
    // init Zoom-in Zoom-out
    initZoom()
    
}

async function getNewYorkData(url) {
    const data = await loadData(url)
    const current_date = data.c_dates[data.c_dates.length-1]
    console.log(current_date)
}

function initZoom() {
    d3.select('svg').call(zoom)
}

function handleZoom(e) {
    d3.select('svg g')
        .attr('transform', e.transform)
}