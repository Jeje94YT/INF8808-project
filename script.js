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
// Carte du monde

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

// TimeLine
const timelineWidth = 1300;
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
const years = d3.range(1908, 2023);
const continents = [
    "Europe",
    "North America",
    "Asia",
    "South America",
    "Africa",
    "Oceania"
];

const stackedData = years.map(year => {
    let obj = { year: year };

    continents.forEach(c => {
        obj[c] = Math.floor(Math.random() * 10);
    });

    return obj;
});

const keys = continents;
const stackGenerator = d3.stack().keys(keys);
const series = stackGenerator(stackedData);

const x = d3.scaleBand()
    .domain(stackedData.map(d => d.year))
    .range([marginTimeline.left, timelineWidth - marginTimeline.right])
    .padding(0.1);

const y = d3.scaleLinear()
    .domain([
        0,
        d3.max(stackedData, d =>
            continents.reduce((sum, c) => sum + d[c], 0)
        )
    ])
    .range([timelineHeight - marginTimeline.bottom, marginTimeline.top]);

const color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeTableau10);

svgTimeline.append("g")
    .attr("transform", `translate(0,${timelineHeight - marginTimeline.bottom})`)
    .call(
        d3.axisBottom(x)
            .tickValues(x.domain().filter((d,i)=> !(i%10)))
    )

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
    .attr("x", d => x(d.data.year))
    .attr("width", x.bandwidth())
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", 10)
    .on("mouseover", (event, d) => {

        const continent = d3.select(event.currentTarget.parentNode).datum().key;

        tooltipTimeline
            .style("display", "block")
            .html(`
                <strong>Année:</strong> ${d.data.year}<br>
                <strong>Continent:</strong> ${continent}<br>
                <strong>Accidents:</strong> ${d.data[continent]}
            `);
    })
    .on("mousemove", event => {
        tooltipTimeline
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => tooltipTimeline.style("display", "none"));

// viz 1
const svgDecade = d3.select("#decadeChart")
    .attr("width", 1000)
    .attr("height", 320);
    
d3.csv("data/Airplane_Crashes_and_Fatalities_Since_1908_t0_2023.csv").then(data => {
    data.forEach(d => {
        d.year = new Date(d.Date).getFullYear();
        d.decade = Math.floor(d.year / 10) * 10;
        d.fatalities = +d.Fatalities || 0;
        d.aboard = +d.Aboard || 0;
        d.rate = d.aboard > 0 ? d.fatalities / d.aboard : 0; // filter out invalid data
    });

    const yearlyData = d3.rollups(
        data,
        v => d3.mean(v, d => d.rate),
        d => d.year
    ).map(d => ({
        year: d[0],
        rate: d[1]
    })).sort((a, b) => a.year - b.year);

    const decadeData = d3.rollups(
        data,
        v => d3.mean(v, d => d.fatalities),
        d => d.decade
    ).map(d => ({
        decade: d[0],
        avgFatalities: d[1]
    })).sort((a, b) => a.decade - b.decade);

    const margin = { top: 40, right: 60, bottom: 50, left: 60 };
    const width = 1000;
    const height = 320;

    const x = d3.scaleLinear()
        .domain(d3.extent(yearlyData, d => d.year))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(yearlyData, d => d.rate)])
        .range([height - margin.bottom, margin.top]);

    const tooltipDecade = d3.select("body")
        .append("div")
        .attr("class", "tooltip-decade")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "6px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("display", "none");

    svgDecade.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call( // every 5 years
            d3.axisBottom(x)
                .tickValues(
                    d3.range(
                        d3.min(yearlyData, d => d.year),
                        d3.max(yearlyData, d => d.year) + 1,
                        5
                    )
                )
                .tickFormat(d3.format("d"))
        );

    svgDecade.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

    svgDecade.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .text("Taux de mortalité annuel avec survol par décennie");

    const lineRate = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.rate));

    svgDecade.append("path")
        .datum(yearlyData)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", lineRate);

    svgDecade.selectAll(".dotRate")
        .data(yearlyData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.rate))
        .attr("r", 2)
        .attr("fill", "red");

    const highlightBox = svgDecade.append("rect")
        .attr("y", margin.top)
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", "red")
        .attr("fill-opacity", 0.08)
        .style("display", "none")
        .attr("pointer-events", "none");

    const leftLine = svgDecade.append("line")
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .style("display", "none")
        .attr("pointer-events", "none");

    const rightLine = svgDecade.append("line")
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .style("display", "none")
        .attr("pointer-events", "none");

    const verticalLine = svgDecade.append("line")
        .attr("stroke", "red")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5")
        .style("display", "none")
        .attr("pointer-events", "none");

    svgDecade.append("rect")
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("fill", "transparent")
        .attr("pointer-events", "all")
        .on("mousemove", function(event) {
            const [mouseX] = d3.pointer(event, this);
            const hoveredYear = x.invert(mouseX);

            const closestYear = yearlyData.reduce((prev, curr) =>
                Math.abs(curr.year - hoveredYear) < Math.abs(prev.year - hoveredYear) ? curr : prev
            );

            const hoveredDecade = Math.floor(closestYear.year / 10) * 10;
            const decadeInfo = decadeData.find(d => d.decade === hoveredDecade);

            const minYear = d3.min(yearlyData, d => d.year);
            const maxYear = d3.max(yearlyData, d => d.year);

            const startYear = Math.max(hoveredDecade, minYear);
            const endYear = Math.min(hoveredDecade + 10, maxYear + 1);

            const x0 = x(startYear);
            const x1 = x(endYear);

            highlightBox
                .style("display", null)
                .attr("x", x0)
                .attr("width", x1 - x0);

            leftLine
                .style("display", null)
                .attr("x1", x0)
                .attr("x2", x0);

            rightLine
                .style("display", null)
                .attr("x1", x1)
                .attr("x2", x1);

            verticalLine
                .style("display", null)
                .attr("x1", x(closestYear.year))
                .attr("x2", x(closestYear.year))
                .attr("y1", margin.top)
                .attr("y2", height - margin.bottom);

            tooltipDecade
                .style("display", "block")
                .html(`
                    <strong>Année:</strong> ${closestYear.year}<br>
                    <strong>Taux de mortalité:</strong> ${(closestYear.rate * 100).toFixed(1)}%<br>
                    <strong>Décennie:</strong> ${hoveredDecade}s<br>
                    <strong>Victimes moyennes:</strong> ${decadeInfo ? decadeInfo.avgFatalities.toFixed(1) : "N/A"}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
            highlightBox.style("display", "none");
            leftLine.style("display", "none");
            rightLine.style("display", "none");
            verticalLine.style("display", "none");
            tooltipDecade.style("display", "none");
        });
});

// viz 5

const svgGround = d3.select("#groundChart")
    .attr("width", 1000)
    .attr("height", 320);

svgGround.selectAll("*").remove();

d3.csv("data/Airplane_Crashes_and_Fatalities_Since_1908_t0_2023.csv").then(data => {
    data.forEach(d => {
        d.year = new Date(d.Date).getFullYear();
        d.ground = +d.Ground || 0;
    });

    const yearlyGroundData = d3.rollups(
        data,
        v => d3.sum(v, d => d.ground),
        d => d.year
    ).map(d => ({
        year: d[0],
        groundDeaths: d[1]
    }))
    .filter(d => d.year >= 1908 && d.year <= 2023)
    .sort((a, b) => a.year - b.year);

    const margin = { top: 40, right: 40, bottom: 50, left: 60 };
    const width = 1000;
    const height = 320;

    const x = d3.scaleLinear()
        .domain([1908, 2023])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(yearlyGroundData, d => d.groundDeaths)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    const tooltipGround = d3.select("body")
        .append("div")
        .attr("class", "tooltip-ground")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "6px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("display", "none");

    svgGround.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
            d3.axisBottom(x)
                .tickValues(d3.range(1908, 2024, 5))
                .tickFormat(d3.format("d"))
        );

    svgGround.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svgGround.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .text("Nombre de décès au sol par année");

    const lineGround = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.groundDeaths));

    svgGround.append("path")
        .datum(yearlyGroundData)
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("d", lineGround);

    svgGround.selectAll(".dotGround")
        .data(yearlyGroundData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.groundDeaths))
        .attr("r", 3)
        .attr("fill", "green");

    const verticalLine = svgGround.append("line")
        .attr("stroke", "green")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5")
        .style("display", "none")
        .attr("pointer-events", "none");

    const mouseArea = svgGround.append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", "transparent")
        .attr("pointer-events", "all")
        .on("mousemove", function(event) {
            const [mouseX] = d3.pointer(event, this);
            const hoveredYear = x.invert(mouseX);

            const closest = yearlyGroundData.reduce((prev, curr) =>
                Math.abs(curr.year - hoveredYear) < Math.abs(prev.year - hoveredYear) ? curr : prev
            );

            verticalLine
                .style("display", null)
                .attr("x1", x(closest.year))
                .attr("x2", x(closest.year))
                .attr("y1", margin.top)
                .attr("y2", height - margin.bottom);

            tooltipGround
                .style("display", "block")
                .html(`
                    <strong>Année:</strong> ${closest.year}<br>
                    <strong>Décès au sol:</strong> ${closest.groundDeaths}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
            verticalLine.style("display", "none");
            tooltipGround.style("display", "none");
        });
});