// API info
const BASE_URL = 'https://jht1493.net/COVID-19-Impact/Dashboard/a0/c_data/nyc/c_subs/'
const BRONX = 'Bronx'
const BROOKLYN = 'Brooklyn'
const MANHATTAN = 'Manhattan'
const QUEENS = 'Queens'
const STATEN_ISLAND = 'Staten_Island'
const RECENT_DATES_URL = `${BASE_URL}${BROOKLYN}/c_meta.json`
const METRIC = 'Deaths' // 'Cases'

// D3 map info
const width = 800
const height = 800
const margin = [50,50]
const INTENSE_COLOR = '#AA2222'
const LIGHT_COLOR = '#ECD15B'
const NODATA_COLOR = '#D3D3D3'
const STROKE_LIGHT = '#EAEAEA'
const STROKE_DARK = '#050404'


const svg = d3.selectAll("#nyc-zipcode-map").attr("viewBox", [0,0,width,height])
                .style("border", "1px solid #000")

const path_group = svg.append("g").attr("id", "path-group")

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
    // get each zipcode's data (cases and name)
    const { zipcode_cases, zipcode_names } = await getNewYorkData(RECENT_DATES_URL)
    let zipcode_data_hash = {}
    zipcode_cases.map(obj => {
        const zipcode = obj.c_ref
        const daily = obj.daily
        const totals = obj.totals
        const name  = zipcode_names[zipcode]
        zipcode_data_hash[zipcode] = {zipcode, name, daily, totals}
    })
    const top_cases = zipcode_cases.sort((a,b)=>b.totals[METRIC]-a.totals[METRIC]).slice(0,24)
    let path = d3.geoPath()
    let center = path.centroid(geojson)
    let brooklyn_data = geojson.features.filter(d => d.properties.borough === 'Brooklyn')
    //console.log(brooklyn_data)
    let brooklyn_geojson = {
        type: 'FeatureCollection',
        features: brooklyn_data
    }
    let center_bk = path.centroid(brooklyn_geojson)
    let projection = d3.geoMercator().scale(140000)//.center(center).translate([width/2,height/2])
    //.fitSize([width,height], geojson)
    .fitExtent([[20, 20], [width-50, height-50]], geojson);
    let geoGenerator = d3.geoPath().projection(projection);

    let colorScale = d3.scaleLinear().domain([0, d3.max(zipcode_cases, d => d.totals[METRIC])]).range([LIGHT_COLOR, INTENSE_COLOR])
    // create a tooltip
    let tooltip = d3.select("#map_container")
        .append("div")
        .style('position', 'absolute')
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("max-width", "200px")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("pointer-events", "none")
    
    // add Callout
    const callout = d3.select("#callout")
    callout
        .select('h2')
        .text(()=>"Hover on the map to show information")
    d3.select('#callout_zipcode').insert("svg","#callout_zipcode_text").attr('class', 'color_rect_svg').attr('id', 'callout_zipcode_svg').attr('width', '28px').attr('height', '28px')
        .append('rect')
        .style('transform', 'translateY(4px)')
        .attr('width', '24px')
        .attr('height', '24px')
        .attr('fill','none')
    callout.append('h4').attr('id', 'rank_title').text('Top 10 Ranked Zipcodes')

    let top_ranks = callout
        .append('ol')
        .attr('id', 'rank_ol')
        .selectAll('li')
        .data(top_cases)
        .enter()
        .append('li')
        .on('click', e => {
            const zipcode = d3.select(e.target).datum().c_ref
            const target_path = d3.select(`#path_${zipcode}`).node()
            // use the native SVG interface to get the bounding box
            let bbox = target_path.getBBox();
            d3.select('#nyc-zipcode-map g')
                .transition()
                .duration(1000)
		        .call(zoom.translateTo, bbox.x + bbox.width/2,  bbox.y + bbox.height/2)
            d3.selectAll('.zipcode_path')
                .style('stroke', STROKE_LIGHT)
                .style('stroke-width', 1)
            d3.select(`#path_${zipcode}`)
                .style('stroke', STROKE_DARK)
                .style('stroke-width', 3)
            d3.select(`#path_${zipcode}`).raise()
        })
    top_ranks.append('svg').attr('class', 'color_rect_svg').attr('id', 'rank_rect').attr('width', '18px').attr('height', '18px')
        .append('rect')
        .style('transform', 'translateY(2px)')
        .attr('width', '16px')
        .attr('height', '16px')
        .style('fill', d => colorScale(d.totals[METRIC]))
    top_ranks.append('div')
        .text(d => {
            const zipcode = d.c_ref
            const zipcode_name = zipcode_names[zipcode]
            const cases = d.totals[METRIC].toLocaleString()
            return `${zipcode} ${zipcode_name}: ${cases}`
        })

    let mouseOver = function(e) {
        const zipcode = d3.select(this).attr('data-zipcode')
        // make sure other paths are reset after click top rank
        d3.selectAll('.zipcode_path')
                .style('stroke', STROKE_LIGHT)
                .style('stroke-width', 1)
        if (zipcode_data_hash[zipcode]) {
            tooltip
                .style("opacity", 1)
            d3.select(this)
                .style("stroke", STROKE_DARK)
                .style("stroke-width", 3)
            // make sure the hovered path don't get covered by other path
            d3.select(this).raise()
        }
      }

    let mouseMove = function(e) {
        const zipcode = d3.select(this).attr('data-zipcode')
        if (zipcode_data_hash[zipcode]) {
            const total_cases = zipcode_data_hash[zipcode].totals[METRIC].toLocaleString()
            const zipcode_name = zipcode_names[zipcode]
            tooltip
                .html(`
                    ${zipcode_name} (${zipcode}) <br>
                    Total ${METRIC}:
                    ${total_cases}
                `)
                .style("left", e.pageX + 50 + "px")
                .style("top", e.pageY + "px")
            // update callout
            d3.select('#callout_zipcode_svg rect').attr('fill', colorScale(total_cases))
            d3.select('h2').text(`${zipcode} ${zipcode_name}`)
            d3.select('h3').text(`Total ${METRIC}: ${total_cases}`)
        }
    }

    let mouseLeave = function(e) {
        tooltip
          .style("opacity", 0)
        d3.select(this)
          .style("stroke", STROKE_LIGHT)
          .style("stroke-width", 1)
      }

    // append paths
    path_group.selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', geoGenerator)
        .attr('data-zipcode', d => d.properties.postalCode)
        .attr('class', 'zipcode_path')
        .attr('id', d =>  'path_' + d.properties.postalCode)
        .style('stroke', STROKE_LIGHT)
        .style("stroke-width", 1)
        .style("stroke-linejoin", "round")
        .attr('fill', d => {
            const zipcode = d.properties.postalCode
            const current_zipcode_data = zipcode_data_hash[zipcode]
            //if (current_zipcode_data) console.log(current_zipcode_data)
            return current_zipcode_data ? colorScale(current_zipcode_data.totals[METRIC]) : NODATA_COLOR  
        })
        .on('mouseover', mouseOver)
        .on('mousemove', mouseMove)
        .on('mouseleave', mouseLeave)

    // make a legend    
    makeLegend(zipcode_cases)
    
    // init Zoom-in Zoom-out
    initZoom()
}

// get most recent date's cases data
async function getNewYorkData(url) {
    const data = await loadData(url)
    const current_date = data.c_dates[data.c_dates.length-1]

    const bronx_zipcode = `${BASE_URL}${BRONX}/c_meta.json`
    const manhattan_zipcode = `${BASE_URL}${MANHATTAN}/c_meta.json`
    const queens_zipcode = `${BASE_URL}${QUEENS}/c_meta.json`
    const staten_island_zipcode = `${BASE_URL}${STATEN_ISLAND}/c_meta.json`

    const bronx_url = `${BASE_URL}${BRONX}/c_days/${current_date}.json`
    const brooklyn_url = `${BASE_URL}${BROOKLYN}/c_days/${current_date}.json`
    const manhattan_url = `${BASE_URL}${MANHATTAN}/c_days/${current_date}.json`
    const queens_url = `${BASE_URL}${QUEENS}/c_days/${current_date}.json`
    const staten_island_url = `${BASE_URL}${STATEN_ISLAND}/c_days/${current_date}.json`

    let zipcode_names = await Promise.all([
        loadData(bronx_zipcode).then(json => json.c_sub_captions),
        loadData(manhattan_zipcode).then(json => json.c_sub_captions),
        loadData(queens_zipcode).then(json => json.c_sub_captions),
        loadData(staten_island_zipcode).then(json => json.c_sub_captions)
    ])
    zipcode_names = {
        ...data.c_sub_captions,
        ...zipcode_names[0],
        ...zipcode_names[1],
        ...zipcode_names[2],
        ...zipcode_names[3]
    }

    let zipcode_cases = await Promise.all([
        loadData(bronx_url),
        loadData(brooklyn_url),
        loadData(manhattan_url),
        loadData(queens_url),
        loadData(staten_island_url)
    ])
    zipcode_cases = [
        ...zipcode_cases[0],
        ...zipcode_cases[1],
        ...zipcode_cases[2],
        ...zipcode_cases[3],
        ...zipcode_cases[4]
    ]
    
    return { zipcode_cases, zipcode_names }
}

function makeLegend(zipcode_cases) {
    const highestCases = d3.max(zipcode_cases, d => d.totals[METRIC])
    var data = [{"color":LIGHT_COLOR,"value":0},{"color":INTENSE_COLOR,"value": highestCases}];
    var extent = d3.extent(data, d => d.value);
    const paddingL = 10
    const paddingT = 35
    const width = 320
    const innerWidth = width - paddingL * 2
    const barHeight = 8
    const height = 28

    let svg = d3.select('#nyc-zipcode-map')

    var xScale = d3.scaleLinear()
        .range([0, innerWidth])
        .domain(extent);

    var xTicks = [
        0,
        Math.floor(highestCases/6),
        Math.floor(highestCases/6 * 2),
        Math.floor(highestCases/6 * 3),
        Math.floor(highestCases/6 * 4),
        Math.floor(highestCases/6 * 5),
        highestCases
    ]
    
    var xAxis = d3.axisBottom(xScale)
        .tickSize(barHeight * 2)
        .tickValues(xTicks);

    var g = svg.append("g").attr("transform", "translate(" + paddingL + ","+ paddingT+")");

    let defs = d3.select('#nyc-zipcode-map').append('defs')
    var linearGradient = defs.append("linearGradient").attr("id", "myGradient");
    linearGradient.selectAll("stop")
        .data(data)
      .enter().append("stop")
        .attr("offset", d => ((d.value - extent[0]) / (extent[1] - extent[0]) * 100) + "%")
        .attr("stop-color", d => d.color);

    g.append("rect")
        .attr("width", innerWidth)
        .attr("height", barHeight)
        .style("fill", "url(#myGradient)");

    g.append("g")
        .call(xAxis)
        .select(".domain").remove();

    g.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .style("text-anchor", "left")
        .text(`Total ${METRIC}`);
}

function initZoom() {
    d3.select('#nyc-zipcode-map').call(zoom)
}

function handleZoom(e) {
    d3.select('#nyc-zipcode-map g')
        .attr('transform', e.transform)
}