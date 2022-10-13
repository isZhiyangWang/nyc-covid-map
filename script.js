// API info
const BASE_URL = 'https://jht1493.net/COVID-19-Impact/Dashboard/a0/c_data/nyc/c_subs/'
const BRONX = 'Bronx'
const BROOKLYN = 'Brooklyn'
const MANHATTAN = 'Manhattan'
const QUEENS = 'Queens'
const STATEN_ISLAND = 'Staten_Island'
const RECENT_DATES_URL = `${BASE_URL}${BROOKLYN}/c_meta.json`

// D3 map info
const width = 800
const height = 800
const margin = [50,50]

const svg = d3.selectAll("#nyc-zipcode-map").attr("viewBox", [0,0,width,height])
                .style("border", "1px solid #000")

const g = svg.append("g").attr("id", "path-group")

let zoom = d3.zoom()
    .scaleExtent([0.5, 2])
    .on('zoom', handleZoom)

makeMap('nyc-zip-code.geojson')



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
    const zipcode_data = await getNewYorkCases(RECENT_DATES_URL)
    let zipcode_data_hash = {}
    zipcode_data.map(obj => {
        const zipcode = obj.c_ref
        const daily = obj.daily
        const totals = obj.totals
        zipcode_data_hash[zipcode] = {zipcode, daily, totals}
    })

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
    // create a tooltip TODO: zoom feature causing tooltip offset distance
    let tooltip = d3.select("#map_container")
        .append("div")
        .style('position', 'absolute')
        .style('display', 'none')
        //.style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    let mouseOver = function(e) {
        const zipcode = e.target.id
        if (zipcode_data_hash[zipcode]) {
            tooltip
                //.style("opacity", 1)
                .style('display', 'block')
            d3.select(this)
                .style("stroke", "black")
                .style("stroke-width", 2)
            // make sure the hovered path don't get covered by other path
            d3.select(this).raise()
        }
      }

    let mouseMove = function(e) {
        const zipcode = e.target.id
        if (zipcode_data_hash[zipcode]) {
            const total_cases = zipcode_data_hash[zipcode].totals.Cases
            tooltip
            .html("The exact value of<br>this cell is: " + total_cases)
            .style("left", e.pageX + 50 + "px")
            .style("top", e.pageY + "px")
            console.log(total_cases)
        }
    }

    let mouseLeave = function(e) {
        tooltip
            .style('display', 'none')
          //.style("opacity", 0)
        d3.select(this)
          .style("stroke", "rgb(157, 49, 49)")
          .style("stroke-width", 1)
          //.style("opacity", 0.8)
      }

    // append paths
    g.selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', geoGenerator)
        .attr('id', d => d.properties.postalCode)
        .style('stroke', 'rgb(157, 49, 49)')
        .style("stroke-width", 1)
        .style("stroke-linejoin", "round")
        .attr('fill', d => {
            const zipcode = d.properties.postalCode
            const current_zipcode_data = zipcode_data_hash[zipcode]
            //if (current_zipcode_data) console.log(current_zipcode_data)
            return current_zipcode_data ? colorScale(current_zipcode_data.totals.Cases) : "grey"  
        })
        .on('mouseover', mouseOver)
        .on('mousemove', mouseMove)
        .on('mouseleave', mouseLeave)
    
    // init Zoom-in Zoom-out
    initZoom()
    
}

// get most recent date's cases data
async function getNewYorkCases(url) {
    const data = await loadData(url)
    const current_date = data.c_dates[data.c_dates.length-1]
    console.log(current_date)

    const bronx_url = `${BASE_URL}${BRONX}/c_days/${current_date}.json`
    const brooklyn_url = `${BASE_URL}${BROOKLYN}/c_days/${current_date}.json`
    const manhattan_url = `${BASE_URL}${MANHATTAN}/c_days/${current_date}.json`
    const queens_url = `${BASE_URL}${QUEENS}/c_days/${current_date}.json`
    const staten_island_url = `${BASE_URL}${STATEN_ISLAND}/c_days/${current_date}.json`

    let ny_cases = await Promise.all([
        loadData(bronx_url),
        loadData(brooklyn_url),
        loadData(manhattan_url),
        loadData(queens_url),
        loadData(staten_island_url)
    ])
    ny_cases = [
        ...ny_cases[0],
        ...ny_cases[1],
        ...ny_cases[2],
        ...ny_cases[3],
        ...ny_cases[4]
    ]
    
    return ny_cases
}

function initZoom() {
    d3.select('svg').call(zoom)
}

function handleZoom(e) {
    d3.select('svg g')
        .attr('transform', e.transform)
}