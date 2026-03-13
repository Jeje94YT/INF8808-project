// Dimensions
const width = 900;
const height = 450;

const margin = {
    top: 40,
    right: 40,
    bottom: 50,
    left: 70
};

const svg = d3.select("#lineChart")
    .attr("width", width)
    .attr("height", height);

const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("display", "none");


// Pour la première visualisation
d3.csv("data/Airplane_Crashes_and_Fatalities_Since_1908_t0_2023.csv").then(data => {
    console.log(data); 

    data.forEach(d => {
        d.year = new Date(d.Date).getFullYear();
    });

    const accidentsPerYear = d3.rollups(
        data,
        v => v.length,
        d => d.year
    ).map(d => ({
        year: d[0],
        count: d[1]
    }))
    .sort((a, b) => a.year - b.year);

    const x = d3.scaleLinear()
        .domain(d3.extent(accidentsPerYear, d => d.year))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(accidentsPerYear, d => d.count)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
            d3.axisBottom(x)
                .tickFormat(d3.format("d"))
        );

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .text("Année");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .text("Nombre d'accidents");

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.count))
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .datum(accidentsPerYear)
        .attr("fill", "none")
        .attr("stroke", "#0077cc")
        .attr("stroke-width", 2)
        .attr("d", line);

    svg.selectAll("circle")
        .data(accidentsPerYear)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.count))
        .attr("r", 4)
        .attr("fill", "#0077cc")

        .on("mouseover", (event, d) => {

            tooltip
                .style("display", "block")
                .html(`
                    <strong>Année:</strong> ${d.year}<br>
                    <strong>Accidents:</strong> ${d.count}
                `);

        })

        .on("mousemove", event => {

            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");

        })

        .on("mouseout", () => {

            tooltip.style("display", "none");

        });

});

// Visualisation #2

const svgMap = d3.select("#mapChart")
    .attr("width", width)
    .attr("height", height / 2);

const projection = d3.geoNaturalEarth1().scale(150).translate([width/2, height/2]);

const mapData = [
    {continent:"Europe", war:false, count:5, lon:10, lat:50},
    {continent:"Europe", war:true, count:2, lon:15, lat:48},
    {continent:"Europe", war:false, count:3, lon:2, lat:46},
    {continent:"Europe", war:true, count:4, lon:20, lat:52},
    {continent:"Europe", war:false, count:2, lon:12, lat:41},
    {continent:"Europe", war:false, count:3, lon:25, lat:60},
    {continent:"North America", war:false, count:8, lon:-95, lat:40},
    {continent:"North America", war:true, count:3, lon:-75, lat:39},
    {continent:"North America", war:false, count:5, lon:-120, lat:35},
    {continent:"North America", war:false, count:4, lon:-90, lat:45},
    {continent:"North America", war:true, count:2, lon:-80, lat:42},
    {continent:"Asia", war:false, count:6, lon:100, lat:35},
    {continent:"Asia", war:true, count:1, lon:120, lat:30},
    {continent:"Asia", war:false, count:4, lon:105, lat:25},
    {continent:"Asia", war:false, count:3, lon:80, lat:28},
    {continent:"Asia", war:true, count:2, lon:130, lat:40},
    {continent:"Asia", war:false, count:5, lon:90, lat:20},
    {continent:"South America", war:false, count:3, lon:-60, lat:-10},
    {continent:"South America", war:false, count:2, lon:-55, lat:-20},
    {continent:"South America", war:false, count:4, lon:-70, lat:-15},
    {continent:"Africa", war:false, count:3, lon:20, lat:0},
    {continent:"Africa", war:false, count:2, lon:25, lat:-10},
    {continent:"Africa", war:true, count:1, lon:30, lat:5},
    {continent:"Oceania", war:false, count:2, lon:135, lat:-25},
    {continent:"Oceania", war:false, count:3, lon:150, lat:-35},
];

function loadMap() {
    const filterGroup = d3.select("#filterGroup").property("value");

    const mapURL = filterGroup === "topography" 
        ? "rajouter lien topographique quand trouvé"
        : "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

    d3.json(mapURL).then(worldData => {
        svgMap.selectAll("path").remove();

        svgMap.selectAll("path")
            .data(worldData.features)
            .enter()
            .append("path")
            .attr("d", d3.geoPath().projection(projection))
            .attr("fill", filterGroup === "topography" ? "#cce5ff" : "#eee")
            .attr("stroke", "#999");

        drawPoints();
    });
}

function drawPoints() {
    const filterWar = d3.select("#filterWar").property("value");


    let filteredData = mapData;

    if(filterWar === "war") filteredData = filteredData.filter(d => d.war);
    if(filterWar === "other") filteredData = filteredData.filter(d => !d.war);

    const circles = svgMap.selectAll("circle")
        .data(filteredData, d => d.lon + "-" + d.lat);

    circles.exit().remove();

    circles
        .attr("cx", d => projection([d.lon, d.lat])[0])
        .attr("cy", d => projection([d.lon, d.lat])[1])
        .attr("r", d => d.count*2)
        .attr("fill", d => d.war ? "red" : "blue")
        .attr("opacity", 0.6);

    circles.enter()
        .append("circle")
        .attr("cx", d => projection([d.lon, d.lat])[0])
        .attr("cy", d => projection([d.lon, d.lat])[1])
        .attr("r", d => d.count*2)
        .attr("fill", d => d.war ? "red" : "blue")
        .attr("opacity", 0.6)
        .on("mouseover", (event,d) => tooltip
            .style("display","block")
            .html(`<strong>Continent:</strong> ${d.continent}<br><strong>Zone:</strong> ${d.zone}<br><strong>Count:</strong> ${d.count}<br><strong>War:</strong> ${d.war}`)
        )
        .on("mousemove", event => tooltip
            .style("left",(event.pageX+10)+"px")
            .style("top",(event.pageY-20)+"px")
        )
        .on("mouseout", () => tooltip.style("display","none"));
}

d3.select("#filterWar").on("change", drawPoints);
d3.select("#filterGroup").on("change", loadMap);

loadMap();

const timelineWidth = 900;
const timelineHeight = 250;
const marginTimeline = { top: 30, right: 40, bottom: 50, left: 60 };

const svgTimeline = d3.select("#timelineChart")
    .attr("width", timelineWidth)
    .attr("height", timelineHeight);

const tooltipTimeline = d3.select("body")
    .append("div")
    .attr("class", "tooltip-timeline")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("display", "none");

// Données inventées
const years = d3.range(1919, 2024);
const stackedData = years.map(year => ({
    year: year,
    Other: Math.floor(Math.random() * 20),
    War: Math.floor(Math.random() * 10)
}));

const keys = ["Other", "War"];
const stackGenerator = d3.stack().keys(keys);
const series = stackGenerator(stackedData);

const x = d3.scaleLinear()
    .domain([1919, 2023])
    .range([marginTimeline.left, timelineWidth - marginTimeline.right]);

const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData, d => d.Other + d.War)])
    .range([timelineHeight - marginTimeline.bottom, marginTimeline.top]);

const color = d3.scaleOrdinal()
    .domain(keys)
    .range(["#0077cc", "#cc0000"]);

// Axes
svgTimeline.append("g")
    .attr("transform", `translate(0,${timelineHeight - marginTimeline.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

svgTimeline.append("g")
    .attr("transform", `translate(${marginTimeline.left},0)`)
    .call(d3.axisLeft(y));

svgTimeline.selectAll("g.layer")
    .data(series)
    .join("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .join("rect")
    .attr("x", d => x(d.data.year) - 5)
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", 10)
    .on("mouseover", (event, d) => {
        tooltipTimeline
            .style("display", "block")
            .html(`<strong>Année:</strong> ${d.data.year}<br>
                   <strong>Other:</strong> ${d.data.Other}<br>
                   <strong>War:</strong> ${d.data.War}`);
    })
    .on("mousemove", event => {
        tooltipTimeline
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => tooltipTimeline.style("display", "none"));