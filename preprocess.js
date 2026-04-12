const continentLookup = {
    // Europe
    "France": "Europe", "Germany": "Europe", "Belgium": "Europe", 
    "United Kingdom": "Europe", "Ireland": "Europe", "Netherlands": "Europe", 
    "Italy": "Europe", "Spain": "Europe", "Portugal": "Europe", 
    "Sweden": "Europe", "Norway": "Europe", "Finland": "Europe", 
    "Switzerland": "Europe", "Austria": "Europe", "Russia": "Europe", 
    "Poland": "Europe", "Bulgaria": "Europe", "Czech Republic": "Europe", 
    "Hungary": "Europe", "Denmark": "Europe", "Greece": "Europe", "Romania": "Europe",
    "Yugoslavia": "Europe", "Czechoslovakia": "Europe",

    // North America
    "United States": "North America", "Canada": "North America", "Mexico": "North America",
    "Cuba": "North America", "Puerto Rico": "North America", "Guatemala": "North America", 
    "Honduras": "North America", "Costa Rica": "North America", "Nicaragua": "North America", "Panama": "North America",

    // South America
    "Brazil": "South America", "Argentina": "South America", "Chile": "South America", 
    "Colombia": "South America", "Peru": "South America", "Venezuela": "South America", 
    "Bolivia": "South America", "Ecuador": "South America", "Uruguay": "South America",

    // Asia
    "China": "Asia", "Japan": "Asia", "India": "Asia", "Pakistan": "Asia", 
    "Thailand": "Asia", "Vietnam": "Asia", "South Korea": "Asia", 
    "North Korea": "Asia", "Philippines": "Asia", "Indonesia": "Asia",
    "Taiwan": "Asia", "Malaysia": "Asia", "Israel": "Asia", "Saudi Arabia": "Asia", 
    "Turkey": "Asia", "Iran": "Asia", "Iraq": "Asia", "Syria": "Asia", 
    "United Arab Emirates": "Asia", "Afghanistan": "Asia", "Nepal": "Asia", "Myanmar": "Asia", 
    "Sri Lanka": "Asia", "Kazakhstan": "Asia", "Azerbaijan": "Asia", "Lebanon": "Asia", "Mongolia": "Asia", "Laos": "Asia",

    // Oceania
    "Australia": "Oceania", "New Zealand": "Oceania", "Papua New Guinea": "Oceania",

    // Africa
    "South Africa": "Africa", "Egypt": "Africa", "Nigeria": "Africa", 
    "Kenya": "Africa", "Morocco": "Africa", "Algeria": "Africa", 
    "Tunisia": "Africa", "Ethiopia": "Africa", "Libya": "Africa",
    "Sudan": "Africa", "Somalia": "Africa", "Congo": "Africa",
    "Zaire": "Africa", "Angola": "Africa", "Cameroon": "Africa", "Madagascar": "Africa", "Mauritania": "Africa", "Tanzania": "Africa",

    // Other (Océans, Mers, etc.)
    "Other": "Other"
};

function extractCountry(location){
    if(!location) return "Unknown";

    const parts = location.split(",");
    let country = parts[parts.length - 1].trim();

    // Retirer les chiffres et les espaces inutiles
    country = country.replace(/\d+$/, '').trim();

    // Enlever les mots de direction parasites (Off, Near, Over, Northeast, Centeral, Territory of, etc.)
    country = country.replace(/^(Near|Off|Over|South of|North of|East of|West of|Coast of|Gulf of|Northeast|Centeral|Territory of)\s+/i, '').trim();

    const cLower = country.toLowerCase();
    
    // Fautes de frappe spécifiques
    if (cLower.includes("petreasa") && cLower.includes("romania")) return "Romania";
    if (cLower.includes("barquisimeto") && cLower.includes("venezuela")) return "Venezuela";
    if (cLower.includes("azores") || cLower.includes("portugal")) return "Portugal";
    
    // "AKA" : On gère spécifiquement la string erronée du CSV pour le Kazakhstan
    if (cLower.includes("kazakhstan") || cLower === "aka") return "Kazakhstan";
    
    // Noms historiques / multiples
    if (cLower.includes("myanmar") || cLower.includes("burma")) return "Myanmar";
    if (cLower.includes("taiwan") || cLower.includes("formosa")) return "Taiwan";
    if (cLower.includes("laos")) return "Laos";
    if (cLower.includes("afghanistan")) return "Afghanistan";
    
    // Noms avec "New Guinea" : les grouper tous
    if (cLower.includes("new guinea")) return "Papua New Guinea";

    // Pays des Pays-Bas
    if (cLower.includes("netherlands indies")) return "Indonesia"; 
    if (cLower.includes("netherlands") || cLower.includes("holland")) return "Netherlands";

    // Les Congo
    if (cLower.includes("congo") || cLower.includes("zaire")) return "Congo";

    // Standardisation des grands pays
    if (cLower.includes("canada") || cLower.includes("british columbia") || cLower.includes("quebec") || cLower.includes("newfoundland") || cLower.includes("northwest territories")) return "Canada";
    if (cLower.includes("france")) return "France";
    if (cLower.includes("germany")) return "Germany";
    if (cLower.includes("england") || cLower.includes("uk") || cLower.includes("united kingdom") || cLower.includes("scotland") || cLower.includes("wales")) return "United Kingdom";
    if (cLower.includes("russia") || cLower.includes("ussr") || cLower.includes("soviet union")) return "Russia";
    if (cLower.includes("china")) return "China";
    if (cLower.includes("brazil")) return "Brazil";
    if (cLower.includes("australia")) return "Australia";
    if (cLower.includes("colombia") || cLower.includes("columbia")) return "Colombia";
    if (cLower.includes("indonesia")) return "Indonesia";
    if (cLower.includes("philippines") || cLower.includes("philipines")) return "Philippines";
    if (cLower.includes("mexico") || cLower.includes("mexic")) return "Mexico";
    if (cLower.includes("italy")) return "Italy";
    if (cLower.includes("spain")) return "Spain";
    if (cLower.includes("peru")) return "Peru";
    if (cLower.includes("bolivia")) return "Bolivia";
    if (cLower.includes("vietnam")) return "Vietnam";
    if (cLower.includes("argentina") || cLower.includes("aregntina")) return "Argentina";
    if (cLower.includes("japan")) return "Japan";
    if (cLower.includes("egypt")) return "Egypt";
    if (cLower.includes("romania")) return "Romania";
    if (cLower.includes("venezuela")) return "Venezuela";
    if (cLower.includes("chile")) return "Chile";
    
    // Exception "India" : match exact
    if (cLower.match(/\bindia\b/)) return "India";
    if (cLower.includes("indian") && !cLower.includes("ocean")) return "India"; 

    // Si le nom contient Ocean, Sea ou Channel -> "Other"
    if (cLower.match(/\b(ocean|sea|channel)\b/)) return "Other";

    // Regroupement massif des États américains
    const usStates = ["alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan", "minnesota", "minnisota", "mississippi", "missouri", "montana", "nebraska", "nevada", "new hampshire", "new jersey", "new mexico", "new york", "north carolina", "north dakota", "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina", "south dakota", "tennessee", "texas", "utah", "vermont", "virginia", "washington", "west virginia", "wisconsin", "wyoming", "washington d.c.", "dc", "us", "usa", "united states", "puerto rico"];
    
    // CORRECTION NY & HI : On force le match par mots exacts pour éviter "Germa-ny" ou "C-hi-na" !
    if (usStates.includes(cLower) || cLower.includes("usa") || cLower.includes("united states") || cLower.includes("us virgin islands") || cLower.match(/\bhi\b/) || cLower.match(/\bny\b/)) {
        return "United States";
    }

    // Retirer les "South", "North" qui ne sont pas des vrais pays pour les fusionner avec le pays d'origine
    if (cLower.match(/^(south|north|east|west|northern|southern|eastern|western)\s+(.+)/)) {
        const official = ["south africa", "north korea", "south korea", "new zealand", "south sudan"];
        if (!official.includes(cLower)) {
            const match = country.match(/^(South|North|East|West|Northern|Southern|Eastern|Western)\s+(.+)/i);
            if (match) return match[2].trim();
        }
    }

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