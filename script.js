const svg = d3.selectAll("#nyc-zipcode-map").attr("viewBox", [0,0,width,height])
                //.style("border", "1px solid #000")
const path_group = svg.append("g").attr("id", "path-group")
let last_hover_zipcode
let incomeJson
let raceJson;

let zoom = d3.zoom()
    .scaleExtent([0.5, 2])
    .translateExtent([[-100, -100], [width+100, height+100]])
    .on('zoom', handleZoom)

makeMap('nyc-zip-code.geojson')

async function makeMap(url, date_input) {
    const geojson = await loadData(url)
    if (!incomeJson) {
        incomeJson = await loadData('./incomeHash.json')
        console.log(incomeJson)
    }
    if (!raceJson) {
        raceJson = await loadData('./raceHash.json');  // Load the race data
        console.log(raceJson);
    }

    // get each zipcode's data (cases and name)
    console.log('date input_', date_input)
    const { zipcode_cases, zipcode_names } = await getNewYorkData(RECENT_DATES_URL, date_input)
    let zipcode_data_hash = {}
    zipcode_cases.map(obj => {
        const zipcode = obj.c_ref
        const daily = obj.daily
        const totals = obj.totals
        const name  = zipcode_names[zipcode]
        const income = incomeJson[zipcode]
        const raceData = raceJson[zipcode];  // Get race data for the current zipcode
        zipcode_data_hash[zipcode] = {zipcode, name, daily, totals, income, raceData};
    })
    const top_cases = zipcode_cases.sort((a,b)=>b.totals[METRIC]-a.totals[METRIC]).slice(0,15)
    console.log(top_cases)
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

    //let colorScale = d3.scaleLinear().domain([0, d3.max(zipcode_cases, d => d.totals[METRIC])]).range([LIGHT_COLOR, INTENSE_COLOR])
    const highestCases = raw_or_per100k.value === 'per100k' ? maxLegendPer100K : maxLegendRaw
    let colorScale = d3.scaleLinear().domain([0, highestCases]).range([LIGHT_COLOR, INTENSE_COLOR])
    // create a tooltip
    let tooltip = d3.select("#map_container")
        .append("div")
        .style('position', 'absolute')
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("max-width", "200px")
        .style("background", "rgba(0,0,0,.8)")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("pointer-events", "none")
    
    // add Callout
    const callout = d3.select("#callout")
    // callout
    //     .select('.instruction')
    //     .text(()=>"Hover, drag, and zoom on the map to interact")
    d3.selectAll('.instruction')
        .text(()=>"Hover, drag, and zoom on the map to interact")
    d3.selectAll('.callout_zipcode').insert("svg","#callout_zipcode_text").attr('class', 'color_rect_svg callout_zipcode_svg').attr('id', 'callout_zipcode_svg').attr('width', '28px').attr('height', '28px')
        .append('rect')
        .style('transform', 'translateY(4px)')
        // .attr('width', '24px')
        // .attr('height', '24px')
        .attr('fill','none')

    const rank_title = d3.select('#rank_title')
    rank_title.html(`Highest Mortality Zipcodes ${raw_or_per100k.value === 'per100k' ? 'per 100K' : 'Total Deaths'}`)

    let top_ranks = callout
        .append('ol')
        
        .attr('id', 'rank_ol')
        .selectAll('li')
        .data(top_cases)
        .enter()
        .append('li')
        .on('mouseover', () => {
            //callout
            d3.selectAll('.instruction')
                .text(() => 'Click to locate on the map')
            d3.selectAll('.case_num')
                .text(() => '')
            d3.selectAll('#callout_zipcode_svg rect').attr('fill', 'rgba(0, 0, 0, 0)')
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
                .style('stroke', STROKE_LIGHT)
                .style('stroke-width', 3)
            d3.select(`#path_${zipcode}`).raise()
        })
        .on('mouseleave', () => {
            d3.selectAll('.instruction')
                .text(()=>"Hover, drag, and zoom on the map to interact")
            
        })
    // top_ranks.append('svg').attr('class', 'color_rect_svg').attr('id', 'rank_rect')//.attr('width', '18px').attr('height', '18px')
    //     .append('rect')
    //     .style('transform', 'translateY(2px)')
    //     .attr('width', '16px')
    //     .attr('height', '16px')
    //     .style('fill', d => colorScale(d.totals[METRIC]))
    // top_ranks.append('div')
    //     .text(d => {
    //         const zipcode = d.c_ref
    //         const zipcode_name = zipcode_names[zipcode]
    //         let cases = d.totals[METRIC].toLocaleString()
    //         //cases = cases.substring(0, cases.length - 1);
    //         return `${zipcode_name} (${zipcode}): ${cases}`
    //     })
    let showTooltip = function() {

    }



    let mouseOver = function(e) {
        const zipcode = d3.select(this).attr('data-zipcode')
        const path_boro = d3.select(this).node().getAttribute('data-boro')
        last_hover_zipcode = zipcode

        if (zipcode === zipcode_input.value) {
            highlightZipcodeArea(zipcode_data_hash, zipcode, tooltip, this)
        }

        if (!select_boro.value) {
            highlightZipcodeArea(zipcode_data_hash, zipcode, tooltip, this)

            //return
        }
        else if (select_boro.value && path_boro === select_boro.value) {
            highlightZipcodeArea(zipcode_data_hash, zipcode, tooltip, this)
        }
      }

      let mouseMove = function(e) {
        const zipcode = d3.select(this).attr('data-zipcode');
        if (zipcode_data_hash[zipcode]) {
            const total_cases = zipcode_data_hash[zipcode].totals[METRIC];
            const zipcode_name = zipcode_names[zipcode];
            const income = zipcode_data_hash[zipcode].income;
            const raceData = zipcode_data_hash[zipcode].raceData || [];
            const totalPopulation = raceData[0] || 1;  
    
         
            const raceLabels = [
                "Total:", 
                "White", 
                "Black", 
                "Am. Indian/Alaska Native", 
                "Asian", 
                "Hawaiian/Pacific Islander", 
                "Other", 
                "Two+ Races", 
                "Two Races w/ Other", 
                "Two+ Races w/o Other"
            ];
            
    
          
            let raceTable = raceData.length > 0 
                ? `<table><thead><tr><th>Race</th><th>Population</th></tr></thead><tbody>` +
                  raceLabels.slice(1).map((label, i) => {
                      const population = raceData[i + 1] || 0;
                      const percentage = (population / totalPopulation) * 100;  
                      return `
                        <tr>
                            <td>${label}</td>
                            <td style="position: relative; background: linear-gradient(to right, lightblue ${percentage}%, black ${percentage}%);">
                                ${population.toLocaleString()}
                            </td>
                        </tr>`;
                  }).join('') +
                  `</tbody></table>`
                : 'No race data available';
    

                tooltip
                .html(`
                    <b>${zipcode}, ${zipcode_name}</b>  <br>
                    ${METRIC} ${raw_or_per100k.value === "per100k" ?  "per 100K" : "Total"}:
                    ${Math.round(total_cases)} <br>
                    Median Income: $${income.toLocaleString()}<br>
                    <br><b>Race Distribution:</b><br>
                    ${raceTable}
                `)
                .style("left", e.pageX + 50 + "px")
                .style("top", e.pageY + "px")
                .style("width", "400px")  
                .style("max-width", "400px") 
                .style("white-space", "normal")
                .style("overflow-wrap", "break-word"); 
            

    
   
            d3.selectAll('#callout_zipcode_svg rect').attr('fill', colorScale(total_cases))
            d3.selectAll('.name').text(`${zipcode_name} (${zipcode})`)
            d3.selectAll('.case_num').text(`Total ${METRIC} ${raw_or_per100k.value === 'per100k' ? "per 100K" : ""}: ${total_cases}`)

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
        .attr("data-boro", d => d.properties.borough)
        .style('stroke', STROKE_LIGHT)
        .style("stroke-width", 1)
        .style("stroke-linejoin", "round")
        .attr('fill', d => {
            //console.log('fill path', d)
            const zipcode = d.properties.postalCode
            const boro = d.properties.borough
            const current_zipcode_data = zipcode_data_hash[zipcode]
            // if boro is not specified, return color for all available zipcode
            if (!select_boro.value) return current_zipcode_data ? colorScale(current_zipcode_data.totals[METRIC]) : NODATA_COLOR  
            // else color the match boro 
            return select_boro.value === boro && current_zipcode_data ? colorScale(current_zipcode_data.totals[METRIC]) : NODATA_COLOR
            
        })
        .on('mouseover', mouseOver)
        .on('mousemove', mouseMove)
        .on('mouseleave', mouseLeave)
        
        if (zipcode_input.value && zipcode_data_hash[zipcode_input.value]) {
            focusZipcodePath(zipcode_input.value, colorScale(zipcode_data_hash[zipcode_input.value].totals[METRIC]))
        }
        
    
    // show or hide map hover instruction
    svg
        .on('mouseleave', () => {
            d3.selectAll('.instruction')
                .text(() => 'Hover, drag, and zoom on the map to interact')
            d3.selectAll('.case_num')
                .text(() => '')
            d3.selectAll('#callout_zipcode_svg rect').attr('fill', 'rgba(0, 0, 0, 0)')
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
async function getNewYorkData(url, target_date) {
    let data = await loadData(url)
    console.log('date input para', target_date) 
    if(!target_date) {
        // use Brooklyn's data to get most recent date
        console.log(data)
        target_date = data.c_dates[data.c_dates.length-1]
        document.getElementById('date_input').value = target_date
    }

    // check if add a date slider min/max or not 
    if (!dateRange) {
        dateRange = data.c_dates
        dateSlider.max = dateRange.length - 1
        dateSlider.value = dateSlider.max//dateRange.length - 1
        dateOutput.innerText = dateRange[dateSlider.value]
        // set min/max date for date input html element
        date_input.min = dateRange[0]
        date_input.max = dateRange[dateSlider.max]
    }
    
    console.log('current date',target_date)

    const bronx_url = `${BASE_URL}${BRONX}/c_days/${target_date}.json`
    const brooklyn_url = `${BASE_URL}${BROOKLYN}/c_days/${target_date}.json`
    const manhattan_url = `${BASE_URL}${MANHATTAN}/c_days/${target_date}.json`
    const queens_url = `${BASE_URL}${QUEENS}/c_days/${target_date}.json`
    const staten_island_url = `${BASE_URL}${STATEN_ISLAND}/c_days/${target_date}.json`

    let zipcode_population = {}

    let zipcode_json = await Promise.all([
        //loadData(brooklyn_zipcode),
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
    console.log('zipcde_cases (total)', zipcode_cases)
    
    // max of raw totals
    if (!maxLegendRaw) {
        maxLegendRaw = d3.max(zipcode_cases, d => d.totals[METRIC])
    }
    console.log('maxLengendRaw', maxLegendRaw)

    if (raw_or_per100k.value === 'per100k') {
        for (let item of zipcode_cases) {
            let zip = item.c_ref
            let popluation = zipcode_population[zip]
            //console.log('item', item)
            //console.log('before',item.totals[METRIC])
            item.totals[METRIC] = item.totals[METRIC] * (100000/popluation)
            //console.log('after',item.totals[METRIC])
        }
    }

    // per100k max total
    if (!maxLegendPer100K) {
        maxLegendPer100K = d3.max(zipcode_cases, d => d.totals[METRIC])
    }
    console.log('maxLegendPer100k',maxLegendPer100K)

    return { zipcode_cases, zipcode_names }
}

form.addEventListener("submit", (evt) => {
    console.log('submittttt', date_input.value)
    evt.preventDefault()
    clearMap()
    makeMap('nyc-zip-code.geojson', date_input.value)
    console.log('search', zipcode_input.value)

});

// select Raw or per100K data
raw_or_per100k.addEventListener('change', (evt)=> {
    clearMap()
    makeMap('nyc-zip-code.geojson', date_input.value)
    
})

// select borough
select_boro.addEventListener("change", (evt) => {
    clearMap()
    makeMap('nyc-zip-code.geojson', date_input.value)
  });

// date picker
date_input.onchange = function() {
    //console.log(this.value)
    //console.log(dateRange.indexOf(this.value))
    let indexOfDate = dateRange.indexOf(this.value)
    dateSlider.value = indexOfDate
    dateOutput.innerHTML = dateRange[indexOfDate]
    clearMap()
    makeMap('nyc-zip-code.geojson', date_input.value)
}

// date slider
dateSlider.oninput = function() {
    date_input.value = dateRange[this.value];
    dateOutput.innerHTML = dateRange[this.value];
}

dateSlider.onchange = function() {
    clearMap()
    makeMap('nyc-zip-code.geojson', date_input.value)
}
