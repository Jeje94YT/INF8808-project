const VIZ4_DEFAULT_START_YEAR = 1908;
const VIZ4_DEFAULT_END_YEAR = 2023;

function getViz4OperatorType(d) {
  return d.war ? "military" : "commercial";
}

function createViz4CategoryStats() {
  return {
    totalFatalities: 0,
    accidentCount: 0,
    avgFatalities: 0,
    fatalitiesList: [],
  };
}

function createViz4YearRecord(year) {
  return {
    year,
    commercial: createViz4CategoryStats(),
    military: createViz4CategoryStats(),
  };
}

function computeViz4Averages(yearRecord) {
  ["commercial", "military"].forEach((type) => {
    const category = yearRecord[type];
    category.avgFatalities =
      category.accidentCount > 0
        ? category.totalFatalities / category.accidentCount
        : 0;
  });
}

function buildViz4YearlyData(
  data,
  startYear = VIZ4_DEFAULT_START_YEAR,
  endYear = VIZ4_DEFAULT_END_YEAR,
) {
  const yearMap = new Map();

  for (let year = startYear; year <= endYear; year += 1) {
    yearMap.set(year, createViz4YearRecord(year));
  }

  data.forEach((d) => {
    if (d.year < startYear || d.year > endYear) return;
    if (!yearMap.has(d.year)) return;

    const yearRecord = yearMap.get(d.year);
    const type = getViz4OperatorType(d);
    const fatalities = Number.isFinite(d.fatalities) ? d.fatalities : 0;

    yearRecord[type].totalFatalities += fatalities;
    yearRecord[type].accidentCount += 1;
    yearRecord[type].fatalitiesList.push(fatalities);
  });

  return Array.from(yearMap.values())
    .sort((a, b) => a.year - b.year)
    .map((yearRecord) => {
      computeViz4Averages(yearRecord);
      return yearRecord;
    });
}

function buildViz4FlatSeries(yearlyData) {
  const series = [];

  yearlyData.forEach((yearRecord) => {
    ["commercial", "military"].forEach((type) => {
      series.push({
        year: yearRecord.year,
        type,
        totalFatalities: yearRecord[type].totalFatalities,
        accidentCount: yearRecord[type].accidentCount,
        avgFatalities: yearRecord[type].avgFatalities,
        fatalitiesList: yearRecord[type].fatalitiesList,
      });
    });
  });

  return series;
}

function buildViz4EqualSegments(totalFatalities, accidentCount) {
  if (!accidentCount || accidentCount <= 0) return [];

  const segmentValue = totalFatalities / accidentCount;
  return d3.range(accidentCount).map((_, index) => ({
    index,
    value: segmentValue,
  }));
}

function getViz4YearDetail(yearlyData, year) {
  const yearRecord = yearlyData.find((d) => d.year === year);
  if (!yearRecord) return null;

  return {
    year,
    commercial: {
      ...yearRecord.commercial,
      equalSegments: buildViz4EqualSegments(
        yearRecord.commercial.totalFatalities,
        yearRecord.commercial.accidentCount,
      ),
    },
    military: {
      ...yearRecord.military,
      equalSegments: buildViz4EqualSegments(
        yearRecord.military.totalFatalities,
        yearRecord.military.accidentCount,
      ),
    },
  };
}

function initViz4() {
  const width = 1200;
  const height = 450;
  const margin = { top: 50, right: 28, bottom: 55, left: 72 };
  const operatorTypes = ["commercial", "military"];
  const operatorColors = {
    commercial: "#2563eb",
    military: "#f97316",
  };

  const formatTypeLabel = (type) =>
    type === "commercial" ? "Commercial" : "Militaire";

  const svgOperator = d3
    .select("#operatorChart")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("display", "block")
    .style("width", "100%")
    .style("height", "auto");

  svgOperator.selectAll("*").remove();

  d3.selectAll(".tooltip-operator").remove();

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip tooltip-operator")
    .style("display", "none");

  // Base data ready for the rendering phase.
  const yearlyData = buildViz4YearlyData(globalData);
  const flatSeries = buildViz4FlatSeries(yearlyData);

  const xYear = d3
    .scaleBand()
    .domain(yearlyData.map((d) => d.year))
    .range([margin.left, width - margin.right])
    .paddingInner(0.12)
    .paddingOuter(0.02);

  const xType = d3
    .scaleBand()
    .domain(operatorTypes)
    .range([0, xYear.bandwidth()])
    .padding(0.1);

  const yMax = d3.max(flatSeries, (d) => d.totalFatalities) || 1;
  const y = d3
    .scaleLinear()
    .domain([0, yMax * 1.08])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svgOperator
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(xYear)
        .tickValues(
          yearlyData.map((d) => d.year).filter((year) => year % 10 === 0),
        )
        .tickFormat(d3.format("d")),
    );

  svgOperator
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svgOperator
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 12)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Année");

  svgOperator
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Fatalités totales");

  const legend = svgOperator
    .append("g")
    .attr("transform", `translate(${width - 250},${margin.top - 26})`);

  operatorTypes.forEach((type, i) => {
    const item = legend
      .append("g")
      .attr("transform", `translate(${i * 120},0)`);

    item
      .append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", operatorColors[type]);

    item
      .append("text")
      .attr("x", 20)
      .attr("y", 11)
      .style("font-size", "12px")
      .text(formatTypeLabel(type));
  });

  const bars = svgOperator
    .append("g")
    .attr("class", "viz4-bars")
    .selectAll("rect")
    .data(flatSeries)
    .enter()
    .append("rect")
    .attr("class", "viz4-bar")
    .attr("x", (d) => xYear(d.year) + xType(d.type))
    .attr("y", (d) => y(d.totalFatalities))
    .attr("width", xType.bandwidth())
    .attr("height", (d) => y(0) - y(d.totalFatalities))
    .attr("fill", (d) => operatorColors[d.type])
    .attr("opacity", 0.92);

  const annotations = svgOperator
    .append("g")
    .attr("class", "viz4-annotations")
    .selectAll("text")
    .data(flatSeries)
    .enter()
    .append("text")
    .attr("x", (d) => xYear(d.year) + xType(d.type) + xType.bandwidth() / 2)
    .attr("y", (d) => y(d.totalFatalities) - 2)
    .attr("text-anchor", "middle")
    .style("font-size", "7px")
    .style("fill", "#374151")
    .style("pointer-events", "none")
    .style("opacity", (d) => (d.totalFatalities > 0 ? 0.65 : 0))
    .each(function (d) {
      const text = d3.select(this);
      text
        .append("tspan")
        .attr("x", text.attr("x"))
        .text(`N=${d.accidentCount}`);
      text
        .append("tspan")
        .attr("x", text.attr("x"))
        .attr("dy", 8)
        .text(`Avg=${d.avgFatalities.toFixed(1)}`);
    });

  const hoverLayer = svgOperator.append("g").attr("class", "viz4-hover-layer");
  const highlightGroup = hoverLayer.append("g").style("display", "none");
  const segmentGroup = hoverLayer.append("g").attr("class", "viz4-segments");

  highlightGroup
    .append("rect")
    .attr("class", "viz4-year-highlight")
    .attr("y", margin.top)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "#9ca3af")
    .attr("fill-opacity", 0.08)
    .attr("stroke", "#6b7280")
    .attr("stroke-dasharray", "4,4");

  function drawSegmentsForBar(barData) {
    if (
      !barData.accidentCount ||
      barData.accidentCount <= 1 ||
      barData.totalFatalities <= 0
    ) {
      return [];
    }

    const maxSegmentLines = 45;
    const rawIndexes = d3.range(1, barData.accidentCount);
    const step = Math.max(1, Math.ceil(rawIndexes.length / maxSegmentLines));
    const indexes = rawIndexes.filter((_, i) => i % step === 0);

    return indexes.map((idx) => ({
      ...barData,
      idx,
      segmentValue: barData.totalFatalities / barData.accidentCount,
      yValue: (barData.totalFatalities / barData.accidentCount) * idx,
    }));
  }

  function renderYearDetail(year, event) {
    const yearDetail = getViz4YearDetail(yearlyData, year);
    if (!yearDetail) return;

    const xPos = xYear(year);
    highlightGroup
      .style("display", null)
      .select("rect")
      .attr("x", xPos)
      .attr("width", xYear.bandwidth());

    bars.attr("opacity", (d) => (d.year === year ? 1 : 0.24));
    annotations.style("opacity", (d) =>
      d.year === year && d.totalFatalities > 0 ? 1 : 0.1,
    );

    const segmentRows = [];
    operatorTypes.forEach((type) => {
      const yearTypeData = {
        year,
        type,
        totalFatalities: yearDetail[type].totalFatalities,
        accidentCount: yearDetail[type].accidentCount,
      };
      segmentRows.push(...drawSegmentsForBar(yearTypeData));
    });

    const lines = segmentGroup
      .selectAll("line")
      .data(segmentRows, (d) => `${d.year}-${d.type}-${d.idx}`);

    lines.exit().remove();

    lines
      .enter()
      .append("line")
      .merge(lines)
      .attr("x1", (d) => xYear(d.year) + xType(d.type))
      .attr("x2", (d) => xYear(d.year) + xType(d.type) + xType.bandwidth())
      .attr("y1", (d) => y(d.yValue))
      .attr("y2", (d) => y(d.yValue))
      .attr("stroke", "#111827")
      .attr("stroke-width", 0.6)
      .attr("stroke-dasharray", "3,2")
      .attr("opacity", 0.85)
      .style("pointer-events", "none");

    tooltip
      .style("display", "block")
      .html(
        `<strong>Année ${year}</strong><br>` +
          `<span style="color:${operatorColors.commercial}">●</span> Commercial: Total=${yearDetail.commercial.totalFatalities.toFixed(0)}, N=${yearDetail.commercial.accidentCount}, Avg=${yearDetail.commercial.avgFatalities.toFixed(1)}<br>` +
          `<span style="color:${operatorColors.military}">●</span> Militaire: Total=${yearDetail.military.totalFatalities.toFixed(0)}, N=${yearDetail.military.accidentCount}, Avg=${yearDetail.military.avgFatalities.toFixed(1)}`,
      )
      .style("left", `${event.pageX + 12}px`)
      .style("top", `${event.pageY - 24}px`);
  }

  function clearYearDetail() {
    highlightGroup.style("display", "none");
    segmentGroup.selectAll("line").remove();
    bars.attr("opacity", 0.92);
    annotations.style("opacity", (d) => (d.totalFatalities > 0 ? 0.65 : 0));
    tooltip.style("display", "none");
  }

  svgOperator
    .append("g")
    .attr("class", "viz4-year-overlays")
    .selectAll("rect")
    .data(yearlyData)
    .enter()
    .append("rect")
    .attr("x", (d) => xYear(d.year))
    .attr("y", margin.top)
    .attr("width", xYear.bandwidth())
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "transparent")
    .on("mouseenter", function (event, d) {
      renderYearDetail(d.year, event);
    })
    .on("mousemove", function (event, d) {
      renderYearDetail(d.year, event);
    })
    .on("mouseleave", clearYearDetail);

  // Keep a sensible default emphasis to guide the eye before interaction.
  const lastYear = yearlyData[yearlyData.length - 1]?.year;
  if (lastYear) {
    renderYearDetail(lastYear, { pageX: 0, pageY: 0 });
    tooltip.style("display", "none");
  }

  return { yearlyData, flatSeries };
}
