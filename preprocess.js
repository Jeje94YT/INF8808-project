const continentLookup = {
    // Europe
    "France": "Europe", "Germany": "Europe", "Belgium": "Europe", 
    "England": "Europe", "United Kingdom": "Europe", "UK": "Europe",
    "Scotland": "Europe", "Ireland": "Europe", "Netherlands": "Europe", 
    "Italy": "Europe", "Spain": "Europe", "Portugal": "Europe", 
    "Sweden": "Europe", "Norway": "Europe", "Finland": "Europe", 
    "Switzerland": "Europe", "Austria": "Europe", "Russia": "Europe", 
    "USSR": "Europe", "Poland": "Europe", "Bulgaria": "Europe", 
    "Bulgeria": "Europe", // Faute du CSV
    "Czech Republic": "Europe", "Hungary": "Europe", "Denmark": "Europe", 
    "Greece": "Europe", "Romania": "Europe",

    // North America
    "United States": "North America", "USA": "North America", "Canada": "North America",
    "Mexico": "North America",

    // Tous les états américains (car le CSV omet souvent "USA")
    "Alabama": "North America", "Alaska": "North America", "Arizona": "North America", 
    "Arkansas": "North America", "California": "North America", "Colorado": "North America", 
    "Connecticut": "North America", "Delaware": "North America", "Florida": "North America", 
    "Georgia": "North America", "Hawaii": "North America", "Idaho": "North America", 
    "Illinois": "North America", "Indiana": "North America", "Iowa": "North America", 
    "Kansas": "North America", "Kentucky": "North America", "Louisiana": "North America", 
    "Maine": "North America", "Maryland": "North America", "Massachusetts": "North America", 
    "Michigan": "North America", "Minnesota": "North America", "Minnisota": "North America", // Faute CSV
    "Mississippi": "North America", "Missouri": "North America", "Montana": "North America", 
    "Nebraska": "North America", "Nevada": "North America", "New Hampshire": "North America", 
    "New Jersey": "North America", "New Mexico": "North America", "New York": "North America", 
    "North Carolina": "North America", "North Dakota": "North America", "Ohio": "North America", 
    "Oklahoma": "North America", "Oregon": "North America", "Pennsylvania": "North America", 
    "Rhode Island": "North America", "South Carolina": "North America", "South Dakota": "North America", 
    "Tennessee": "North America", "Texas": "North America", "Utah": "North America", 
    "Vermont": "North America", "Virginia": "North America", "Washington": "North America", 
    "West Virginia": "North America", "Wisconsin": "North America", "Wyoming": "North America",
    "Washington D.C.": "North America", "DC": "North America", "WY": "North America", "NY": "North America",

    // South America
    "Brazil": "South America", "Argentina": "South America", "Chile": "South America", 
    "Colombia": "South America", "Columbia": "South America", // Faute du CSV
    "Peru": "South America", "Venezuela": "South America", "Bolivia": "South America",

    // Asia
    "China": "Asia", "Japan": "Asia", "India": "Asia", "Pakistan": "Asia", 
    "Thailand": "Asia", "Vietnam": "Asia", "South Korea": "Asia", 
    "North Korea": "Asia", "Philippines": "Asia", "Indonesia": "Asia",
    "Taiwan": "Asia", "Malaysia": "Asia", "Israel": "Asia", "Saudi Arabia": "Asia", 
    "Turkey": "Asia", "Iran": "Asia", "Iraq": "Asia", "Syria": "Asia", 
    "United Arab Emirates": "Asia", "Afghanistan": "Asia",

    // Oceania
    "Australia": "Oceania", "New Zealand": "Oceania", "Papua New Guinea": "Oceania",

    // Africa
    "South Africa": "Africa", "Egypt": "Africa", "Nigeria": "Africa", 
    "Kenya": "Africa", "Morocco": "Africa", "Algeria": "Africa", 
    "Tunisia": "Africa", "Ethiopia": "Africa", "Libya": "Africa",
    "Sudan": "Africa", "Somalia": "Africa", "Congo": "Africa",

    // Unknown / fallback
    "North Sea": "Other", "Atlantic Ocean": "Other", "Baltic Sea": "Other", 
    "Pacific Ocean": "Other", "Mediterranean Sea": "Other", "English Channel": "Other",
    "Unknown": "Other"
};

function extractCountry(location){

    if(!location) return "Unknown";

    const parts = location.split(",");
    let country = parts[parts.length - 1].trim();

    country = country.replace(/^(Near|Off|Over)\s+/i, '').trim();

    if (country.includes("Germany")) country = "Germany";
    if (country.includes("France")) country = "France";
    if (country.includes("England")) country = "England";
    if (country.includes("Russia")) country = "Russia";

    return country;
}

function isWar(operator){

    if(!operator) return false;

    return operator.toLowerCase().includes("military")
        || operator.toLowerCase().includes("air force")
        || operator.toLowerCase().includes("army")
        || operator.toLowerCase().includes("navy");
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