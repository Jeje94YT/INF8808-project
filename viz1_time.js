function initViz1() {
    const width = 900;
    const height = 450;
    const margin = { top: 40, right: 40, bottom: 50, left: 70 };

    // On garde cette variable pour que la fonction updateCharts() dessine tout par défaut
    let selectedRange = [1908, 2023];

    const svg = d3.select("#lineChart")
        .attr("width", width)
        .attr("height", height);

    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "6px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("display", "none");

    function updateCharts() {
        const filtered = globalData.filter(d => d.year >= selectedRange[0] && d.year <= selectedRange[1]);

        const accidentsPerYear = d3.rollups(
            filtered,
            v => v.length,
            d => d.year
        ).map(d => ({ year: d[0], count: d[1] })).sort((a, b) => a.year - b.year);

        const x = d3.scaleLinear()
            .domain(d3.extent(accidentsPerYear, d => d.year))
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(accidentsPerYear, d => d.count)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        svg.selectAll("*").remove();
        svg.attr("role", "img")
            .attr("aria-label", "Line chart of aviation accidents per year from 1908 to 2023. The chart shows fluctuations over time, with a peak around 1946 and a general decrease in recent decades. Key historical periods such as World War I, World War II, the Jet Age, and COVID-19 are highlighted.");
        svg.append("desc").text(
            "This line chart shows the number of aviation accidents per year from 1908 to 2023. " +
            "The x-axis represents years and the y-axis represents the number of accidents. " +
            "The highest number of accidents occurs around 1946 with 88 accidents. " +
            "Historical periods such as World War I, World War II, the Jet Age, Automation and Avionics, the Modern Safety Era, and COVID-19 are highlighted."
        );
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        svg.append("text").attr("x", width / 2).attr("y", height - 10).attr("text-anchor", "middle").text("Année");
        svg.append("text").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", 20).attr("text-anchor", "middle").text("Nombre d'accidents");

        const historicalPeriods = [
            { name: "WW1", start: 1914, end: 1918, color: "orange" },
            { name: "WW2", start: 1939, end: 1945, color: "red" },
            { name: "Jet Age", start: 1955, end: 1972, color: "blue" },
            { name: "Automation & Avionics", start: 1985, end: 2000, color: "#577590" },
            { name: "Modern Safety Era", start: 2000, end: 2019, color: "#264653" },
            { name: "COVID-19", start: 2020, end: 2022, color: "#9b2226" }
        ];

        svg.selectAll(".period")
            .data(historicalPeriods).enter().append("rect").attr("class", "period")
            .attr("x", d => x(d.start)).attr("width", d => x(d.end) - x(d.start))
            .attr("y", margin.top).attr("height", height - margin.top - margin.bottom)
            .attr("fill", d => d.color).attr("opacity", 0.15);

        svg.selectAll(".period-label")
            .data(historicalPeriods)
            .enter()
            .append("text")
            .attr("x", d => x((d.start + d.end) / 2))
            .attr("y", (d, i) => margin.top + 15 + (i % 2) * 15)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .attr("font-size", "12px")
            .text(d => d.name);
        const line = d3.line().x(d => x(d.year)).y(d => y(d.count)).curve(d3.curveMonotoneX);

        svg.append("path").datum(accidentsPerYear).attr("fill", "none").attr("stroke", "#0077cc").attr("stroke-width", 2).attr("d", line);

        svg.selectAll("circle").data(accidentsPerYear).enter().append("circle")
            .attr("cx", d => x(d.year)).attr("cy", d => y(d.count)).attr("r", 4).attr("fill", "#0077cc")
            .on("mouseover", (event, d) => {
                tooltip.style("display", "block").html(`<strong>Année:</strong> ${d.year}<br><strong>Accidents:</strong> ${d.count}`);
            })
            .on("mousemove", event => tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px"))
            .on("mouseout", () => tooltip.style("display", "none"));


    }

    updateCharts();
}
