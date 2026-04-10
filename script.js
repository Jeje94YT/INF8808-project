// Variable globale accessible par tous les autres fichiers
let globalData = [];

// Chargement des données
d3.csv("data/Airplane_Crashes_and_Fatalities_Since_1908_t0_2023.csv").then(data => {
    
    preprocessData(data);

    data.forEach(d => {
        d.year = new Date(d.Date).getFullYear();
        d.fatalities = +d.Fatalities || 0;
        d.aboard = +d.Aboard || 0;
        d.ground = +d.Ground || 0;
        d.rate = d.aboard > 0 ? d.fatalities / d.aboard : 0;
    });

    globalData = data;

    initViz1();
    initViz2();
    initViz3();
    
}).catch(error => {
    console.error("Erreur lors du chargement des données:", error);
});