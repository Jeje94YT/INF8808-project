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

  d3.select("#operatorChart")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("display", "block")
    .style("width", "100%")
    .style("height", "auto");

  // Base data ready for the rendering phase.
  const yearlyData = buildViz4YearlyData(globalData);
  const flatSeries = buildViz4FlatSeries(yearlyData);

  return { yearlyData, flatSeries };
}
