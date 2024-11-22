


let preset = null
let data = null;

const presetInput = document.getElementById('presetInput');
const loadPresetDataBtn = document.getElementById('loadPresetDataBtn');
const uploadPresetDataBtn = document.getElementById('uploadPresetDataBtn');

const csvInput = document.getElementById('csvInput');
const loadCSVDataBtn = document.getElementById('loadCSVDataBtn');
const uploadCSVDataBtn = document.getElementById('uploadCSVDataBtn');

const visualizeBtn = document.getElementById('visualizeBtn');

visualizeBtn.addEventListener('click', () => {
    if (!data) {
        alert('Please load or upload CSV data');
        return;
    }

    if (!preset) {
        alert('Please load or upload preset data');
        return;
    }

    createChartFromJSON(preset);
});

let currentColor = 0;

const chartColors = [
    'rgba(54, 162, 235, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(199, 199, 199, 1)',
    'rgba(83, 102, 255, 1)',
    'rgba(255, 102, 255, 1)',
    'rgba(102, 255, 102, 1)',
    'rgba(255, 102, 102, 1)',
    'rgba(102, 102, 255, 1)',
    'rgba(255, 255, 102, 1)',
    'rgba(102, 255, 255, 1)',
    'rgba(255, 102, 153, 1)',
    'rgba(102, 153, 255, 1)',
    'rgba(255, 153, 102, 1)',
    'rgba(153, 255, 102, 1)',
    'rgba(102, 255, 153, 1)',
    'rgba(153, 102, 255, 1)'
];

function getRandomColor() {
    if (currentColor < chartColors.length) {
        return chartColors[currentColor++];
    }

    currentColor = 0;
    return chartColors[currentColor++];
}

function createChartFromJSON(preset) {
    const container = document.getElementById('presetCharts');

    preset.charts.forEach(chartData => {
        // Create a canvas element for the chart
        const divContainer = document.createElement('div');
        container.appendChild(divContainer);

        const canvas = document.createElement('canvas');
        divContainer.appendChild(canvas)

        if (chartData.type === 'line' || chartData.type === 'bar') {
            divContainer.style.width = '50%';
            // Extract data from JSON
            const xAxisColumn = chartData.config.xAxis.column;
            const yAxisColumns = chartData.config.yAxis.map(y => y.column);
            const filters = chartData.config.filters;

            // Filter data based on filters
            const filteredData = data.slice(1).filter(row => {
                return filters.every(filter => row[filter.column] === filter.value);
            });

            // Extract x and y values
            const labels = filteredData.map(row => row[xAxisColumn]);
            const datasets = yAxisColumns.map((yAxisColumn, index) => {
                const mappedData = data.map(row => parseFloat(row[yAxisColumn]));
                return {
                    label: data[0][yAxisColumn],
                    data: mappedData
                }
            });

            // Create the chart
            buildLineStyleChart(canvas, chartData.type, labels, datasets, chartData.title, data[0][xAxisColumn]);
            return;
        }

        if (chartData.type === 'pie' || chartData.type === 'doughnut') {
            divContainer.style.width = '25%';
            const columnsToInclude = chartData.config.columns.include.map(obj => obj.column);
            const columnsToExclude = chartData.config.columns.exclude.map(obj => obj.column);

            const filters = chartData.config.filters;

            // Filter data based on filters
            const filteredData = data.slice(1).filter(row => {
                return filters.every(filter => row[filter.column] === filter.value);
            });

            const dataWithoutColumns = filteredData.slice(1).map(row => {
                return row.filter((column, index) => {
                    if (columnsToInclude.length > 0) {
                        return columnsToInclude.includes(index.toString()) && !columnsToExclude.includes(index.toString());
                    }
    
                    return !columnsToExclude.includes(index.toString());
                });
            });
    
            const pieAggregation = dataWithoutColumns.reduce((acc, row) => {
                row.forEach((column, index) => {
                    if (!acc[column]) {
                        acc[column] = 0;
                    }
    
                    acc[column]++;
                });
    
                return acc;
            }, {});

            buildPieChart(canvas, chartData.type, pieAggregation, chartData.title);

            return;
        }

    });
}

function buildPieChart(ctx, type, dataAggregation, title = 'Pie Chart') {
    const dataValues = Object.values(dataAggregation);
    const total = dataValues.reduce((sum, value) => sum + value, 0);

    const labels = Object.keys(dataAggregation)
    .map((label, index) => {
        const percentage = (dataAggregation[label] / total * 100).toFixed(2) + '%';
        return `${label} (${percentage})`;
    });


    return new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: labels.map(() => getRandomColor()),
                borderColor: labels.map(() => getRandomColor()),
                borderWidth: 3
            }]
        },
        plugins: [ChartDataLabels],
        options: {
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 24
                    }
                },
                legend: {
                    labels: {
                        font: {
                            size: 18
                        }
                    }
                },
                datalabels: {
                    formatter: (value, context) => {
                        const percentage = (value / total * 100).toFixed(2) + '%';
                        return percentage;
                    },
                    color: '#fff',
                    font: {
                        size: 18
                    }
                },
                tooltip: {
                    enabled: true,
                    bodyFont: {
                        size: 18
                    },
                    titleFont: {
                        size: 18
                    }
                }
            }
        }
    });
}

function buildLineStyleChart(canvas, type, labels, datasets, title, xAxisLabel) {
    new Chart(canvas, {
        type: type,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xAxisLabel,
                        font: {
                            size: 18
                        }
                    },
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 24
                    }
                },
                legend: {
                    labels: {
                        font: {
                            size: 18
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    bodyFont: {
                        size: 18
                    },
                    titleFont: {
                        size: 18
                    }
                }
            }
        }
    });
}

loadCSVDataBtn.addEventListener('click', () => {
    data = Papa.parse(csvInput.value).data;
    updateCSVDataUpload();
});

uploadCSVDataBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.onchange = event => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                const csvData = e.target.result;
                Papa.parse(csvData, {
                    complete: function (results) {
                        data = results.data;
                        updateCSVDataUpload();
                    },
                    error: function (error) {
                        alert('Error parsing CSV data.');
                    }
                });
            };
            reader.readAsText(file);
        }
    };
    fileInput.click();
});



function parsePreset(value) {
    try {
        return JSON.parse(value);
    } catch (err) {
        alert('Invalid JSON');
    }
}

loadPresetDataBtn.addEventListener('click', () => {
    preset = parsePreset(presetInput.value);

    updatePresetSection();
    updateCSVDataUpload();
});

function updatePresetSection() {
    if (preset) {
        document.getElementById('presetDataUpload').style.display = 'none';
        document.getElementById('loadPresetSuccess').style.display = 'block';
    }
}

function updateCSVDataUpload() {
    if (data) {
        document.getElementById('csvDataUpload').style.display = 'none';
        document.getElementById('loadCSVSuccess').style.display = 'block';
    }
}

uploadPresetDataBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = event => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                const jsonData = e.target.result;
                preset = parsePreset(jsonData);

                updatePresetSection();
                updateCSVDataUpload();
            };
            reader.readAsText(file);
        }
    };
    fileInput.click();
});
