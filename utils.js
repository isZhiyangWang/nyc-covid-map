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
        .text(`${METRIC} per 100K`);
}