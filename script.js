// Dimensions
const width = 900;
const height = 450;

const margin = {
    top: 40,
    right: 40,
    bottom: 50,
    left: 70
};

const svg = d3.select("svg")
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