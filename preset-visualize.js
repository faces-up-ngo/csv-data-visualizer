


let preset = null
let data = null;

const presetInput = document.getElementById('presetInput');
const loadPresetDataBtn = document.getElementById('loadPresetDataBtn');
const uploadPresetDataBtn = document.getElementById('uploadPresetDataBtn');

const csvInput = document.getElementById('csvInput');
const loadCSVDataBtn = document.getElementById('loadCSVDataBtn');
const uploadCSVDataBtn = document.getElementById('uploadCSVDataBtn');

const presetTitle = document.getElementById('presetTitle');
const presetDescription = document.getElementById('presetDescription');

const variablesSection = document.getElementById('variablesSection');

const visualizeBtn = document.getElementById('visualizeBtn');

const presets = [];

const presetSelect = document.getElementById('presetSelect');

function displayVariables() {
    if (!preset) {
        alert('Please load or upload preset data');
        return;
    }

    variablesSection.style.display = 'block';
    variablesSection.innerHTML = '';

    const variables = preset.variables;
    console.log(variables);
    variables.forEach(variable => {
        // Create a stylish input for the variable

        const div = document.createElement('div');
        div.classList.add('variable');
        div.innerHTML = `
            <label for="${variable.name}">${variable.name}:</label>
            <input class="variable-input border rounded" type="text" id="${variable.name}" name="${variable.name}">
        `;
        variablesSection.appendChild(div);
    });
}

let originalPreset

presetSelect.addEventListener('change', (event) => {
    if (event.target.value === '-1') {
        presetInput.value = '';
        return;
    }
    const parsedValue = JSON.parse(event.target.value);
    presetInput.value = JSON.stringify(parsedValue, null, 4);
});

function displayPresets() {

    presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = JSON.stringify(preset);
        option.text = preset.name;
        presetSelect.appendChild(option);
    });
}

window.onload = async () => {
    const url = `https://faces-up-ngo.github.io/csv-data-visualizer/presets/preset-`;

    for (let i = 1; i <= 100; i++) {
        const response = await fetchPreset(url + i + '.json');
        if (!response) {
            displayPresets();
            break;
        }
    }
};

async function fetchPreset(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Network response was not ok ' + response.statusText);
            return;
        }
        const data = await response.json();
        presets.push(data);
        return data;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
        return;
    }
}

document.getElementById('exportPDF').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title and subtitle
    doc.setFontSize(22);
    doc.text(presetTitle.innerText, 105, 20, null, null, 'center');
    doc.setFontSize(16);
    // Add all Filters
    // Find only top level divs

    let position = 30;
    doc.text(presetDescription.innerText, 105, position, null, null, 'center');

    // Hide buttonsContainer and show chartsContainer

    html2canvas(document.getElementById('presetCharts')).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;

        position += 10;

        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        doc.save('data.pdf');
    });
});


visualizeBtn.addEventListener('click', () => {
    if (!data) {
        alert('Please load or upload CSV data');
        return;
    }

    if (!preset) {
        alert('Please load or upload preset data');
        return;
    }

    presetTitle.innerText = preset.name;
    presetDescription.innerText = preset.description;
    document.getElementById('presetSection').style.display = 'block';

    variablesSection.querySelectorAll('.variable-input').forEach(input => {
        const variableName = input.id;
        const value = input.value;

        preset = JSON.parse(JSON.stringify(originalPreset).replaceAll(`{{${variableName}}}`, value));
    });


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

function filterOperation(left, right, operation) {
    if (operation === '=') {
        return left == right;
    }

    if (operation === '!=') {
        return left !== right;
    }

    return left == right;
}

function filterData(data, filters) {
    return data.filter(row => {
        return filters.every(filter => filterOperation(row[filter.column], filter.value, filter.operation));
    });
}

function createChartFromJSON(preset) {
    // Clear preset charts section
    document.getElementById('presetCharts').innerHTML = '';
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
            const yAxisColumns = chartData.config.yAxis;
            const filters = chartData.config.filters;
            const aggregation = chartData.config.aggregation;

            // Filter data based on filters
            const filteredData = filterData(data, filters);

            if (aggregation == 'average') {
                const groupedData = filteredData.slice(1).reduce((acc, row) => {
                    const key = row[xAxisColumn];
                    if (!acc[key]) {
                        acc[key] = [];
                    }

                    acc[key].push(row);
                    return acc;
                }, {});

                const labels = Object.keys(groupedData);
                const datasets = yAxisColumns.map((yAxis, index) => {
                    const data = labels.map(label => {
                        const rows = groupedData[label].filter(row => {
                            return yAxis.filters.every(filter => {
                                console.log(row[filter.column], filter.value, filter.operation);
                                console.log(filterOperation(row[filter.column], filter.value, filter.operation));
                                return filterOperation(row[filter.column], filter.value, filter.operation);
                            })
                        });

                        const sum = rows.reduce((sum, row) => sum + parseFloat(row[yAxis.column]), 0);
                        return sum / rows.length;
                    });

                    return {
                        label: yAxis.name,
                        data: data
                    }
                });

                buildLineStyleChart(canvas, chartData.type, labels, datasets, chartData.title, chartData.config.xAxis.name);
                return;
            }

            if (aggregation == 'sum') {
                const groupedData = filteredData.slice(1).reduce((acc, row) => {
                    const key = row[xAxisColumn];
                    if (!acc[key]) {
                        acc[key] = [];
                    }

                    acc[key].push(row);
                    return acc;
                }, {});

                const labels = Object.keys(groupedData);
                const datasets = yAxisColumns.map((yAxis, index) => {
                    const data = labels.map(label => {
                        const rows = groupedData[label].filter(row => {
                            return yAxis.filters.every(filter => {
                                return filterOperation(row[filter.column], filter.value, filter.operation);
                            })
                        });

                        return rows.reduce((sum, row) => sum + parseFloat(row[yAxis.column]), 0);
                    });

                    return {
                        label: yAxis.name,
                        data: data
                    }
                });

                buildLineStyleChart(canvas, chartData.type, labels, datasets, chartData.title, chartData.config.xAxis.name);
                return;
            }

            // Extract x and y values
            const labels = filteredData.slice(1).map(row => row[xAxisColumn]);
            const datasets = yAxisColumns.map((yAxis, index) => {
                const mappedData = data.slice(1).map(row => parseFloat(row[yAxis.column]));
                return {
                    label: yAxis.name,
                    data: mappedData
                }
            });


            // Create the chart
            buildLineStyleChart(canvas, chartData.type, labels, datasets, chartData.title, chartData.config.xAxis.name);
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
    updateDataLoadingSection();
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
                        updateDataLoadingSection();
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

let presetLoaded = false;
let dataLoaded = false;

function updateDataLoadingSection() {
    if (presetLoaded && dataLoaded) {
        document.getElementById('dataLoadingSection').style.display = 'none';
    }
}

loadPresetDataBtn.addEventListener('click', () => {
    preset = parsePreset(presetInput.value);
    originalPreset = preset;

    displayVariables();
    updatePresetSection();
    updateCSVDataUpload();
    updateDataLoadingSection();
});

function updatePresetSection() {
    if (preset) {
        document.getElementById('presetDataUpload').style.display = 'none';
        document.getElementById('loadPresetSuccess').style.display = 'block';
        presetLoaded = true;
    }
}

function updateCSVDataUpload() {
    if (data) {
        dataLoaded = true;
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
                originalPreset = preset;

                displayVariables();
                updatePresetSection();
                updateCSVDataUpload();
                updateDataLoadingSection();
            };
            reader.readAsText(file);
        }
    };
    fileInput.click();
});
