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

  const getTickStep = (startYear, endYear) => {
    const span = endYear - startYear + 1;
    if (span <= 20) return 1;
    if (span <= 40) return 2;
    if (span <= 80) return 5;
    return 10;
  };

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

  const yearlyData = buildViz4YearlyData(globalData);
  const yearSpan = VIZ4_DEFAULT_END_YEAR - VIZ4_DEFAULT_START_YEAR;
  let analyzedYear = VIZ4_DEFAULT_END_YEAR;
  let yearsBefore = 15;
  let yearsAfter = 15;
  let normalMode = true;
  let compareMode = false;
  let compareYearA = VIZ4_DEFAULT_END_YEAR;
  let compareYearB = Math.max(
    VIZ4_DEFAULT_START_YEAR,
    VIZ4_DEFAULT_END_YEAR - 20,
  );

  const chartContainerNode = svgOperator.node().parentNode;
  const chartContainer = d3.select(chartContainerNode);
  chartContainer
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "stretch");
  chartContainer.selectAll(".viz4-controls").remove();
  chartContainer.selectAll(".viz4-compare-panel").remove();

  const controls = chartContainer
    .insert("div", "svg")
    .attr("class", "viz4-controls")
    .style("margin", "4px 0 18px 0")
    .style("padding", "10px 12px")
    .style("border", "1px solid #e5e7eb")
    .style("border-radius", "8px")
    .style("background", "#f9fafb");

  const titleRow = controls
    .append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("justify-content", "flex-start")
    .style("gap", "10px")
    .style("margin-bottom", "8px");

  const titleLeft = titleRow
    .append("div")
    .style("display", "inline-flex")
    .style("align-items", "center")
    .style("gap", "8px");

  const normalToggleLabel = titleLeft
    .append("label")
    .style("display", "inline-flex")
    .style("align-items", "center")
    .style("font-size", "12px")
    .style("color", "#111827")
    .style("font-weight", "bold")
    .attr("title", "Activer ou désactiver le mode normal");

  const normalToggleInput = normalToggleLabel
    .append("input")
    .attr("type", "checkbox")
    .property("checked", normalMode);

  titleLeft
    .append("div")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("color", "#111827")
    .text("Fenêtre temporelle autour d'une année analysée");

  const focusText = controls
    .append("div")
    .style("font-size", "12px")
    .style("color", "#374151")
    .style("margin-bottom", "10px");

  const analyzedYearLabel = controls
    .append("div")
    .style("font-size", "12px")
    .style("color", "#111827")
    .style("margin", "4px 0")
    .text("Année analysée");

  const analyzedYearSliderHost = controls
    .append("div")
    .attr("class", "viz4-focus-year-slider")
    .style("margin", "4px 6px 12px 6px");

  const yearsAroundLabel = controls
    .append("div")
    .style("font-size", "12px")
    .style("color", "#111827")
    .style("margin", "4px 0")
    .text("Nombre d'années avant/après");

  const yearsInputsRow = controls
    .append("div")
    .style("display", "flex")
    .style("gap", "10px")
    .style("align-items", "center")
    .style("margin", "4px 0 8px 0");

  const yearsBeforeLabel = yearsInputsRow
    .append("label")
    .style("font-size", "12px")
    .style("color", "#111827")
    .text("Avant:");

  const yearsBeforeInput = yearsBeforeLabel
    .append("input")
    .attr("type", "number")
    .attr("min", 0)
    .attr("max", yearSpan)
    .attr("step", 1)
    .style("margin-left", "6px")
    .style("width", "72px")
    .property("value", yearsBefore);

  const yearsAfterLabel = yearsInputsRow
    .append("label")
    .style("font-size", "12px")
    .style("color", "#111827")
    .text("Après:");

  const yearsAfterInput = yearsAfterLabel
    .append("input")
    .attr("type", "number")
    .attr("min", 0)
    .attr("max", yearSpan)
    .attr("step", 1)
    .style("margin-left", "6px")
    .style("width", "72px")
    .property("value", yearsAfter);

  const compareControls = controls
    .append("div")
    .style("margin-top", "8px")
    .style("padding-top", "8px")
    .style("border-top", "1px dashed #d1d5db");

  const compareToggleLabel = compareControls
    .append("label")
    .style("display", "inline-flex")
    .style("align-items", "center")
    .style("gap", "8px")
    .style("font-size", "12px")
    .style("color", "#111827")
    .style("font-weight", "bold");

  const compareToggleInput = compareToggleLabel
    .append("input")
    .attr("type", "checkbox")
    .property("checked", compareMode);

  compareToggleLabel.append("span").text("Comparaison entre 2 années");

  const compareYearsRow = compareControls
    .append("div")
    .style("display", "flex")
    .style("gap", "10px")
    .style("align-items", "center")
    .style("margin", "8px 0 2px 0");

  const compareYearALabel = compareYearsRow
    .append("label")
    .style("font-size", "12px")
    .style("color", "#111827")
    .text("Année A:");

  const compareYearAInput = compareYearALabel
    .append("input")
    .attr("type", "number")
    .attr("min", VIZ4_DEFAULT_START_YEAR)
    .attr("max", VIZ4_DEFAULT_END_YEAR)
    .attr("step", 1)
    .style("margin-left", "6px")
    .style("width", "80px")
    .property("value", compareYearA)
    .property("disabled", !compareMode);

  const compareYearBLabel = compareYearsRow
    .append("label")
    .style("font-size", "12px")
    .style("color", "#111827")
    .text("Année B:");

  const compareYearBInput = compareYearBLabel
    .append("input")
    .attr("type", "number")
    .attr("min", VIZ4_DEFAULT_START_YEAR)
    .attr("max", VIZ4_DEFAULT_END_YEAR)
    .attr("step", 1)
    .style("margin-left", "6px")
    .style("width", "80px")
    .property("value", compareYearB)
    .property("disabled", !compareMode);

  const comparePanel = chartContainer
    .append("div")
    .attr("class", "viz4-compare-panel")
    .style("display", "none")
    .style("margin", "14px 0 0 0")
    .style("padding", "12px")
    .style("width", "100%")
    .style("box-sizing", "border-box")
    .style("border", "1px solid #e5e7eb")
    .style("border-radius", "8px")
    .style("background", "#ffffff");

  const compareTitle = comparePanel
    .append("div")
    .style("font-size", "13px")
    .style("font-weight", "bold")
    .style("color", "#111827")
    .style("margin-bottom", "8px");

  const compareSvg = comparePanel
    .append("svg")
    .attr("viewBox", "0 0 1200 360")
    .style("display", "block")
    .style("width", "100%")
    .style("height", "auto");

  function sanitizeWindowValue(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(yearSpan, Math.round(value)));
  }

  function sanitizeYearValue(value) {
    if (!Number.isFinite(value)) return VIZ4_DEFAULT_START_YEAR;
    return Math.max(
      VIZ4_DEFAULT_START_YEAR,
      Math.min(VIZ4_DEFAULT_END_YEAR, Math.round(value)),
    );
  }

  function clampRangeFromFocus(focusYear, beforeYears, afterYears) {
    const startYear = Math.max(
      VIZ4_DEFAULT_START_YEAR,
      focusYear - beforeYears,
    );
    const endYear = Math.min(VIZ4_DEFAULT_END_YEAR, focusYear + afterYears);
    return [startYear, endYear];
  }

  function getDynamicWindowBounds(focusYear) {
    return {
      maxBefore: Math.max(0, focusYear - VIZ4_DEFAULT_START_YEAR),
      maxAfter: Math.max(0, VIZ4_DEFAULT_END_YEAR - focusYear),
    };
  }

  function syncWindowBounds(focusYear) {
    const { maxBefore, maxAfter } = getDynamicWindowBounds(focusYear);

    yearsBeforeInput.attr("max", maxBefore);
    yearsAfterInput.attr("max", maxAfter);

    yearsBefore = Math.min(yearsBefore, maxBefore);
    yearsAfter = Math.min(yearsAfter, maxAfter);

    yearsBeforeInput.property("value", yearsBefore);
    yearsAfterInput.property("value", yearsAfter);
  }

  function updateFocusText(
    focusYear,
    beforeYears,
    afterYears,
    startYear,
    endYear,
  ) {
    analyzedYearLabel.text(`Année analysée: ${focusYear}`);
    yearsAroundLabel.text(
      `Fenêtre personnalisée: ${beforeYears} an(s) avant, ${afterYears} an(s) après`,
    );
    focusText.text(`Vue affichée: ${startYear} - ${endYear}`);
  }

  function renderRange(startYear, endYear) {
    if (!normalMode) {
      svgOperator.selectAll("*").remove();
      svgOperator.style("display", "none");
      return;
    }

    svgOperator.style("display", "block");

    const filteredYearlyData = yearlyData.filter(
      (d) => d.year >= startYear && d.year <= endYear,
    );
    const flatSeries = buildViz4FlatSeries(filteredYearlyData);

    svgOperator.selectAll("*").remove();

    if (filteredYearlyData.length === 0) {
      svgOperator
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#6b7280")
        .text("Aucune donnée pour cette plage d'années.");
      return;
    }

    const xYear = d3
      .scaleBand()
      .domain(filteredYearlyData.map((d) => d.year))
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

    const tickStep = getTickStep(startYear, endYear);
    const tickValues = filteredYearlyData
      .map((d) => d.year)
      .filter(
        (year) =>
          year === startYear ||
          year === endYear ||
          (year - startYear) % tickStep === 0,
      );

    svgOperator
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3.axisBottom(xYear).tickValues(tickValues).tickFormat(d3.format("d")),
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
      .attr("y", (d) => y(d.totalFatalities) - 12)
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

    const hoverLayer = svgOperator
      .append("g")
      .attr("class", "viz4-hover-layer");
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
      const accidents = (barData.fatalitiesList || [])
        .filter((value) => Number.isFinite(value) && value > 0)
        .sort((a, b) => b - a);

      if (accidents.length <= 1 || barData.totalFatalities <= 0) {
        return [];
      }

      let cumulative = 0;
      const segmentLines = [];
      for (let i = 0; i < accidents.length - 1; i += 1) {
        cumulative += accidents[i];
        segmentLines.push({
          ...barData,
          idx: i,
          yValue: cumulative,
        });
      }

      return segmentLines;
    }

    function renderYearDetail(year, event) {
      const yearDetail = getViz4YearDetail(filteredYearlyData, year);
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
          fatalitiesList: yearDetail[type].fatalitiesList,
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
      .data(filteredYearlyData)
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

    const lastYear = filteredYearlyData[filteredYearlyData.length - 1]?.year;
    if (lastYear) {
      renderYearDetail(lastYear, { pageX: 0, pageY: 0 });
      tooltip.style("display", "none");
    }
  }

  function renderComparePanel() {
    compareYearA = sanitizeYearValue(+compareYearAInput.property("value"));
    compareYearB = sanitizeYearValue(+compareYearBInput.property("value"));
    compareYearAInput.property("value", compareYearA);
    compareYearBInput.property("value", compareYearB);

    if (!compareMode) {
      comparePanel.style("display", "none");
      compareSvg.selectAll("*").remove();
      return;
    }

    comparePanel.style("display", "block");
    compareTitle.text(`Comparaison ${compareYearA} vs ${compareYearB}`);
    compareSvg.selectAll("*").remove();

    const yearAData =
      yearlyData.find((d) => d.year === compareYearA) ||
      createViz4YearRecord(compareYearA);
    const yearBData =
      yearlyData.find((d) => d.year === compareYearB) ||
      createViz4YearRecord(compareYearB);

    const compareYears = [compareYearA, compareYearB];
    const rows = [
      {
        year: compareYearA,
        type: "commercial",
        totalFatalities: yearAData.commercial.totalFatalities,
        accidentCount: yearAData.commercial.accidentCount,
        avgFatalities: yearAData.commercial.avgFatalities,
        fatalitiesList: yearAData.commercial.fatalitiesList,
      },
      {
        year: compareYearA,
        type: "military",
        totalFatalities: yearAData.military.totalFatalities,
        accidentCount: yearAData.military.accidentCount,
        avgFatalities: yearAData.military.avgFatalities,
        fatalitiesList: yearAData.military.fatalitiesList,
      },
      {
        year: compareYearB,
        type: "commercial",
        totalFatalities: yearBData.commercial.totalFatalities,
        accidentCount: yearBData.commercial.accidentCount,
        avgFatalities: yearBData.commercial.avgFatalities,
        fatalitiesList: yearBData.commercial.fatalitiesList,
      },
      {
        year: compareYearB,
        type: "military",
        totalFatalities: yearBData.military.totalFatalities,
        accidentCount: yearBData.military.accidentCount,
        avgFatalities: yearBData.military.avgFatalities,
        fatalitiesList: yearBData.military.fatalitiesList,
      },
    ];

    const cWidth = 1200;
    const cHeight = 360;
    const cMargin = { top: 30, right: 30, bottom: 55, left: 70 };

    const xYear = d3
      .scaleBand()
      .domain(compareYears)
      .range([cMargin.left, cWidth - cMargin.right])
      .paddingInner(0.25)
      .paddingOuter(0.12);

    const xType = d3
      .scaleBand()
      .domain(operatorTypes)
      .range([0, xYear.bandwidth()])
      .padding(0.16);

    const yMax = d3.max(rows, (d) => d.totalFatalities) || 1;
    const y = d3
      .scaleLinear()
      .domain([0, yMax * 1.12])
      .nice()
      .range([cHeight - cMargin.bottom, cMargin.top]);

    compareSvg
      .append("g")
      .attr("transform", `translate(0,${cHeight - cMargin.bottom})`)
      .call(d3.axisBottom(xYear).tickFormat(d3.format("d")));

    compareSvg
      .append("g")
      .attr("transform", `translate(${cMargin.left},0)`)
      .call(d3.axisLeft(y));

    compareSvg
      .append("text")
      .attr("x", cWidth / 2)
      .attr("y", cHeight - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Années comparées");

    compareSvg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -cHeight / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Fatalités totales");

    compareSvg
      .append("g")
      .selectAll("rect")
      .data(rows)
      .enter()
      .append("rect")
      .attr("x", (d) => xYear(d.year) + xType(d.type))
      .attr("y", (d) => y(d.totalFatalities))
      .attr("width", xType.bandwidth())
      .attr("height", (d) => y(0) - y(d.totalFatalities))
      .attr("fill", (d) => operatorColors[d.type])
      .attr("opacity", 0.92);

    function buildRealAccidentSegments(row) {
      const accidents = (row.fatalitiesList || [])
        .filter((value) => Number.isFinite(value) && value > 0)
        .sort((a, b) => b - a);

      if (accidents.length <= 1 || row.totalFatalities <= 0) return [];

      let cumulative = 0;
      const segmentLines = [];
      for (let i = 0; i < accidents.length - 1; i += 1) {
        cumulative += accidents[i];
        segmentLines.push({
          year: row.year,
          type: row.type,
          yValue: cumulative,
          idx: i,
        });
      }

      return segmentLines;
    }

    const realSegmentRows = rows.flatMap(buildRealAccidentSegments);

    compareSvg
      .append("g")
      .attr("class", "viz4-compare-real-segments")
      .selectAll("line")
      .data(realSegmentRows)
      .enter()
      .append("line")
      .attr("x1", (d) => xYear(d.year) + xType(d.type))
      .attr("x2", (d) => xYear(d.year) + xType(d.type) + xType.bandwidth())
      .attr("y1", (d) => y(d.yValue))
      .attr("y2", (d) => y(d.yValue))
      .attr("stroke", "#111827")
      .attr("stroke-width", 0.8)
      .attr("stroke-dasharray", "3,2")
      .attr("opacity", 0.9)
      .style("pointer-events", "none");

    compareSvg
      .append("g")
      .selectAll("text")
      .data(rows)
      .enter()
      .append("text")
      .attr("x", (d) => xYear(d.year) + xType(d.type) + xType.bandwidth() / 2)
      .attr("y", (d) => y(d.totalFatalities) - 12)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("fill", "#374151")
      .text((d) => `N=${d.accidentCount} | Avg=${d.avgFatalities.toFixed(1)}`);

    const compareLegend = compareSvg
      .append("g")
      .attr("transform", `translate(${cWidth - 245},${cMargin.top - 14})`);

    operatorTypes.forEach((type, i) => {
      const item = compareLegend
        .append("g")
        .attr("transform", `translate(${i * 120},0)`);

      item
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", operatorColors[type]);

      item
        .append("text")
        .attr("x", 18)
        .attr("y", 10)
        .style("font-size", "11px")
        .text(formatTypeLabel(type));
    });
  }

  function renderFromFocus(focusYear, beforeYears, afterYears) {
    syncWindowBounds(focusYear);

    const [startYear, endYear] = clampRangeFromFocus(
      focusYear,
      beforeYears,
      afterYears,
    );
    updateFocusText(focusYear, beforeYears, afterYears, startYear, endYear);
    renderRange(startYear, endYear);
    renderComparePanel();
  }

  if (typeof noUiSlider !== "undefined") {
    noUiSlider.create(analyzedYearSliderHost.node(), {
      start: analyzedYear,
      connect: [true, false],
      range: {
        min: VIZ4_DEFAULT_START_YEAR,
        max: VIZ4_DEFAULT_END_YEAR,
      },
      step: 1,
      behaviour: "tap-drag",
    });

    analyzedYearSliderHost.node().noUiSlider.on("update", (values) => {
      analyzedYear = Math.round(+values[0]);
      renderFromFocus(analyzedYear, yearsBefore, yearsAfter);
    });
  } else {
    controls
      .append("div")
      .style("font-size", "12px")
      .style("color", "#b91c1c")
      .text(
        "Le slider d'année analysée n'a pas pu être initialisé (noUiSlider indisponible).",
      );
  }

  function syncWindowInputsAndRender() {
    const { maxBefore, maxAfter } = getDynamicWindowBounds(analyzedYear);

    yearsBefore = Math.min(
      sanitizeWindowValue(+yearsBeforeInput.property("value")),
      maxBefore,
    );
    yearsAfter = Math.min(
      sanitizeWindowValue(+yearsAfterInput.property("value")),
      maxAfter,
    );

    yearsBeforeInput.property("value", yearsBefore);
    yearsAfterInput.property("value", yearsAfter);

    renderFromFocus(analyzedYear, yearsBefore, yearsAfter);
  }

  yearsBeforeInput.on("input", syncWindowInputsAndRender);
  yearsAfterInput.on("input", syncWindowInputsAndRender);

  function setCompareInputsState() {
    compareYearAInput.property("disabled", !compareMode);
    compareYearBInput.property("disabled", !compareMode);
  }

  function syncModeToggles() {
    normalToggleInput.property("checked", normalMode);
    compareToggleInput.property("checked", compareMode);
  }

  normalToggleInput.on("change", function () {
    normalMode = this.checked;
    if (normalMode) {
      compareMode = false;
    }
    syncModeToggles();
    setCompareInputsState();
    renderFromFocus(analyzedYear, yearsBefore, yearsAfter);
  });

  compareToggleInput.on("change", function () {
    compareMode = this.checked;
    if (compareMode) {
      normalMode = false;
    }
    syncModeToggles();
    setCompareInputsState();
    renderFromFocus(analyzedYear, yearsBefore, yearsAfter);
  });

  compareYearAInput.on("input", renderComparePanel);
  compareYearBInput.on("input", renderComparePanel);

  syncModeToggles();
  setCompareInputsState();

  renderFromFocus(analyzedYear, yearsBefore, yearsAfter);

  return { yearlyData, analyzedYear, yearsBefore, yearsAfter };
}
