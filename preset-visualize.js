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

const GEMINI_API_KEY_QUERY_PARAM = 'gemini-api-key';

let geminiApiKey;



const loadNewGeminiTokenBtn = document.getElementById('loadNewGeminiTokenBtn');
loadNewGeminiTokenBtn.addEventListener('click', () => {
    document.getElementById('geminiAPITokenInput').value = '';
    document.getElementById('geminiAPIToken').style.display = 'block';
    document.getElementById('loadGeminiSuccess').style.display = 'none';
});

const loadGeminiAPITokenBtn = document.getElementById('loadGeminiAPITokenBtn');
loadGeminiAPITokenBtn.addEventListener('click', () => {
    geminiApiKey = document.getElementById('geminiAPITokenInput').value;
    const url = new URL(window.location.href);
    url.searchParams.delete(GEMINI_API_KEY_QUERY_PARAM);
    url.searchParams.set(GEMINI_API_KEY_QUERY_PARAM, geminiApiKey);

    window.history.pushState({}, '', url);

    document.getElementById('geminiAPIToken').style.display = 'none';
    document.getElementById('loadGeminiSuccess').style.display = 'block';
});

const loadNewPresetBtn = document.getElementById('loadNewPresetBtn');

loadNewPresetBtn.addEventListener('click', () => {
    preset = null;
    originalPreset = null;
    presetInput.value = '';
    presetTitle.innerText = '';
    presetDescription.innerText = '';
    document.getElementById('presetDataUpload').style.display = 'block';
    document.getElementById('loadPresetSuccess').style.display = 'none';
    document.getElementById('presetSection').style.display = 'none';
    document.getElementById('presetCharts').innerHTML = '';
    presetLoaded = false;
    const url = new URL(window.location.href);
    url.searchParams.delete('preset');
    window.history.pushState({}, '', url);
});


function displayVariables() {
    if (!preset) {
        return;
    }

    if (!data) {
        return;
    }

    variablesSection.style.display = 'block';
    variablesSection.innerHTML = '';

    const variables = preset.variables;
    variables.forEach(variable => {
        // Create a stylish input for the variable

        let variableValues = [];
        if (variable.valuesFromColumn) {
            variableValues = data.slice(1).map(row => row[variable.valuesFromColumn]);

            variableValues = [...new Set(variableValues)];

            const div = document.createElement('div');
            div.classList.add('variable');
            div.innerHTML = `
                <label for="${variable.name}">${variable.name}:</label>
                <select class="variable-input border rounded" id="${variable.name}" name="${variable.name}">
                    <option value="">Select a value</option>
                    ${variableValues.map(value => `<option value="${value}">${value}</option>`).join('')}
            `;
            variablesSection.appendChild(div);
            return;
        }

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
    const currentUrl = new URL(window.location.href);
    
    geminiApiKey = currentUrl.searchParams.get(GEMINI_API_KEY_QUERY_PARAM);
    if (geminiApiKey) {
        document.getElementById('geminiAPIToken').style.display = 'none';
        document.getElementById('loadGeminiSuccess').style.display = 'block';
    }

    const presetParam = currentUrl.searchParams.get('preset');
    if (presetParam) {
        preset = JSON.parse(presetParam);
        originalPreset = preset;
        updatePresetSection();
        return;
    }

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
    if (!filters || filters.length === 0) {
        return data;
    }

    return data.filter(row => {
        return filters.every(filter => filterOperation(row[filter.column], filter.value, filter.operation));
    });
}

function createGroupedBarLineChart(canvas, chart, data) {
    const labels = chart.config.xAxis.columns.map(column => data[0][column]);

    const filteredData = filterData(data, chart.config.xAxis.filters);

    const datasetValues = filteredData.map(row => row[chart.config.xAxis.datasetColumn]);

    const datasets = datasetValues.map(value => {
        const data = chart.config.xAxis.columns.map(column => {
            return filteredData.filter(row => row[chart.config.xAxis.datasetColumn] === value)
                .reduce((sum, row) => sum + parseFloat(row[column]), 0);
        });
        return {
            label: value,
            data: data
        }
    })

    buildLineStyleChart(canvas, chart.type, labels, datasets, chart.title, chart.config.xAxis.name);

    return {
        labels,
        datasets
    };
}

function createBarLineChartWithoutAggregation(canvas, chart, data) {
    const labels = filterData(data, chart.config.xAxis.filters)
        .slice(1)
        .map(row => row[chart.config.xAxis.column]);

    const dataset = chart.config.yAxis.map(yAxis => {
        const values = filterData(data, yAxis.filters)
            .slice(1)
            .map(row => parseFloat(row[yAxis.column]));
        return {
            label: yAxis.name,
            data: values
        }
    });

    buildLineStyleChart(canvas, chart.type, labels, dataset, chart.title, chart.config.xAxis.name);
    return {
        labels,
        dataset
    };
}

function createBarLineChartWithAggregation(canvas, chart, data, aggregation) {
    if (aggregation === 'average') {
        const groupedData = filterData(data, chart.config.xAxis.filters)
            .slice(1)
            .reduce((acc, row) => {
                const key = row[chart.config.xAxis.column];
                if (!acc[key]) {
                    acc[key] = [];
                }

                acc[key].push(row);
                return acc;
            }, {});

        const labels = Object.keys(groupedData);


        const datasets = chart.config.yAxis.map((yAxis, index) => {
            const data = labels.map(label => {
                const rows = groupedData[label].filter(row => {
                    if (!yAxis.filters) {
                        return true;
                    }

                    return yAxis.filters.every(filter => {
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

        buildLineStyleChart(canvas, chart.type, labels, datasets, chart.title, chart.config.xAxis.name);
        return {
            labels,
            datasets
        }
    }

    if (aggregation === 'sum') {
        const groupedData = filterData(data, chart.config.xAxis.filters)
            .slice(1)
            .reduce((acc, row) => {
                const key = row[chart.config.xAxis.column];
                if (!acc[key]) {
                    acc[key] = [];
                }

                acc[key].push(row);
                return acc;
            }, {});
        const labels = Object.keys(groupedData);

        const datasets = chart.config.yAxis.map((yAxis, index) => {
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

        buildLineStyleChart(canvas, chart.type, labels, datasets, chart.title, chart.config.xAxis.name);
        return {
            labels,
            datasets
        };
    }
}

function createBarLineChart(canvas, chart, data) {
    if (chart.config.type === 'grouped') {
        return createGroupedBarLineChart(canvas, chart, data);
    }

    const aggregation = chart.config.aggregation;

    if (!aggregation) {
        return createBarLineChartWithoutAggregation(canvas, chart, data);
    }

    return createBarLineChartWithAggregation(canvas, chart, data, aggregation);
}

function createPieDoughnutChart(canvas, chart, data) {
    const columnsToInclude = chart.config.columns.include.map(obj => obj.column);
    const columnsToExclude = chart.config.columns.exclude.map(obj => obj.column);

    const filters = chart.config.filters;

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

    buildPieChart(canvas, chart.type, pieAggregation, chart.title);

    return pieAggregation;
}

function buildInsightsBtn(container, data) {
    const insightsBtn = document.createElement('button');
    insightsBtn.innerText = 'Generate Insights';
    insightsBtn.classList.add('border', 'rounded', 'bg-blue-500', 'text-white', 'p-2', 'my-2');
    insightsBtn.onclick = async () => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `The data refers to students in the FacesUP org. Generate insights with bullets up to 3 bullets about this data: ${JSON.stringify(data)}`
                    }]
                }]
            })
        });

        const responseBody = await response.json();

        if (response.status === 200) {
            const insights = responseBody.candidates[0].content.parts[0].text;
            const insightsDiv = document.createElement('div');
            insightsDiv.classList.add('markdown-content', 'border', 'rounded', 'p-4', 'my-4', 'bg-blue-100');

            // Convert Markdown to HTML and set it as the inner HTML of the div
            insightsDiv.innerHTML = marked(insights);

            container.appendChild(insightsDiv);
            return;
        }

        alert('Error generating insights');
    }

    const insightsDiv = document.createElement('div');
    insightsDiv.classList.add('markdown-content', 'text-center', 'border', 'rounded', 'p-4', 'my-4', 'bg-blue-100');
    insightsDiv.appendChild(insightsBtn);
    return insightsDiv;
}

function createChartFromJSON(preset) {
    document.getElementById('presetCharts').innerHTML = '';
    const container = document.getElementById('presetCharts');

    const pages = {};

    preset.charts.forEach(chart => {
        let divContainer;

        let chartPage = chart.page ? chart.page : 0;
        let chartSection = chart.section ? chart.section : 0;

        if (!pages[chartPage]) {
            pages[chartPage] = {};
            pages[chartPage][chartSection] = document.createElement('div');
        } else if (!pages[chartPage][chartSection]) {
            pages[chartPage][chartSection] = document.createElement('div');
        }

        divContainer = document.createElement('div');
        divContainer.style.width = '50%';
        const canvas = document.createElement('canvas');

        pages[chartPage][chartSection].appendChild(divContainer);

        const filteredData = filterData(data, chart.config.filters);

        if (chart.type === 'line' || chart.type === 'bar') {
            const data = createBarLineChart(canvas, chart, filteredData);

            divContainer.appendChild(canvas)
            if (geminiApiKey) {
                const insightsBtn = buildInsightsBtn(divContainer, data);
                divContainer.appendChild(insightsBtn);
            }


            return;
        }

        if (chart.type === 'pie' || chart.type === 'doughnut') {
            divContainer.style.width = '25%';
            const data = createPieDoughnutChart(canvas, chart, filteredData);

            divContainer.appendChild(canvas)

            if (geminiApiKey) {
                const insightsBtn = buildInsightsBtn(divContainer, data);
                divContainer.appendChild(insightsBtn);
            }
        }
    });

    Object.entries(pages).forEach(pageEntry => {
        const pageDiv = document.createElement('div');
        pageDiv.style.width = '100%';

        // const pageTitle = document.createElement("h2");
        // pageTitle.classList.add('text-2xl', 'font-bold', 'text-center', 'text-blue-600', 'my-4');
        // const title = preset.pages[pageEntry[0]]?.title ? preset.pages[pageEntry[0]].title : "Data Visualization"; ;
        // pageTitle.innerText = title;
        // pageDiv.appendChild(pageTitle);

        Object.entries(pageEntry[1]).forEach(sectionEntry => {
            // const sectionTitle = document.createElement("h3");
            // sectionTitle.classList.add('text-xl', 'font-bold', 'text-center', 'text-blue-600', 'my-4');
            // sectionTitle.innerText = preset.pages[pageEntry[0]]?.sections[sectionEntry[0]]?.title ? preset.pages[pageEntry[0]].sections[sectionEntry[0]].title : "Section";
            // sectionEntry[1].appendChild(sectionTitle);
            sectionEntry[1].style.display = 'flex';
            sectionEntry[1].style.flexWrap = 'wrap';
            sectionEntry[1].style.justifyContent = 'center';
            pageDiv.appendChild(sectionEntry[1]);
        });
        container.appendChild(pageDiv);
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
    displayVariables();
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

                        displayVariables();
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
        document.getElementById('loadPresetSuccess').querySelector('h3').innerText = `Successfully loaded preset: ${preset.name}`;

        presetLoaded = true;

        // set preset as query parameter
        const url = new URL(window.location.href);
        url.searchParams.set('preset', JSON.stringify(preset));
        window.history.pushState({}, '', url);
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
