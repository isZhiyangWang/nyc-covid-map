const svg = d3.selectAll("#nyc-zipcode-map").attr("viewBox", [0,0,width,height])
                .style("border", "1px solid #000")
const path_group = svg.append("g").attr("id", "path-group")
let last_hover_zipcode

let zoom = d3.zoom()
    .scaleExtent([0.5, 2])
    .on('zoom', handleZoom)

makeMap('nyc-zip-code.geojson')


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
    const top_cases = zipcode_cases.sort((a,b)=>b.totals[METRIC]-a.totals[METRIC]).slice(0,15)
    let path = d3.geoPath()
    let center = path.centroid(geojson)
    let bronx_geojson = makeRegionGeoJson(geojson, BRONX)
    let brooklyn_geojson = makeRegionGeoJson(geojson, BROOKLYN)
    let manhattan_geojson = makeRegionGeoJson(geojson, MANHATTAN)
    let queens_geojson = makeRegionGeoJson(geojson, QUEENS)
    let staten_island_geojson = makeRegionGeoJson(geojson, "Staten Island")
    bk_center = path.centroid(brooklyn_geojson)
    let bounds = path.bounds(brooklyn_geojson)

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
        .text(()=>"Hover, drag, and zoom on the map to interact")
    d3.select('#callout_zipcode').insert("svg","#callout_zipcode_text").attr('class', 'color_rect_svg').attr('id', 'callout_zipcode_svg')//.attr('width', '28px').attr('height', '28px')
        .append('rect')
        .style('transform', 'translateY(4px)')
        // .attr('width', '24px')
        // .attr('height', '24px')
        .attr('fill','none')
    callout.append('h4').attr('id', 'rank_title').text('Highest Mortality per 100K Zipcodes')

    let top_ranks = callout
        .append('ol')
        .attr('id', 'rank_ol')
        .selectAll('li')
        .data(top_cases)
        .enter()
        .append('li')
        .on('mouseover', () => {
            callout
                .select('h2')
                .text(() => 'Click to locate on the map')
            callout.select('h3')
                .text(() => '')
            d3.select('#callout_zipcode_svg rect').attr('fill', 'rgba(0, 0, 0, 0)')
        })
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
        .on('mouseleave', () => {
            callout
                .select('h2')
                .text(()=>"Hover, drag, and zoom on the map to interact")
        })
    top_ranks.append('svg').attr('class', 'color_rect_svg').attr('id', 'rank_rect')//.attr('width', '18px').attr('height', '18px')
        .append('rect')
        .style('transform', 'translateY(2px)')
        .attr('width', '16px')
        .attr('height', '16px')
        .style('fill', d => colorScale(d.totals[METRIC]))
    top_ranks.append('div')
        .text(d => {
            const zipcode = d.c_ref
            const zipcode_name = zipcode_names[zipcode]
            let cases = d.totals[METRIC].toLocaleString()
            cases = cases.substring(0, cases.length - 1);
            return `${zipcode} ${zipcode_name}: ${cases}`
        })

    let mouseOver = function(e) {
        const zipcode = d3.select(this).attr('data-zipcode')
        last_hover_zipcode = zipcode
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
            keepLabelsOnTop()
        }
      }

    let mouseMove = function(e) {
        const zipcode = d3.select(this).attr('data-zipcode')
        if (zipcode_data_hash[zipcode]) {
            const total_cases = zipcode_data_hash[zipcode].totals[METRIC].toLocaleString()
            const zipcode_name = zipcode_names[zipcode]
            last_hover_zipcode = zipcode
            tooltip
                .html(`
                    ${zipcode_name} (${zipcode}) <br>
                    ${METRIC} per 100K:
                    ${total_cases}
                `)
                .style("left", e.pageX + 50 + "px")
                .style("top", e.pageY + "px")
            // update callout
            d3.select('#callout_zipcode_svg rect').attr('fill', colorScale(total_cases))
            d3.select('h2').text(`${zipcode} ${zipcode_name}`)
            d3.select('h3').text(`Total ${METRIC} per 100K: ${total_cases}`)

            keepLabelsOnTop()
        }
    }

    let mouseLeave = function(e) {
        tooltip
          .style("opacity", 0)
      }

    // append paths
    path_group.selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', geoGenerator)
        .attr('data-zipcode', d => d.properties.postalCode)
        .attr('class', d => `zipcode_path path_${d.properties.borough.split(' ').join('_')}`)
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
    
    // show or hide map hover instruction
    svg
        .on('mouseleave', () => {
            callout
                .select('h2')
                .text(() => 'Hover, drag, and zoom on the map to interact')
            callout.select('h3')
                .text(() => '')
            d3.select('#callout_zipcode_svg rect').attr('fill', 'rgba(0, 0, 0, 0)')
            d3.select(`#path_${last_hover_zipcode}`)
                .style("stroke", STROKE_LIGHT)
                .style("stroke-width", 1)
        })

    // make a legend    
    makeLegend(zipcode_cases)

    
    // draw borough label
    drawRegionLabel(path_group, BRONX)
    drawRegionLabel(path_group, BROOKLYN)
    drawRegionLabel(path_group, QUEENS)
    drawRegionLabel(path_group, MANHATTAN)
    drawRegionLabel(path_group, STATEN_ISLAND)

    // init Zoom-in Zoom-out
    initZoom()
}

// get most recent date's cases data
async function getNewYorkData(url) {
    const data = await loadData(url) // use Brooklyn's data to get most recent date
    const current_date = data.c_dates[data.c_dates.length-1]

    const bronx_url = `${BASE_URL}${BRONX}/c_days/${current_date}.json`
    const brooklyn_url = `${BASE_URL}${BROOKLYN}/c_days/${current_date}.json`
    const manhattan_url = `${BASE_URL}${MANHATTAN}/c_days/${current_date}.json`
    const queens_url = `${BASE_URL}${QUEENS}/c_days/${current_date}.json`
    const staten_island_url = `${BASE_URL}${STATEN_ISLAND}/c_days/${current_date}.json`

    let zipcode_population = {}

    let zipcode_json = await Promise.all([
        data,
        loadData(bronx_zipcode),
        loadData(manhattan_zipcode),
        loadData(queens_zipcode),
        loadData(staten_island_zipcode)
    ])
    
    for(let borough of zipcode_json) {
        const regions = borough.c_regions
        for( let zip of regions) {
            zipcode_population[zip.c_ref] = zip.c_people
        }
    }

    let zipcode_names = {
        ...zipcode_json[0].c_sub_captions,
        ...zipcode_json[1].c_sub_captions,
        ...zipcode_json[2].c_sub_captions,
        ...zipcode_json[3].c_sub_captions,
        ...zipcode_json[4].c_sub_captions,
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
    
    for (let item of zipcode_cases) {
        let zip = item.c_ref
        let popluation = zipcode_population[zip]
        item.totals[METRIC] = item.totals[METRIC] * (100000/popluation)
    }

    return { zipcode_cases, zipcode_names }
}



