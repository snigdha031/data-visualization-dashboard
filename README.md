# Student Performance & Lifestyle Analytics Dashboard

## Live Demo
👉 https://snigdha031.github.io/data-visualization-dashboard

Interactive data visualization dashboard analyzing the relationship between student habits and academic performance. Built with D3.js for the University of Passau.

![D3.js](https://img.shields.io/badge/D3.js-v7-orange) ![Status](https://img.shields.io/badge/status-active-success)

## Overview

Explore how study habits, lifestyle choices, and socioeconomic factors correlate with exam scores through 6 interactive visualizations with linked brushing and dynamic filtering.

**Dataset**: 1,002 students with 17 attributes (age, study hours, social media usage, attendance, sleep, diet, mental health, exam scores, etc.)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/snigdha031/data-visualization-dashboard.git
   cd student-performance-dashboard
   ```

2. **Start a local server**
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```

3. **Open in browser** → `http://localhost:8000`

4. **Load data** → Data Loading tab → Upload `student_habits_performance_processed.csv`

## Visualizations

### Basic Visualization Tab
- **Interactive Scatterplot**: Select X/Y axes and size dimensions, click points to select up to 5 for comparison
- **Radar Chart**: Multi-dimensional comparison of selected students

### Dashboard Tab
1. **Sunburst Chart** - Hierarchical breakdown by parental education → internet quality → diet quality
2. **Box Plot** - Performance distribution across student groups (click boxes to filter)
3. **Scatterplot** - Correlation explorer with regression line and brushing
4. **Parallel Coordinates** - Multivariate patterns (brush any axis to filter)
5. **Correlation Heatmap** - All numerical features correlation matrix
6. **Density Contour** - Student clustering in 2D attribute space

### Key Features
- **Linked Brushing**: Selections in one chart highlight across all charts
- **Dynamic Dropdowns**: Real-time axis/attribute selection
- **Responsive Design**: Adapts to desktop, tablet, and mobile
- **Color Consistency**: 18-color palette for attributes, plasma gradient for exam scores

## Project Structure

```
├── index.html              # Main HTML with 3-tab navigation
├── style.css               # Responsive styling
├── dataVis.js             # Scatterplot & radar chart
├── dashboard.js           # 6 dashboard visualizations
├──data\
├  └── student_habits_performance_processed.csv
├  └── student_habits_performance.csv
```

## Tech Stack

- **D3.js v7** - Data visualization
- **jQuery 3.6 + jQuery UI** - UI components
- **Pure CSS3** - Responsive grid layout
- **No build tools required** - Runs in any modern browser

## Authors

**Created by**: Snigdha Raghavan Pradhipa & Vaishnavi Narasimhaiah Sathish  
**Course**: Data Visualization - University of Passau  
**Instructor**: Prof. Dr. Christoph Heinzl (Christoph.Heinzl@uni-passau.de) & Alexander Gall (alexander.gall@uni-passau.de)

## 📝 License

Copyright (C) University of Passau - All rights reserved.
