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

// === GLOBAL STATE AND CONFIG ===
let chart1, chart2, chart3, chart4, chart5, chart6;

let dashboardData = []             // main dataset used throughout
let brushedDataChart4 = [];        // brushed data in parallel coordinates
let selectedBoxCategory = null;    // selected category from boxplot
let brushedIdsChart3 = new Set();  // IDs selected from scatterplot
let brushedIdsChart4 = new Set();  // IDs selected from parallel coordinates
let linkedFromChart3 = new Set();  // IDs linked from boxplot brushing


const attributeColorMap = d3.scaleOrdinal()
  .domain([
    "age", "gender", "study_hours_per_day", "social_media_hours", "netflix_hours",
    "part_time_job", "attendance_percentage", "sleep_hours", "diet_quality",
    "exercise_frequency", "parental_education_level", "internet_quality",
    "mental_health_rating", "extracurricular_participation", "exam_score",
    "age_group", "exam_score_band"
  ])
  .range([
    "#E69F00", // orange
    "#56B4E9", // sky blue
    "#009E73", // green
    "#F0E442", // yellow
    "#0072B2", // dark blue
    "#D55E00", // reddish orange
    "#CC79A7", // pinkish purple
    "#999999", // gray
  
    "#8DD3C7", // teal
    "#FFFFB3", // pale yellow
    "#BEBADA", // lavender
    "#FB8072", // coral
    "#80B1D3", // blue-gray
    "#FDB462", // light orange
    "#B3DE69", // lime green
    "#FCCDE5", // light pink
    "#D9D9D9", // silver
    "#BC80BD"  // plum
  ])
  
  function renderDashboardColorLegend() {
    const legendContainer = d3.select("#dashboard-color-legend");

    // Clear previous legend if re-rendering
    legendContainer.selectAll("*").remove();

    const attributes = attributeColorMap.domain(); // ✅ Correct way to get keys from a D3 ordinal scale

    const legend = legendContainer
        .append("div")
        .attr("class", "color-legend")
        .style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("gap", "12px")
        .style("justify-content", "center");

    attributes.forEach(attr => {
        const item = legend.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "6px");

        item.append("div")
            .style("width", "14px")
            .style("height", "14px")
            .style("border-radius", "50%")
            .style("background-color", attributeColorMap(attr)) // ✅ Use function call here
            .style("border", "1px solid #888");

        item.append("span")
            .style("font-size", "12px")
            .text(attr);
    });
}


// === INITIALIZATION ===
// Initializes dropdowns, charts, and event handlers
function initDashboard(_data) {
    // Prepare and store data
    dashboardData = _data.map((d, i) => ({ ...d, __id: i }));

    // Identify column types
    const categoricalColumns = Object.keys(_data[0]).filter(k => typeof _data[0][k] === "string");
    const numericColumns = Object.keys(_data[0]).filter(k => typeof _data[0][k] === "number");


    // Chart 3 (Scatterplot)
    populateDropdown("chart3-x", numericColumns);
    populateDropdown("chart3-y", numericColumns);
    document.getElementById("chart3-x").value = numericColumns[0];
    document.getElementById("chart3-y").value = numericColumns[1];

    document.getElementById("chart3-x").addEventListener("change", () => {
        createChart3();
        syncDensityWithScatter();
    });
    
    document.getElementById("chart3-y").addEventListener("change", () => {
        createChart3();
        syncDensityWithScatter();
    });

    // Chart 2 (Boxplot)
    populateDropdown("chart2-x", categoricalColumns); 
    populateDropdown("chart2-y", numericColumns);
    document.getElementById("chart2-x").addEventListener("change", createChart2);
    document.getElementById("chart2-y").addEventListener("change", createChart2);

    // Chart 6 (Density Plot)
    populateDropdown("chart6-x", numericColumns);
    populateDropdown("chart6-y", numericColumns);

    document.getElementById("chart6-x").value = numericColumns[0];
    document.getElementById("chart6-y").value = numericColumns[1];

    document.getElementById("chart6-x").addEventListener("change", createChart6);
    document.getElementById("chart6-y").addEventListener("change", createChart6);



    // Chart Containers
    chart1 = d3.select("#chart1")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    chart2 = d3.select("#chart2")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    chart3 = d3.select("#chart3")
        .append("svg").attr("width", width)
        .attr("height", height)
        .append("g");

    chart4 = d3.select("#chart4")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");


    chart5 = d3.select("#chart5")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    chart6 = d3.select("#chart6")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");
    
    // Initial Chart Rendering
    
    createChart1();
    createChart2();
    createChart3();
    createChart4();
    createChart5();
    createChart6();
    renderDashboardColorLegend();
    

    // Individual Reset for Chart 1
    document.getElementById("reset-chart1").addEventListener("click", () => {
        createChart1(); // Just reset chart1
    });

    // Full Reset for All Charts
    const resetAllBtn = document.getElementById("reset-all");
    if (resetAllBtn) {
        resetAllBtn.addEventListener("click", () => {
            brushedDataChart1 = [];
            brushedDataChart4 = [];
            createChart1();
            createChart2();
            createChart3();
            createChart4();
            createChart5();
            createChart6();
            renderDashboardColorLegend();
        });
    }
}

// Returns current dataset (may be filtered later)
function getFilteredData() {
    return dashboardData;
}
    
// SUNBURST MAP: Visualizes exam scores by hierarchical categories
function createChart1() {
    d3.select("#chart1").selectAll("*").remove();

    const svg = d3.select("#chart1")
        .append("svg")
        .attr("width", width)
        .attr("height", 500);

    chart1 = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const level1 = "parental_education_level";
    const level2 = "internet_quality";
    const level3 = "diet_quality";

    const sizeAttr = "exam_score";
    const sourceData = getFilteredData();

    const nested = d3.rollup(
        sourceData,
        v => d3.sum(v, d => isNaN(+d[sizeAttr]) ? 0 : +d[sizeAttr]),
        d => d[level1],
        d => d[level2],
        d => d[level3]
    );

    const root = d3.hierarchy([null, nested], ([, value]) =>
        value instanceof Map ? Array.from(value) : null
    ).sum(([_, value]) => typeof value === "number" ? value : 0);

    const radius = Math.min(width, height) / 2;
    const partition = d3.partition().size([2 * Math.PI, radius]);
    partition(root);

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);

    const tooltip = d3.select("#tooltip");

    const centerLabel = chart1.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Sunburst Map");

    // ✅ Define score extent and color scale BEFORE drawing arcs
    const scoreExtent = d3.extent(root.descendants().filter(d => d.depth), d => d.value);
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain(scoreExtent);

    // ✅ Now draw arcs
    chart1.selectAll("path")
        .data(root.descendants().filter(d => d.depth && d.value > 0))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => d.depth ? colorScale(d.value) : "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", function (event, d) {
            chart1.selectAll("path").style("opacity", 0.3);
            d3.select(this).style("opacity", 1);

            const pathLabel = d.ancestors().map(d => d.data[0]).reverse().slice(1).join(" → ");
            centerLabel.text(`${pathLabel || "Total"}\n(${d.value.toFixed(1)})`);

            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <strong>Path:</strong> ${pathLabel}<br>
                <strong>Score:</strong> ${d.value.toFixed(1)}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition().duration(300).style("opacity", 0);
            chart1.selectAll("path").style("opacity", 1);
            centerLabel.text("Sunburst Map");
        });
    
    // ==== LEGEND for score color scale ====
d3.select("#chart1-legend").selectAll("*").remove();  // clear if re-rendered

const legendWidth = 200;
const legendHeight = 12;

const legendSvg = d3.select("#chart1-legend")
    .append("svg")
    .attr("width", legendWidth + 40)
    .attr("height", 50);

// Define a gradient
const gradient = legendSvg.append("defs")
    .append("linearGradient")
    .attr("id", "sunburst-score-gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

gradient.append("stop").attr("offset", "0%").attr("stop-color", colorScale(scoreExtent[0]));
gradient.append("stop").attr("offset", "100%").attr("stop-color", colorScale(scoreExtent[1]));

// Draw the gradient bar
legendSvg.append("rect")
    .attr("x", 20)
    .attr("y", 20)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#sunburst-score-gradient)")
    .style("stroke", "#888")
    .style("stroke-width", 1);

// Labels
legendSvg.append("text")
    .attr("x", 20)
    .attr("y", 15)
    .text("Avg Exam Score")
    .style("font-size", "11px")
    .style("fill", "#333");

legendSvg.append("text")
    .attr("x", 20)
    .attr("y", 45)
    .text(scoreExtent[0].toFixed(1))
    .style("font-size", "10px");

legendSvg.append("text")
    .attr("x", 20 + legendWidth)
    .attr("y", 45)
    .attr("text-anchor", "end")
    .text(scoreExtent[1].toFixed(1))
    .style("font-size", "10px");

// Add floating label
const gradientLabel = legendSvg.append("text")
    .attr("y", 10)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("fill", "#333")
    .style("opacity", 0);

// Add transparent overlay for mouse tracking
legendSvg.append("rect")
    .attr("x", 20)
    .attr("y", 20)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "transparent")
    .style("cursor", "crosshair")
    .on("mousemove", function (event) {
        const mouseX = d3.pointer(event)[0];
        const relX = mouseX - 20;
        const percent = Math.min(Math.max(relX / legendWidth, 0), 1);

        // Map back from percent to exam score using reversed domain
        const score = scoreExtent[1] + (scoreExtent[0] - scoreExtent[1]) * percent;

        // Update label
        gradientLabel
            .attr("x", mouseX)
            .text(score.toFixed(1))
            .style("opacity", 1);
    })
    .on("mouseout", () => {
        gradientLabel.style("opacity", 0);
    });



}


// Handles filtering based on sunburst arc selection
function handleSunburstFilter(d) {
    //  DOM element IDs corresponding to sunburst hierarchy levels
    const levels = ["chart1-level1", "chart1-level2", "chart1-level3"];

    //  Get the selected hierarchy path (excluding the root)
    const activeLevels = d.ancestors().slice(1);

    //  Row-level filter function
    const filterFn = row => {
        return activeLevels.every((ancestor, i) => {
            const levelKey = document.getElementById(levels[i])?.value; // Get current hierarchy level key
            return row[levelKey] === ancestor.data[0]; // Match based on hierarchy label
        });
    };

    //  Apply filter to the full dashboard dataset
    brushedDataChart1 = dashboardData.filter(filterFn);

    //  Update the box plot (Chart 2) using filtered data
    createChart2();
}

// BOX PLOT WITH TOOLTIP
function createChart2() {
    // Clear previous content
    chart2.selectAll("*").remove();

    //  Get selected attributes from dropdowns
    const xAttr = document.getElementById("chart2-x").value;
    const yAttr = document.getElementById("chart2-y").value;

    // Prepare data
    const data = dashboardData;
    const grouped = d3.group(data, d => d[xAttr]);
    const categories = Array.from(grouped.keys()).sort();

    // Define margins and scales
    const margin = { top: 30, right: 30, bottom: 60, left: 50 };

    const x = d3.scaleBand()
        .domain(categories)
        .range([margin.left, width - margin.right])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[yAttr])).nice()
        .range([height - margin.bottom, margin.top]);

    // Axes
    chart2.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end");

    chart2.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Tooltip setup
    const tooltip = d3.select("#tooltip");

    // Draw each boxplot for each category
    categories.forEach(cat => {
        const values = grouped.get(cat).map(d => +d[yAttr]).sort(d3.ascending);
        // Compute box statistics
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const iqr = q3 - q1;
        const min = Math.max(d3.min(values), q1 - 1.5 * iqr);
        const max = Math.min(d3.max(values), q3 + 1.5 * iqr);
        const center = x(cat) + x.bandwidth() / 2;

        // Box body
        chart2.append("rect")
            .attr("x", x(cat))
            .attr("y", y(q3))
            .attr("height", y(q1) - y(q3))
            .attr("width", x.bandwidth())
            .attr("fill", attributeColorMap(xAttr))
            .attr("class", "box-group")
            .style("cursor", "pointer")
            // Interactivity: click to filter
            .on("click", () => {
                if (selectedBoxCategory === cat) {
                    selectedBoxCategory = null;
                    resetHighlights();
                } else {
                    selectedBoxCategory = cat;
                    const selected = grouped.get(cat);
                    highlightFromBoxplot(selected);
                }
            })
            // Tooltip for box
            .on("mouseover", (event) => {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
                    <strong>Category:</strong> ${cat}<br>
                    <strong>Q1:</strong> ${q1.toFixed(2)}<br>
                    <strong>Median:</strong> ${median.toFixed(2)}<br>
                    <strong>Q3:</strong> ${q3.toFixed(2)}<br>
                    <strong>IQR:</strong> ${iqr.toFixed(2)}
                `)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 30}px`);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 30}px`);
            })
            .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));

        // Median line
        chart2.append("line")
            .attr("x1", x(cat))
            .attr("x2", x(cat) + x.bandwidth())
            .attr("y1", y(median))
            .attr("y2", y(median))
            .attr("stroke", "black")
            .on("mouseover", (event) => {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>Median:</strong> ${median.toFixed(2)}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 30}px`);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 30}px`);
            })
            .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));

        // Whisker line
        chart2.append("line")
            .attr("x1", center)
            .attr("x2", center)
            .attr("y1", y(min))
            .attr("y2", y(max))
            .attr("stroke", "black")
            .on("mouseover", (event) => {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>Min:</strong> ${min.toFixed(2)}<br><strong>Max:</strong> ${max.toFixed(2)}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 30}px`);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 30}px`);
            })
            .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));

        // Min & max whisker ticks
        chart2.append("line")
            .attr("x1", center - 10)
            .attr("x2", center + 10)
            .attr("y1", y(min))
            .attr("y2", y(min))
            .attr("stroke", "black");

        chart2.append("line")
            .attr("x1", center - 10)
            .attr("x2", center + 10)
            .attr("y1", y(max))
            .attr("y2", y(max))
            .attr("stroke", "black");
    });
}



// SCATTERPLOT WITH REGRESSION LINE
function createChart3() {
    // Clear previous contents
    chart3.selectAll("*").remove();

    // Read selected attributes for x and y axes
    const xAttr = document.getElementById("chart3-x").value;
    const yAttr = document.getElementById("chart3-y").value;

    // Prepare data: parse numeric and filter invalid rows
    const data = dashboardData
        .map(d => ({ ...d, x: +d[xAttr], y: +d[yAttr] }))  // already includes __id
        .filter(d => !isNaN(d.x) && !isNaN(d.y));

    // Define margins and scales
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x))
        .nice()
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y))
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Draw axes
    chart3.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    chart3.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y));

    // Plot scatter points
    chart3.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "scatter-point") 
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", 4)
        .attr("fill", attributeColorMap(xAttr))
        .attr("opacity", 0.7);

    // Compute and draw regression line
    const { slope, intercept } = linearRegression(data);

    const xRange = d3.extent(data, d => d.x);
    const regressionPoints = xRange.map(xVal => ({
        x: xVal,
        y: slope * xVal + intercept
    }));

    chart3.append("path")
        .datum(regressionPoints)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => x(d.x))
            .y(d => y(d.y))
        );

    // Axis labels
    chart3.append("text")
        .attr("x", (width + margin.left - margin.right) / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(xAttr);

    chart3.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", - (margin.top + (height - margin.top - margin.bottom) / 2))
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(yAttr);
    
    // Brushing behavior
    const brush = d3.brush()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("brush end", brushed);

    chart3.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(g => g.select(".selection")
            .attr("fill", "#80deea")        
            .attr("fill-opacity", 0.4)      
            .attr("stroke", "#006064")      
            .attr("stroke-width", 1));

    // Clear Chart 4 brushes when brushing in Chart 3
    chart4.selectAll("g[class^='brush-']")
        .each(function () {
            d3.select(this).call(d3.brushY().clear);
        });

    // Brushed callback
    function brushed({ selection }) {
        if (!selection) {
            brushedIdsChart3.clear();
            resetHighlights();  // Fully resets both scatterplot and parallel coordinates
            return;
        }

        const [[x0, y0], [x1, y1]] = selection;

        const selected = data.filter(d => {
            const cx = x(d.x);
            const cy = y(d.y);
            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
        });

        const selectedIds = new Set(selected.map(d => d.__id));
        brushedIdsChart3 = selectedIds;
        highlightChartsByIds(selectedIds);
        }   
}

// PARALLEL COORDINATES Chart (Chart 4)
function createChart4() {
    //  Clear previous chart elements
    chart4.selectAll("*").remove();
    chart4.selectAll("text.brush-range-label").remove();

    //  Dimensions to display
    const dimensions = [
        "study_hours_per_day",
        "social_media_hours",
        "netflix_hours",
        "attendance_percentage",
        "sleep_hours",
        "exercise_frequency",
        "mental_health_rating",
        "exam_score"
    ];

    const margin = { top: 50, right: 10, bottom: 10, left: 50 };
    const innerHeight = height - margin.top - margin.bottom;

    //  Prepare data with numeric values
    const parallelData = dashboardData.map(d => {
        const filtered = {};
        dimensions.forEach(dim => filtered[dim] = +d[dim]);
        filtered.__id = d.__id;
        filtered.exam_score = +d.exam_score;
        return filtered;
    });

    //  Scales
    const x = d3.scalePoint().domain(dimensions).range([margin.left, width - margin.right]);
    const y = {};
    dimensions.forEach(dim => {
        y[dim] = d3.scaleLinear()
            .domain(d3.extent(parallelData, d => d[dim]))
            .range([innerHeight, margin.top]);
    });

    //  Line generator for each data path
    const line = d3.line()
        .x(([dim, _]) => x(dim))
        .y(([dim, val]) => y[dim](val));

    //  Color scale based on exam score
    const colorScale = d3.scaleSequential(d3.interpolatePlasma)
        .domain(d3.extent(parallelData, d => d.exam_score));

    const tooltip = d3.select("#tooltip");

    //  Draw student paths
    chart4.selectAll(".data-line")
        .data(parallelData, d => d.__id)
        .enter()
        .append("path")
        .attr("class", "data-line")
        .attr("d", d => line(dimensions.map(dim => [dim, d[dim]])))
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d.exam_score))
        .attr("stroke-width", 1)
        .attr("opacity", 0.5)
        .on("mouseover", function (event, d) {
            // Highlight hovered line only
            chart4.selectAll(".data-line")
                .attr("opacity", l => l.__id === d.__id ? 1 : 0.1)
                .attr("stroke", l => l.__id === d.__id ? colorScale(l.exam_score) : "#ccc")
                .attr("stroke-width", l => l.__id === d.__id ? 2 : 1);

            tooltip.transition().duration(200).style("opacity", 1);
            const content = dimensions.map(dim =>
                `${dim}: ${d[dim]?.toFixed ? d[dim].toFixed(2) : d[dim]}`
            ).join("<br>");

            tooltip.html(`<strong>Student Profile</strong><br>${content}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", function () {
            tooltip.transition().duration(300).style("opacity", 0);

            // Restore parallel coordinate line styles only
            chart4.selectAll(".data-line")
                .attr("opacity", 0.5)
                .attr("stroke-width", 1)
                .attr("stroke", d => colorScale(d.exam_score));
        });


    //  Draw axes and grid lines
    const brushes = {};
    dimensions.forEach(dim => {
        const axisGroup = chart4.append("g")
            .attr("transform", `translate(${x(dim)},0)`);

        axisGroup.call(d3.axisLeft(y[dim])
            .tickSize(-width + margin.left + margin.right));

        //  Axis label wrapping
        const words = dim.split("_");
        const text = axisGroup.append("text")
            .attr("x", 0)
            .attr("y", margin.top - 40)
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .style("fill", "black");

        words.forEach((word, i) => {
            text.append("tspan")
                .attr("x", 0)
                .attr("dy", i === 0 ? 0 : "1.1em")
                .text(word);
        });

        brushes[dim] = null;
    });

    //  Clear scatterplot brush when brushing here
    chart3.select(".brush").call(d3.brush().clear);

    //  Brushing logic (stub – functional details omitted)
    function brushed() {
        chart3.select(".brush").call(d3.brush().clear);
        const activeBrushes = {};
        let isAnyBrushActive = false;

        dimensions.forEach(dim => {
            const brushNode = chart4.select(`.brush-${dim}`).node();
            const brushSelection = d3.brushSelection(brushNode);
            // (No logic here yet for activeBrushes)
        });

        const filtered = isAnyBrushActive
            ? parallelData.filter(d =>
                dimensions.every(dim =>
                    !activeBrushes[dim] || (d[dim] >= activeBrushes[dim][0] && d[dim] <= activeBrushes[dim][1])
                )
            )
            : parallelData;

        brushedDataChart4 = filtered;
        const selectedIds = new Set(filtered.map(d => d.__id));

        //  Highlight in Chart 4
        chart4.selectAll(".data-line")
            .attr("stroke", d => selectedIds.has(d.__id) ? colorScale(d.exam_score) : "#ccc")
            .attr("opacity", d => selectedIds.has(d.__id) ? 1 : 0.05);

        // 🔗 Sync with scatterplot
        brushedIdsChart3 = selectedIds;
        linkedFromChart3 = new Set(selectedIds);
        highlightChartsByIds(selectedIds);
    }

    //  Legend for score color mapping
    const legendWidth = 150;
    const legendHeight = 10;
    d3.select("#chart4-legend").selectAll("*").remove();

    const legendSvg = d3.select("#chart4-legend")
        .append("svg")
        .attr("width", 240)
        .attr("height", 40);

    const gradient = legendSvg.append("defs")
        .append("linearGradient")
        .attr("id", "score-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%");

    const stops = d3.range(0, 1.01, 0.1);
    const scoreExtent = d3.extent(parallelData, d => d.exam_score);

    stops.forEach(t => {
        gradient.append("stop")
            .attr("offset", `${t * 100}%`)
            .attr("stop-color", colorScale(scoreExtent[0] + t * (scoreExtent[1] - scoreExtent[0])));
    });

    legendSvg.append("rect")
        .attr("x", 20)
        .attr("y", 10)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#score-gradient)")
        .style("stroke", "#aaa")
        .style("stroke-width", 1);

    //  Hover effect on legend to highlight similar scores
    legendSvg.append("rect")
        .attr("x", 20)
        .attr("y", 10)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "transparent")
        .style("cursor", "crosshair")
        .on("mousemove", function (event) {
            const mouseX = d3.pointer(event, this)[0];
            const t = mouseX / legendWidth;
            const hoveredScore = scoreExtent[0] + t * (scoreExtent[1] - scoreExtent[0]);

            chart4.selectAll(".data-line")
                .style("opacity", d => {
                    const diff = Math.abs(d.exam_score - hoveredScore);
                    return diff < (scoreExtent[1] - scoreExtent[0]) * 0.05 ? 1 : 0.1;
                });
        })
        .on("mouseout", function () {
            chart4.selectAll(".data-line").style("opacity", 0.5);
        });

    //  Min/max score labels
    legendSvg.append("text")
        .attr("x", 20)
        .attr("y", 35)
        .attr("text-anchor", "start")
        .style("font-size", "10px")
        .text(scoreExtent[0].toFixed(1));

    legendSvg.append("text")
        .attr("x", 20 + legendWidth)
        .attr("y", 35)
        .attr("text-anchor", "end")
        .style("font-size", "10px")
        .text(scoreExtent[1].toFixed(1));
}


//CORRELATION MATRIX
function createChart5() {
    // Clear previous render
    chart5.selectAll("*").remove();

    // Get all numeric keys except IDs
    const numericKeys = Object.keys(dashboardData[0])
        .filter(k =>
            typeof dashboardData[0][k] === "number" &&
            !["id", "__id", " Id", "id "].includes(k.trim().toLowerCase())
        );

    // Build matrix of correlations
    const matrix = [];
    for (let i = 0; i < numericKeys.length; i++) {
        for (let j = 0; j < numericKeys.length; j++) {
            const x = numericKeys[i];
            const y = numericKeys[j];
            const corr = computeCorrelation(dashboardData, x, y);
            matrix.push({ x, y, value: corr });
        }
    }

    // Full square matrix with centered layout
    const padding = 40;
    const matrixSize = Math.min(width, height) - 2 * padding;
    const gridSize = matrixSize / numericKeys.length;
    const offsetX = (width - matrixSize) / 2;
    const offsetY = (height - matrixSize) / 2;

    // Scales
    const x = d3.scaleBand().domain(numericKeys).range([offsetX, offsetX + matrixSize]);
    const y = d3.scaleBand().domain(numericKeys).range([offsetY, offsetY + matrixSize]);

    const color = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);

    // Matrix squares
    chart5.selectAll("rect")
        .data(matrix)
        .enter()
        .append("rect")
        .attr("x", d => x(d.x))
        .attr("y", d => y(d.y))
        .attr("width", gridSize)
        .attr("height", gridSize)
        .attr("fill", d => color(d.value))
        .on("mouseover", function (event, d) {
            d3.select(this).attr("stroke", "black").attr("stroke-width", 1.5);
            d3.select("#tooltip")
                .style("opacity", 1)
                .html(`<strong>${d.x} vs ${d.y}</strong><br>Correlation: ${d.value.toFixed(2)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mousemove", event => {
            d3.select("#tooltip")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("stroke", null);
            d3.select("#tooltip").style("opacity", 0);
        })
        .on("click", function (_, d) {
            // Set selected attributes in Chart 3 (scatter) and update
            document.getElementById("chart3-x").value = d.x;
            document.getElementById("chart3-y").value = d.y;
            createChart3();
            syncDensityWithScatter();
        });

    // Add correlation labels
    chart5.selectAll(".label")
        .data(matrix)
        .enter()
        .append("text")
        .attr("x", d => x(d.x) + gridSize / 2)
        .attr("y", d => y(d.y) + gridSize / 2)
        .text(d => d.value.toFixed(2))
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .style("fill", d => Math.abs(d.value) > 0.5 ? "white" : "black")
        .style("font-size", "12px");


    // X-axis labels (with word wrapping)
    chart5.selectAll(".x-label")
        .data(numericKeys)
        .enter()
        .append("text")
        .attr("class", "x-label")
        .attr("x", d => x(d) + gridSize / 2)
        .attr("y", offsetY + matrixSize + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "black")
        .each(function (d) {
            const words = d.split("_");
            const text = d3.select(this);
            words.forEach((word, i) => {
                text.append("tspan")
                    .attr("x", x(d) + gridSize / 2)
                    .attr("dy", i === 0 ? 0 : "1em")
                    .text(word);
            });
        });

    
    // Y-axis labels with word wrapping
    chart5.selectAll(".y-label")
        .data(numericKeys)
        .enter()
        .append("text")
        .attr("class", "y-label")
        .attr("x", offsetX - 8)
        .attr("y", d => y(d) + gridSize / 2)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "middle")
        .style("font-size", "10px")
        .each(function(d) {
            const words = d.split("_");
            for (let i = 0; i < words.length; i++) {
                d3.select(this)
                .append("tspan")
                .attr("x", offsetX - 8)
                .attr("dy", i === 0 ? "-0.6em" : "1.1em")
                .text(words[i]);
        }
    });
}

// Compute Pearson correlation coefficient
function computeCorrelation(data, attrX, attrY) {
    const x = data.map(d => +d[attrX]);
    const y = data.map(d => +d[attrY]);

    const meanX = d3.mean(x);
    const meanY = d3.mean(y);
    const stdX = d3.deviation(x);
    const stdY = d3.deviation(y);

    const cov = d3.mean(x.map((d, i) => (d - meanX) * (y[i] - meanY)));

    return cov / (stdX * stdY);
}

//DENSITY PLOT
function createChart6() {
    // Clear existing contents
    chart6.selectAll("*").remove();

    // Get selected attributes from dropdowns
    const xAttr = document.getElementById("chart6-x").value;
    const yAttr = document.getElementById("chart6-y").value;

    // Parse and filter numerical data
    const data = dashboardData.map(d => ({
        x: +d[xAttr],
        y: +d[yAttr]
    })).filter(d => !isNaN(d.x) && !isNaN(d.y));

    const margin = { top: 30, right: 40, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Compute scale extents with padding
    const xExtent = d3.extent(data, d => d.x);
    const yExtent = d3.extent(data, d => d.y);
    const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;

    // Create scales
    const x = d3.scaleLinear()
        .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
        .range([0, innerWidth]);

    const y = d3.scaleLinear()
        .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
        .range([innerHeight, 0]);

    // Axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    // Axis groups
    chart6.append("g")
        .attr("transform", `translate(${margin.left},${margin.top + innerHeight})`)
        .call(xAxis);

    chart6.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .call(yAxis);

    // Compute kernel density estimate
    const densityData = d3.contourDensity()
        .x(d => x(d.x))
        .y(d => y(d.y))
        .size([innerWidth, innerHeight])
        .bandwidth(30)
        (data);

    // Find the densest contour
    const maxDensity = d3.max(densityData, d => d.value);
    const densest = densityData.find(d => d.value === maxDensity);

    // Compute the centroid of the densest area
    const centroid = d3.geoPath().centroid(densest);
    const centerX = x.invert(centroid[0]);
    const centerY = y.invert(centroid[1]);

    // Color scale for density regions
    const baseColor = d3.color(attributeColorMap(yAttr));

    const color = d3.scaleLinear()
        .domain([0, d3.max(densityData, d => d.value)])
        .range(["#ffffff", baseColor.toString()]);

    const densityGroup = chart6.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    densityGroup.selectAll("path")
        .data(densityData)
        .enter().append("path")
        .attr("d", d3.geoPath())
        .attr("fill", d => color(d.value))         // ✅ gradient fill
        .attr("stroke", baseColor.darker(1))       // border = darker version
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.8);
    
    // Summary label below chart
    chart6.append("text")
        .attr("x", width / 2)
        .attr("y", height + 30 )
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "black")
        .text(`Most students cluster around ${xAttr} ≈ ${centerX.toFixed(1)}, ${yAttr} ≈ ${centerY.toFixed(1)}`);

    

    // Summary label below chart
    const summaryText = chart6.append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "black");

    // Intro text
    summaryText.append("tspan")
        .text("Most students cluster around ");

    //Bold x attribute and value
    summaryText.append("tspan")
        .style("font-weight", "bold")
        .text(`${xAttr} ≈ ${centerX.toFixed(1)}`);

    // Comma separator
    summaryText.append("tspan")
        .text(", ");

    //  Bold y attribute and value
    summaryText.append("tspan")
        .style("font-weight", "bold")
        .text(`${yAttr} ≈ ${centerY.toFixed(1)}`);

    // Y axis label
    chart6.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", - (margin.top + innerHeight / 2))
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(yAttr);
}


// Populate a <select> dropdown with column names
function populateDropdown(id, options) {
    const select = document.getElementById(id);
    select.innerHTML = "";
    options.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.text = opt;
        select.appendChild(option);
    });
}

// Compute linear regression line coefficients
function linearRegression(data) {
    const n = data.length;
    const sumX = d3.sum(data, d => d.x);
    const sumY = d3.sum(data, d => d.y);
    const sumXY = d3.sum(data, d => d.x * d.y);
    const sumX2 = d3.sum(data, d => d.x * d.x);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

// Wipes all charts
function clearDashboard() {
    chart1.selectAll("*").remove();
    chart3.selectAll("*").remove();
    chart4.selectAll("*").remove();
    chart2.selectAll("*").remove();
    chart5.selectAll("*").remove();
    chart6.selectAll("*").remove();

}

// Synchronizes selection highlighting across charts
function updateLinkedCharts(selected) {
    const selectedIds = new Set(selected.map(d => d.__id));
    brushedIdsChart3 = selectedIds;
    highlightChartsByIds(selectedIds);
}


//  Highlight selected points/lines across scatterplot (Chart 3) and parallel coordinates (Chart 4)
function highlightChartsByIds(idSet) {
    //  Use consistent color scale for exam_score
    const colorScale = d3.scaleSequential(d3.interpolatePlasma)
        .domain(d3.extent(dashboardData, d => d.exam_score));

    //  Update scatterplot (Chart 3) styling
    const xAttr = document.getElementById("chart3-x").value;
    chart3.selectAll(".scatter-point")
        .attr("fill", d => idSet.has(d.__id) ? attributeColorMap(xAttr) : "#ccc")
        .attr("r", d => idSet.has(d.__id) ? 6 : 3)
        .attr("opacity", d => idSet.has(d.__id) ? 1 : 0.3);


    //  Update parallel coordinates (Chart 4) styling
    chart4.selectAll(".data-line")
        .attr("stroke", d => idSet.has(d.__id) ? colorScale(d.exam_score) : "#ccc")  //  Use original color scale
        .attr("stroke-width", d => idSet.has(d.__id) ? 2 : 1)
        .attr("opacity", d => idSet.has(d.__id) ? 1 : 0.05);
}

// Highlights based on selected boxplot category
function highlightFromBoxplot(selected) {
    linkedFromChart3 = new Set(selected.map(d => d.__id));
    const xAttr = document.getElementById("chart3-x").value;

    chart3.selectAll(".scatter-point")
        .attr("fill", d => linkedFromChart3.has(d.__id) ? attributeColorMap(xAttr) : "#ccc")
        .attr("opacity", d => linkedFromChart3.has(d.__id) ? 1 : 0.3)
        .attr("r", d => linkedFromChart3.has(d.__id) ? 6 : 3);
}


// Restores default chart colors and clears linked selections
function resetHighlights() {
    const xAttr = document.getElementById("chart3-x").value;
    chart3.selectAll(".scatter-point")
        .attr("fill", attributeColorMap(xAttr))
        .attr("r", 4)
        .attr("opacity", 0.7)


    // Restore parallel coordinates (Chart 4) with original color scale
    const colorScale = d3.scaleSequential(d3.interpolatePlasma)
        .domain(d3.extent(dashboardData, d => d.exam_score));

    chart4.selectAll(".data-line")
        .attr("stroke", d => colorScale(d.exam_score))
        .attr("stroke-width", 1)
        .attr("opacity", 0.5);
}

// Syncs Chart 6 axes to match Chart 3’s scatterplot axes
function syncDensityWithScatter() {
    const xAttr = document.getElementById("chart3-x").value;
    const yAttr = document.getElementById("chart3-y").value;

    document.getElementById("chart6-x").value = xAttr;
    document.getElementById("chart6-y").value = yAttr;

    createChart6();
}



