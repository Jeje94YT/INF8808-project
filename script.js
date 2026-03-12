const data = [10, 20, 30, 40, 50];

const svg = d3.select("svg");

svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d,i) => i * 60)
    .attr("y", d => 400 - d * 5)
    .attr("width", 50)
    .attr("height", d => d * 5)
    .attr("fill", "steelblue");