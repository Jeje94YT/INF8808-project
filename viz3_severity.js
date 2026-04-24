function initViz3() {
    const width = 1000;
    const height = 320;
    const margin = { top: 40, right: 60, bottom: 50, left: 60 };

    // TAUX DE MORTALITÉ
    const svgDecade = d3.select("#decadeChart").attr("width", width).attr("height", height);
    svgDecade.attr("role", "img")
        .attr("aria-label",
            "Line chart showing annual aviation mortality rate from 1908 to 2023. " +
            "The chart includes an interactive a decade highlight feature that displays average fatalities and mortality rate for the hovered year. "

        );
    const tooltipDecade = d3.select("body").append("div").attr("class", "tooltip-decade").style("position", "absolute").style("background", "white").style("border", "1px solid #ccc").style("padding", "6px").style("border-radius", "4px").style("font-size", "12px").style("display", "none");

    const yearlyData = d3.rollups(globalData, v => d3.mean(v, d => d.rate), d => d.year).map(d => ({ year: d[0], rate: d[1] })).sort((a, b) => a.year - b.year);
    const decadeData = d3.rollups(globalData, v => d3.mean(v, d => d.fatalities), d => Math.floor(d.year / 10) * 10).map(d => ({ decade: d[0], avgFatalities: d[1] })).sort((a, b) => a.decade - b.decade);

    const x = d3.scaleLinear().domain(d3.extent(yearlyData, d => d.year)).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, d3.max(yearlyData, d => d.rate)]).range([height - margin.bottom, margin.top]);

    svgDecade.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickValues(d3.range(d3.min(yearlyData, d => d.year), d3.max(yearlyData, d => d.year) + 1, 5)).tickFormat(d3.format("d")));
    svgDecade.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).tickFormat(d3.format(".0%")));
    svgDecade.append("text").attr("x", width / 2).attr("y", 20).attr("text-anchor", "middle").text("Taux de mortalité annuel avec survol par décennie");

    const lineRate = d3.line().x(d => x(d.year)).y(d => y(d.rate));
    svgDecade.append("path").datum(yearlyData).attr("fill", "none").attr("stroke", "red").attr("stroke-width", 2).attr("d", lineRate);
    svgDecade.selectAll(".dotRate").data(yearlyData).enter().append("circle").attr("cx", d => x(d.year)).attr("cy", d => y(d.rate)).attr("r", 2).attr("fill", "red");

    const highlightBox = svgDecade.append("rect").attr("y", margin.top).attr("height", height - margin.top - margin.bottom).attr("fill", "red").attr("fill-opacity", 0.08).style("display", "none").attr("pointer-events", "none");
    const verticalLine = svgDecade.append("line").attr("stroke", "red").attr("stroke-width", 1).attr("stroke-dasharray", "5,5").style("display", "none").attr("pointer-events", "none");

    svgDecade.append("rect").attr("width", width - margin.left - margin.right).attr("height", height - margin.top - margin.bottom).attr("x", margin.left).attr("y", margin.top).attr("fill", "transparent").attr("pointer-events", "all")
        .on("mousemove", function(event) {
            const [mouseX] = d3.pointer(event, this);
            const hoveredYear = x.invert(mouseX);
            const closestYear = yearlyData.reduce((prev, curr) => Math.abs(curr.year - hoveredYear) < Math.abs(prev.year - hoveredYear) ? curr : prev);
            const hoveredDecade = Math.floor(closestYear.year / 10) * 10;
            const decadeInfo = decadeData.find(d => d.decade === hoveredDecade);
            const startYear = Math.max(hoveredDecade, d3.min(yearlyData, d => d.year));
            const endYear = Math.min(hoveredDecade + 10, d3.max(yearlyData, d => d.year) + 1);

            highlightBox.style("display", null).attr("x", x(startYear)).attr("width", x(endYear) - x(startYear));
            verticalLine.style("display", null).attr("x1", x(closestYear.year)).attr("x2", x(closestYear.year)).attr("y1", margin.top).attr("y2", height - margin.bottom);

            tooltipDecade.style("display", "block")
                .html(`<strong>Année:</strong> ${closestYear.year}<br><strong>Taux de mortalité:</strong> ${(closestYear.rate * 100).toFixed(1)}%<br><strong>Décennie:</strong> ${hoveredDecade}s<br><strong>Victimes moyennes:</strong> ${decadeInfo ? decadeInfo.avgFatalities.toFixed(1) : "N/A"}`)
                .style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
            highlightBox.style("display", "none");
            verticalLine.style("display", "none");
            tooltipDecade.style("display", "none");
        });

    // DÉCÈS AU SOL
    const svgGround = d3.select("#groundChart").attr("width", width).attr("height", height);
    svgGround.selectAll("*").remove();
    svgGround.attr("role", "img")
        .attr("aria-label",
            "Line chart showing the number of ground fatalities caused by aviation accidents per year from 1908 to 2023. " +
            "Values fluctuate over time with occasional spikes, particularly in 2001 due to the September 11 attacks." +
            " The chart includes an interactive feature that displays the exact number of ground fatalities for the hovered year."
        );

    const tooltipGround = d3.select("body").append("div").attr("class", "tooltip-ground").style("position", "absolute").style("background", "white").style("border", "1px solid #ccc").style("padding", "6px").style("border-radius", "4px").style("font-size", "12px").style("display", "none");

    const yearlyGroundData = d3.rollups(globalData, v => d3.sum(v, d => d.ground), d => d.year)
        .map(d => ({ year: d[0], groundDeaths: d[1] })).filter(d => d.year >= 1908 && d.year <= 2023).sort((a, b) => a.year - b.year);

    const xGround = d3.scaleLinear().domain([1908, 2023]).range([margin.left, width - margin.right]);
    const yGround = d3.scaleLinear().domain([0, d3.max(yearlyGroundData, d => d.groundDeaths)]).nice().range([height - margin.bottom, margin.top]);

    svgGround.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(xGround).tickValues(d3.range(1908, 2024, 5)).tickFormat(d3.format("d")));
    svgGround.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(yGround));
    svgGround.append("text").attr("x", width / 2).attr("y", 20).attr("text-anchor", "middle").text("Nombre de décès au sol par année");

    const lineGround = d3.line().x(d => xGround(d.year)).y(d => yGround(d.groundDeaths));
    svgGround.append("path").datum(yearlyGroundData).attr("fill", "none").attr("stroke", "green").attr("stroke-width", 2).attr("d", lineGround);
    svgGround.selectAll(".dotGround").data(yearlyGroundData).enter().append("circle").attr("cx", d => xGround(d.year)).attr("cy", d => yGround(d.groundDeaths)).attr("r", 3).attr("fill", "green");

    const verticalLineGround = svgGround.append("line").attr("stroke", "green").attr("stroke-width", 1).attr("stroke-dasharray", "5,5").style("display", "none").attr("pointer-events", "none");

    svgGround.append("rect").attr("x", margin.left).attr("y", margin.top).attr("width", width - margin.left - margin.right).attr("height", height - margin.top - margin.bottom).attr("fill", "transparent").attr("pointer-events", "all")
        .on("mousemove", function(event) {
            const [mouseX] = d3.pointer(event, this);
            const hoveredYear = xGround.invert(mouseX);
            const closest = yearlyGroundData.reduce((prev, curr) => Math.abs(curr.year - hoveredYear) < Math.abs(prev.year - hoveredYear) ? curr : prev);

            verticalLineGround.style("display", null).attr("x1", xGround(closest.year)).attr("x2", xGround(closest.year)).attr("y1", margin.top).attr("y2", height - margin.bottom);
            tooltipGround.style("display", "block").html(`<strong>Année:</strong> ${closest.year}<br><strong>Décès au sol:</strong> ${closest.groundDeaths}`).style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
            verticalLineGround.style("display", "none");
            tooltipGround.style("display", "none");
        });
}
