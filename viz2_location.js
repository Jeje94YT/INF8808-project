function initViz2() {
    // Carte du monde avec bulles
    const mapWidth = 1200;
    const mapHeight = 380;
    
    const mapSvg = d3.select("#mapChart").attr("viewBox", `0 0 ${mapWidth} ${mapHeight}`);
    
    const mapProjection = d3.geoNaturalEarth1()
        .scale(160)
        .translate([mapWidth / 2.1, mapHeight / 1.69]);
        
    const mapPath = d3.geoPath().projection(mapProjection);

    const tooltip = d3.select("body").append("div").style("position", "absolute").style("background", "white").style("border", "1px solid #ccc").style("padding", "6px").style("border-radius", "4px").style("font-size", "12px").style("display", "none").style("z-index", "1000");

    let worldGeoJSON = null;
    let currentDecadeMap = "all";
    let playing = false;
    let playInterval;

    function getCountryCoordinates(countryName) {
        if (!worldGeoJSON || countryName === "Unknown") return null;
        const normalize = name => name.toLowerCase().replace("usa", "united states of america").replace("united states", "united states of america").replace("england", "united kingdom");
        const feature = worldGeoJSON.features.find(f => normalize(f.properties.name).includes(normalize(countryName)) || normalize(countryName).includes(normalize(f.properties.name)));
        return feature ? d3.geoCentroid(feature) : null;
    }

    function updateMapData() {
        let mapFiltered = globalData;
        if (currentDecadeMap !== "all") {
            mapFiltered = mapFiltered.filter(d => d.year >= currentDecadeMap && d.year < currentDecadeMap + 10);
        }

        let mapCounts = d3.rollups(mapFiltered, v => v.length, d => d.country, d => d.war);
        let bubbleData = [];
        
        mapCounts.forEach(countryGroup => {
            const coords = getCountryCoordinates(countryGroup[0]);
            if (coords) {
                countryGroup[1].forEach(warGroup => {
                    bubbleData.push({ country: countryGroup[0], war: warGroup[0], count: warGroup[1], lon: coords[0], lat: coords[1] });
                });
            }
        });

        const rScale = d3.scaleSqrt().domain([0, d3.max(bubbleData, d => d.count) || 1]).range([2, 16]);
        const circles = mapSvg.selectAll("circle.accident-bubble").data(bubbleData, d => d.country + "-" + d.war);

        circles.exit().transition().duration(500).attr("r", 0).remove();

        circles.enter().append("circle").attr("class", "accident-bubble")
            .attr("cx", d => mapProjection([d.lon, d.lat])[0]).attr("cy", d => mapProjection([d.lon, d.lat])[1])
            .attr("fill", d => d.war ? "red" : "blue").attr("opacity", 0.6).attr("r", 0) 
            .on("mouseover", (event, d) => tooltip.style("display", "block").html(`<strong>Pays:</strong> ${d.country}<br><strong>Accidents:</strong> ${d.count}<br><strong>Type:</strong> ${d.war ? "Guerre" : "Civil"}`))
            .on("mousemove", event => tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px"))
            .on("mouseout", () => tooltip.style("display", "none"))
            .merge(circles).transition().duration(500).attr("r", d => rScale(d.count));
    }

    // Timeline des accidents par continent
    const timelineWidth = 1030;
    const timelineHeight = 240;
    const marginTimeline = { top: 20, right: 150, bottom: 40, left: 60 }; 
    
    const svgTimeline = d3.select("#timelineChart").attr("viewBox", `0 0 ${timelineWidth} ${timelineHeight}`);
    
    const tooltipTimeline = d3.select("body").append("div").attr("class", "tooltip-timeline").style("position", "absolute").style("background", "white").style("border", "1px solid #ccc").style("padding", "10px").style("border-radius", "4px").style("font-size", "12px").style("display", "none").style("pointer-events", "none").style("z-index", "1000");

    function drawTimeline() {
        const continents = ["Europe", "North America", "Asia", "South America", "Africa", "Oceania", "Other"];
        const yearsArray = d3.range(1908, 2024);

        const lineData = continents.map(continent => ({
            id: continent,
            values: yearsArray.map(year => ({ year: year, count: globalData.filter(d => d.year === year && d.continent === continent).length }))
        }));

        const xTime = d3.scaleLinear().domain([1908, 2023]).range([marginTimeline.left, timelineWidth - marginTimeline.right]);
        const yTime = d3.scaleLinear().domain([0, d3.max(lineData, c => d3.max(c.values, d => d.count))]).nice().range([timelineHeight - marginTimeline.bottom, marginTimeline.top]);
        const color = d3.scaleOrdinal().domain(continents).range(d3.schemeTableau10);

        svgTimeline.selectAll("*").remove(); 
        
        svgTimeline.append("g")
            .attr("transform", `translate(0,${timelineHeight - marginTimeline.bottom})`)
            .call(d3.axisBottom(xTime).tickFormat(d3.format("d")));
            
        svgTimeline.append("g")
            .attr("transform", `translate(${marginTimeline.left},0)`)
            .call(d3.axisLeft(yTime));

        svgTimeline.append("text")
            .attr("x", (timelineWidth - marginTimeline.right + marginTimeline.left) / 2)
            .attr("y", timelineHeight - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#555")
            .text("Année");

        svgTimeline.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -timelineHeight / 2)
            .attr("y", 20) 
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#555")
            .text("Nombre d'accidents");

        const line = d3.line().x(d => xTime(d.year)).y(d => yTime(d.count)).curve(d3.curveMonotoneX);

        svgTimeline.selectAll(".line").data(lineData).enter().append("path").attr("class", "line").attr("fill", "none").attr("stroke", d => color(d.id)).attr("stroke-width", 2.5).attr("d", d => line(d.values));

        const hoverLine = svgTimeline.append("line")
            .attr("y1", marginTimeline.top).attr("y2", timelineHeight - marginTimeline.bottom)
            .attr("stroke", "#999").attr("stroke-width", 1).attr("stroke-dasharray", "4,4")
            .style("opacity", 0).style("pointer-events", "none");

        const hoverCircles = svgTimeline.selectAll(".hover-circle").data(continents).enter().append("circle")
            .attr("class", "hover-circle").attr("r", 4).attr("fill", d => color(d))
            .style("opacity", 0).style("pointer-events", "none");

        svgTimeline.append("rect").attr("x", marginTimeline.left).attr("y", marginTimeline.top).attr("width", timelineWidth - marginTimeline.left - marginTimeline.right).attr("height", timelineHeight - marginTimeline.top - marginTimeline.bottom).attr("fill", "transparent").attr("pointer-events", "all")
            .on("mousemove", function(event) {
                const [mouseX] = d3.pointer(event, this);
                const hoveredYear = Math.round(xTime.invert(mouseX));
                
                hoverLine.attr("x1", xTime(hoveredYear)).attr("x2", xTime(hoveredYear)).style("opacity", 1);
                hoverCircles.attr("cx", xTime(hoveredYear)).attr("cy", d => {
                    const cData = lineData.find(c => c.id === d);
                    const yData = cData.values.find(v => v.year === hoveredYear);
                    return yTime(yData ? yData.count : 0);
                }).style("opacity", 1);

                let tooltipHtml = `<div style="border-bottom:1px solid #ccc; margin-bottom:5px; padding-bottom:3px;"><strong>Année: ${hoveredYear}</strong></div>`;
                let hasAccidents = false;
                
                const stats = lineData.map(c => {
                    const yearInfo = c.values.find(v => v.year === hoveredYear);
                    return { continent: c.id, count: yearInfo ? yearInfo.count : 0 };
                }).filter(s => s.count > 0).sort((a,b) => b.count - a.count);

                stats.forEach(s => {
                    hasAccidents = true;
                    tooltipHtml += `<div style="display:flex; justify-content:space-between; width: 140px; margin-top:2px;"><span><span style="color:${color(s.continent)}; font-size:1.2em; line-height:0;">■</span> ${s.continent}</span><strong>${s.count}</strong></div>`;
                });

                if (hasAccidents) {
                    tooltipTimeline.style("display", "block").html(tooltipHtml).style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 20) + "px");
                } else {
                    tooltipTimeline.style("display", "none");
                }
            })
            .on("mouseout", () => {
                hoverLine.style("opacity", 0);
                hoverCircles.style("opacity", 0);
                tooltipTimeline.style("display", "none");
            });
    }

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(geoData => {
        worldGeoJSON = geoData;
        mapSvg.selectAll("path").data(worldGeoJSON.features).enter().append("path").attr("d", mapPath).attr("fill", "#eee").attr("stroke", "#999");
        updateMapData();
        drawTimeline();
    });

    d3.select("#btnPlay").on("click", function() {
        if (playing) {
            clearInterval(playInterval);
            playing = false;
            d3.select(this).text("▶ Lecture");
        } else {
            playing = true;
            d3.select(this).text("⏸ Pause");
            if (currentDecadeMap === "all" || currentDecadeMap > 2020) currentDecadeMap = 1910;

            playInterval = setInterval(() => {
                d3.select("#currentDecadeDisplay").text(`Années ${currentDecadeMap}s`);
                updateMapData();
                currentDecadeMap += 10;
                if (currentDecadeMap > 2020) {
                    clearInterval(playInterval);
                    playing = false;
                    d3.select("#btnPlay").text("▶ Lecture");
                    currentDecadeMap = "all";
                    setTimeout(() => {
                        d3.select("#currentDecadeDisplay").text("Toutes les années");
                        updateMapData();
                    }, 2000);
                }
            }, 1500);
        }
    });
}