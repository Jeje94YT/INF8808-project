function initViz1() {
    const width = 900;
    const height = 450;
    const margin = { top: 40, right: 40, bottom: 50, left: 70 };
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

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        svg.append("text").attr("x", width / 2).attr("y", height - 10).attr("text-anchor", "middle").text("Année");
        svg.append("text").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", 20).attr("text-anchor", "middle").text("Nombre d'accidents");

        const historicalPeriods = [
            { name: "WW1", start: 1914, end: 1919, color: "orange" },
            { name: "WW2", start: 1939, end: 1946, color: "red" }
        ];

        svg.selectAll(".period")
            .data(historicalPeriods).enter().append("rect").attr("class", "period")
            .attr("x", d => x(d.start)).attr("width", d => x(d.end) - x(d.start))
            .attr("y", margin.top).attr("height", height - margin.top - margin.bottom)
            .attr("fill", d => d.color).attr("opacity", 0.15);

        svg.selectAll(".period-label")
            .data(historicalPeriods).enter().append("text")
            .attr("x", d => x((d.start + d.end) / 2)).attr("y", margin.top + 15)
            .attr("text-anchor", "middle").attr("fill", "black").attr("font-size", "12px").text(d => d.name);

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

    const slider = document.getElementById('yearRangeSlider');
    noUiSlider.create(slider, {
        start: selectedRange,
        connect: true,
        range: { min: 1908, max: 2023 },
        step: 1
    });

    slider.noUiSlider.on("update", function(values) {
        selectedRange = values.map(Number);
        d3.select("#yearStart").text(selectedRange[0]);
        d3.select("#yearEnd").text(selectedRange[1]);
        if (globalData.length > 0) updateCharts();
    });

    updateCharts();
}