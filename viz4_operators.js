function initViz4() {    
    const width = 1200;
    const height = 450;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    
    const svgOperator = d3.select("#operatorChart")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("display", "block")
        .style("width", "100%")
        .style("height", "auto");
}