/* 
* Data Visualization - Framework
* Copyright (C) University of Passau
*   Faculty of Computer Science and Mathematics
*   Chair of Cognitive sensor systems
* Maintenance:
*   2025, Alexander Gall <alexander.gall@uni-passau.de>
*
* All rights reserved.
*/

// scatterplot axes
let xAxis, yAxis, xAxisLabel, yAxisLabel;
// radar chart axes
let radarAxesAngle;

let dimensions = ["dimension 1", "dimension 2", "dimension 3", "dimension 4", "dimension 5", "dimension 6"];
//*HINT: the first dimension is often a label; you can simply remove the first dimension with
// dimensions.splice(0, 1);

// the visual channels we can use for the scatterplot
let channels = ["scatterX", "scatterY", "size"];

// size of the plots
let margin, width, height, radius;
// svg containers
let scatter, radar, dataTable;

// Add additional variables
let loadedData = [];
let selectedPoints = [];
let customColors = ["purple", "darkgreen", "gold", "red", "darkblue"];
let colorScale = d3.scaleOrdinal().range(customColors);
let maxSelections = 5;
let labelColumn = null; 
let tooltip = d3.select("#tooltip");
let colorAssignment = new Map();
let colorPool = [...customColors];

function init() {
    // define size of plots
    margin = {top: 20, right: 20, bottom: 20, left: 50};
    width = 600;
    height = 500;
    radius = width / 3;

    // Start at default tab
    document.getElementById("defaultOpen").click();

	// data table
	dataTable = d3.select("#dataTable");
 
    // scatterplot SVG container and axes
    scatter = d3.select("#sp").append("svg")
    .attr("width", width)
    .attr("height", height);

    xAxis = scatter.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`);

    yAxis = scatter.append("g")
        .attr("transform", `translate(${margin.left}, 0)`);

    xAxisLabel = scatter.append("text")
        .attr("class", "x axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height - 0);

    yAxisLabel = scatter.append("text")
        .attr("class", "y axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90)`)
        .attr("x", -height / 2)
        .attr("y", 15);


    // radar chart SVG container and axes
    radar = d3.select("#radar").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

    // read and parse input file
    let fileInput = document.getElementById("upload"), readFile = function () {

    // clear existing visualizations
    clear();

    let reader = new FileReader();
    reader.onloadend = function () {
        console.log("data loaded");
        console.log("Loaded data sample:", loadedData[0]);
        console.log("Data columns:", dimensions);
        console.log("Radar render:", selectedPoints.length, dimensions);


        // parse CSV
        let text = reader.result;
        let parsedData = d3.csvParse(text);

        let categoricalColumns = ["student_id","gender","part_time_job","diet_quality","parental_education_level","internet_quality","extracurricular_participation" ]; // Add all non-numeric columns manually

        parsedData.forEach(row => {
        Object.keys(row).forEach(key => {
            if (!categoricalColumns.includes(key) && !isNaN(+row[key])) {
            row[key] = +row[key];  // convert only numeric values
            }
        });
    });


        
        loadedData = parsedData;

        // Extract numerical dimensions (ignore the first column if it's a label)
        let allColumns = parsedData.columns;
        dimensions = allColumns.filter(col => {
            return parsedData.every(row => !isNaN(+row[col]));
        });

        console.log("Dimensions used for visualization:", dimensions);

        // initialize visuals
        initVis(parsedData);
        CreateDataTable(parsedData);
          
        initDashboard(parsedData);
        window.data = parsedData;
    };
    reader.readAsText(fileInput.files[0]);
};
fileInput.addEventListener("change", readFile);
}

function initVis(_data) {
    // Set default selected dimensions
    xDim = dimensions[0];
    yDim = dimensions[0];
    sizeDim = dimensions[0] || null;

    // Initialize menus with dimension options
    channels.forEach(c => initMenu(c, dimensions));

    // Set default values in the menus and refresh them
    $("#scatterX").val(xDim).selectmenu("refresh");
    $("#scatterY").val(yDim).selectmenu("refresh");
    $("#size").val(sizeDim).selectmenu("refresh");

    // Create data table
    CreateDataTable(_data);

    // Render visuals
    renderScatterplot();
    renderRadarChart();

}

// clear visualizations before loading a new file
function clear() {
    scatter.selectAll("*").remove();
    radar.selectAll("*").remove();
    dataTable.selectAll("*").remove();

    selectedPoints = [];
    colorAssignment.clear();
    colorPool = [...customColors];

    // After clearing SVG, re-append axis groups (since they were removed)
    xAxis = scatter.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`);

    yAxis = scatter.append("g")
        .attr("transform", `translate(${margin.left}, 0)`);

    xAxisLabel = scatter.append("text")
        .attr("class", "x axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height - 0);

    yAxisLabel = scatter.append("text")
        .attr("class", "y axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90)`)
        .attr("x", -height / 2)
        .attr("y", 15);
 
}


//Create Table

function CreateDataTable(_data) {
    // Ensure dataTable is defined (you must define this elsewhere, e.g., d3.select("#dataTable"))
    dataTable.selectAll("*").remove();

    // Create table and add class
    let table = dataTable.append("table")
        .attr("class", "dataTableClass");

    // Add headers
    let thead = table.append("thead");
    let headerRow = thead.append("tr");
    _data.columns.forEach(col => {
        headerRow.append("th")
            .attr("class", "tableHeaderClass")
            .text(col);
    });

    // Add body and rows
    let tbody = table.append("tbody");
    _data.forEach(row => {
        let tr = tbody.append("tr");
        _data.columns.forEach(col => {
            tr.append("td")
                .attr("class", "tableBodyClass")
                .text(row[col])
                .on("mouseover", function () {
                    d3.select(this).style("background-color", "#e0f7fa");
                })
                .on("mouseout", function () {
                    d3.select(this).style("background-color", null);
                });
        });
    });
}

function renderScatterplot() {
    let xDim = readMenu("scatterX") || dimensions[0];
    let yDim = readMenu("scatterY") || dimensions[1];
    let sizeDim = readMenu("size") || null;

    if (!xDim || !yDim) return;

    xAxisLabel.text(xDim);
    yAxisLabel.text(yDim);

    let x = d3.scaleLinear()
        .domain(d3.extent(loadedData, d => +d[xDim]))
        .range([margin.left, width - margin.right]);

    let y = d3.scaleLinear()
        .domain(d3.extent(loadedData, d => +d[yDim]))
        .range([height - margin.bottom, margin.top]);

    let sizeValues = loadedData.map(d => +d[sizeDim]).filter(v => !isNaN(v));
    let sizeScale = d3.scaleLinear()
        .domain(d3.extent(sizeValues.length > 0 ? sizeValues : [1, 10]))
        .range([2, 10]);

    // Update axes without transitions
    xAxis.call(d3.axisBottom(x));
    yAxis.call(d3.axisLeft(y));

    // Data join without removing everything
    const dots = scatter.selectAll(".dot")
        .data(loadedData, d => d.id || JSON.stringify(d));

    // ENTER
    dots.enter()
        .append("circle")
        .attr("class", "dot")
        .attr("fill", "grey")
        .attr("opacity", 0.7)
        .attr("cx", d => x(+d[xDim])) // Start at correct pos
        .attr("cy", d => y(+d[yDim]))
        .attr("r", 0)
        .on("mouseover", handleMouseOver)    // <-- Use your new function here
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(300)
                .style("opacity", 0);
        })
        .on("click", function (event, d) {
            handleSelection(d);
        })
        .transition().duration(600)
            .attr("r", d => sizeDim && !isNaN(+d[sizeDim]) ? sizeScale(+d[sizeDim]) : 4);
       
    // UPDATE — Smooth transition
    dots.transition().duration(600)
        .attr("cx", d => x(+d[xDim]))
        .attr("cy", d => y(+d[yDim]))
        .attr("r", d => sizeDim && !isNaN(+d[sizeDim]) ? sizeScale(+d[sizeDim]) : 4)
        .attr("fill", d => colorAssignment.has(d) ? colorAssignment.get(d) : "grey");


    // EXIT — fade out and remove
    dots.exit()
        .transition().duration(300)
        .attr("r", 0)
        .remove();
}
function handleMouseOver(event, d) {
    tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);

    let htmlContent = Object.keys(d).map(key =>
        `${key}: ${d[key]}`
    ).join("<br>");

    tooltip.html(htmlContent)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
}


function handleSelection(d) {
    const index = selectedPoints.indexOf(d);

    if (index >= 0) {
        // Deselect
        selectedPoints.splice(index, 1);

        // Free the color assigned to this data point
        const releasedColor = colorAssignment.get(d);
        colorPool.unshift(releasedColor); // return to pool front
        colorAssignment.delete(d);
    } else if (selectedPoints.length < maxSelections) {
        // Select
        selectedPoints.push(d);

        // Assign next available color
        if (!colorAssignment.has(d) && colorPool.length > 0) {
            colorAssignment.set(d, colorPool.shift());
        }
    }

    renderScatterplot();
    renderRadarChart();
    updateLegend();
}


function updateLegend() {
    const legendItemsContainer = d3.select("#legend-items");
    legendItemsContainer.selectAll("*").remove();

    let legend = legendItemsContainer.selectAll(".legend-item")
        .data(selectedPoints)
        .enter().append("div")
        .attr("class", "legend-item")
        .style("margin", "4px")
        .style("display", "flex")
        .style("align-items", "center");

    legend.append("div")
        .attr("class", "color-circle")
        .style("background-color", d => colorAssignment.get(d))
        .style("width", "16px")
        .style("height", "16px")
        .style("border-radius", "50%")
        .style("margin-right", "6px");

    legend.append("span")
        .style("margin-right", "6px")
        .text(d => {
            const labelCol = Object.keys(d).find(k => isNaN(+d[k]));
            return d[labelCol];
        });

    // Instead of custom logic, just reuse the central selection handler
    legend.append("span")
        .attr("class", "close")
        .text("×")
        .style("cursor", "pointer")
        .style("margin-left", "6px")
        .on("click", function(event, d) {
            event.stopPropagation();
            handleSelection(d);  // This will update everything
        });
}


function renderRadarChart() {
    radar.selectAll("*").remove(); // clear old chart

    d3.select("#radar").selectAll("*").remove();
    radar = d3.select("#radar").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

    if (dimensions.length === 0) return;

    radarAxesAngle = (2 * Math.PI) / dimensions.length;

    const numLevels = 7; // number of grid lines

    // Draw concentric polygon grid lines without fill
    for (let level = 1; level <= numLevels; level++) {
        let r = (radius / numLevels) * level;

        let points = [];
        for (let i = 0; i < dimensions.length; i++) {
            points.push([radarX(r, i), radarY(r, i)]);
        }
        points.push(points[0]); // close polygon

        radar.append("path")
            .datum(points)
            .attr("d", d3.line().curve(d3.curveLinearClosed))
            .attr("stroke", "#bbb")
            .attr("stroke-width", 1)
            .attr("fill", "none");  // <-- no fill here
    }

    // Draw axes (spokes)
    const mainAxisLength = radius * 1.1;
    for (let i = 0; i < dimensions.length; i++) {
        let x = radarX(mainAxisLength, i);
        let y = radarY(mainAxisLength, i);
        // let x = radarX(radius, i);
        // let y = radarY(radius, i);
        radar.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", y)
            .attr("stroke", "black")      // darker color

        radar.append("text")
            .attr("x", x * 1.1)
            .attr("y", y * 1.1)
            .style("text-anchor", "middle")
            .text(dimensions[i])
            .style("font-size", "12px");
    }

    // Get min/max per dimension
    const min = {}, max = {};
    dimensions.forEach(dim => {
        min[dim] = d3.min(loadedData, d => +d[dim]);
        max[dim] = d3.max(loadedData, d => +d[dim]);
    });
    console.log("Selected point data:", selectedPoints);

    // Draw radar lines per selected point
    selectedPoints.forEach((d, i) => {
        const points = dimensions.map((dim, j) => {
            const val = +d[dim];
            const scaled = (val - min[dim]) / (max[dim] - min[dim]) * radius;
            return [radarX(scaled, j), radarY(scaled, j)];
        });

        points.push(points[0]); // close polygon

        radar.append("path")
            .datum(points)
            .attr("fill", "none")           // no fill for data polygons too
            .attr("stroke", colorAssignment.get(d))
            .attr("stroke-width", 3)
            .attr("d", d3.line().curve(d3.curveLinearClosed));

        points.slice(0, -1).forEach(([x, y]) => {
            radar.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 6)                // adjust size as needed
            .attr("fill", colorAssignment.get(d))
            .attr("stroke", "white")    // optional outline for contrast
            .attr("stroke-width", 1);
        });
    });
}


function radarX(radius, index){
    return radius * Math.cos(radarAngle(index));
}

function radarY(radius, index){
    return radius * Math.sin(radarAngle(index));
}

function radarAngle(index){
    return radarAxesAngle * index - Math.PI / 2;
}

// init scatterplot select menu
function initMenu(id, entries) {
    $("select#" + id).empty();

    entries.forEach(function (d) {
        $("select#" + id).append("<option>" + d + "</option>");
    });

    $("#" + id).selectmenu({
        select: function () {
            renderScatterplot();
        }
    });
}

// refresh menu after reloading data
function refreshMenu(id){
    $( "#"+id ).selectmenu("refresh");
}

// read current scatterplot parameters
function readMenu(id){
    return $( "#" + id ).val();
}

// switches and displays the tabs
function openPage(pageName,elmnt,color) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }
    document.getElementById(pageName).style.display = "block";
    elmnt.style.backgroundColor = color;
}