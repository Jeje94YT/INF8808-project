const continentLookup = {
    // Europe
    "France": "Europe",
    "Germany": "Europe",
    "Belgium": "Europe",
    "England": "Europe",
    "United Kingdom": "Europe",
    "Scotland": "Europe",
    "Ireland": "Europe",
    "Netherlands": "Europe",
    "Italy": "Europe",
    "Spain": "Europe",
    "Portugal": "Europe",
    "Sweden": "Europe",
    "Norway": "Europe",
    "Finland": "Europe",
    "Switzerland": "Europe",
    "Austria": "Europe",
    "Russia": "Europe",
    "Poland": "Europe",
    "Bulgaria": "Europe",
    "Czech Republic": "Europe",
    "Hungary": "Europe",
    "Denmark": "Europe",
    "Greece": "Europe",

    // North America
    "United States": "North America",
    "USA": "North America",
    "Canada": "North America",
    "Virginia": "North America",
    "New Jersey": "North America",
    "Maryland": "North America",
    "New York": "North America",
    "Texas": "North America",
    "Florida": "North America",
    "California": "North America",

    // South America
    "Brazil": "South America",
    "Argentina": "South America",
    "Chile": "South America",
    "Colombia": "South America",
    "Peru": "South America",

    // Asia
    "China": "Asia",
    "Japan": "Asia",
    "India": "Asia",
    "Pakistan": "Asia",
    "Thailand": "Asia",
    "Vietnam": "Asia",
    "South Korea": "Asia",
    "North Korea": "Asia",
    "Philippines": "Asia",

    // Oceania
    "Australia": "Oceania",
    "New Zealand": "Oceania",
    "Papua New Guinea": "Oceania",

    // Africa
    "South Africa": "Africa",
    "Egypt": "Africa",
    "Nigeria": "Africa",
    "Kenya": "Africa",
    "Morocco": "Africa",
    "Algeria": "Africa",
    "Tunisia": "Africa",
    "Ethiopia": "Africa",
    "Libya": "Africa",

    // Middle East
    "Israel": "Asia",
    "Saudi Arabia": "Asia",
    "Turkey": "Asia",
    "Iran": "Asia",
    "Iraq": "Asia",
    "Syria": "Asia",
    "United Arab Emirates": "Asia",

    // Unknown / fallback
    "North Sea": "Other",
    "Atlantic Ocean": "Other",
    "Baltic Sea": "Other",
    "Pacific Ocean": "Other",
    "Unknown": "Other"
};

function extractCountry(location){

    if(!location) return "Unknown";

    const parts = location.split(",");
    return parts[parts.length - 1].trim();
}

function isWar(operator){

    if(!operator) return false;

    return operator.toLowerCase().includes("military");
}

function getContinent(country){

    return continentLookup[country] || "Other";
}

function preprocessData(data){

    data.forEach(d => {

        d.year = new Date(d.Date).getFullYear();

        d.country = extractCountry(d.Location);

        d.continent = getContinent(d.country);

        d.war = isWar(d.Operator);

    });

}