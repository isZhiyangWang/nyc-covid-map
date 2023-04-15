async function loadData(url) {
    const response = await fetch(url)
    const json = await response.json()
    return json
}

function initZoom() {
    d3.select('#nyc-zipcode-map').call(zoom)
}

function handleZoom(e) {
    d3.select('#nyc-zipcode-map g')
        .attr('transform', e.transform)
}

function makeRegionGeoJson(geojson, regionName) {
    let regionData = geojson.features.filter(d => d.properties.borough === regionName)
    return {
        type: 'FeatureCollection',
        features: regionData
    }
}

function drawRegionLabel(svg, regionName) {
    let bk_bboxes = d3.selectAll(`.path_${regionName}`).nodes()
    let minX = 10000000
    let minY = 10000000
    let maxX = -10000000
    let maxY = -10000000
    //console.log(bk_bboxes)
    for(let item of bk_bboxes) {
        let target_path = item.getBBox()
        minX = Math.min(minX, target_path.x);
        maxX = Math.max(maxX, target_path.x + target_path.width);
        minY = Math.min(minY, target_path.y);
        maxY = Math.max(maxY, target_path.y + target_path.height);
        //console.log(target)
    }
    svg.append('text')
        .attr('x', (minX+maxX)/2)
        .attr('y', (minY+maxY)/2)
        .attr('font-size', 20)
        .attr('text-anchor', 'middle')
        .attr('class', 'labels')
        .attr('id', `label_${regionName}`)
        .attr("fill", "#fff")
        .text(regionName.split('_').join(' '));
}

function keepLabelsOnTop() {
    d3.select('.labels').raise()
}

function makeLegend(zipcode_cases) {
    const highestCases = d3.max(zipcode_cases, d => d.totals[METRIC])
    var data = [{"color":LIGHT_COLOR,"value":0},{"color":INTENSE_COLOR,"value": highestCases}];
    var extent = d3.extent(data, d => d.value);
    const paddingL = 32
    const paddingT = 35
    const width = 320
    const innerWidth = width - paddingL * 2
    const barHeight = 8
    const height = 28

    let svg = d3.select('#legendSvg')

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

    var g = svg.append("g").attr('class', 'legend').attr("transform", "translate(" + paddingL + ","+ paddingT+")");

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
        .style("fill", "#fff")
        .text(`${METRIC} ${raw_or_per100k.value === 'per100k' ? 'per 100K' : 'Total'}`);
}

function focusZipcodePath() {
    const zipcode = zipcode_input.value
    const target_path = d3.select(`#path_${zipcode}`).node()
    if (zipcode && target_path) {
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
    }
}

function clearMap() {
    d3.selectAll('.tooltip').remove()
    d3.selectAll('.zipcode_path').remove()
    d3.select('.legend').remove()
    d3.selectAll('.color_rect_svg').remove()
    d3.select('#rank_ol').remove()
    d3.selectAll('.labels').remove()
}