let preset = null
let data = null;

const font_size_title = 20;
const font_size_legend = 12;
const font_size_label = 12;
const font_size_tooltip = 18;

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
                <select class="variable-input p-2 border rounded border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" id="${variable.name}" name="${variable.name}">
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
    // add preset selector at the end
    const div = document.createElement('div');
    div.classList.add('variable');
    div.innerHTML = `<label for="presetSelect">Preset: </label>`;
    var presetSelectCopy = document.getElementById("presetSelect").cloneNode(true);
    presetSelectCopy.value = document.getElementById("presetSelect").value;
    presetSelectCopy.id += "Copy";
    div.appendChild(presetSelectCopy);
    variablesSection.appendChild(div);
    presetSelectCopy.addEventListener(
        'change',
        async function() {
            // populate input with new preset
            const parsedValue = JSON.parse(presetSelectCopy.value);
            presetInput.value = JSON.stringify(parsedValue, null, 4);
            // save currently selected values
            let presetValue = presetSelectCopy.value;
            let studentName = document.getElementById('Student Name').value;
            // trigger data loading
            await document.getElementById('loadPresetDataBtn').click();
            // reset select values to current selection
            document.getElementById('Student Name').value = studentName;
            document.getElementById("presetSelectCopy").value = presetValue;
        },
        false
    );
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
    const studentName = document.getElementById("Student Name").value;
    const presetCharts = document.getElementById('presetCharts');
    const presetDescription = document.querySelector('#presetDescription');
    const presetTitle = document.querySelector('#presetTitle');

    html2canvas(presetCharts).then(canvas => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const charts = presetCharts.querySelectorAll('canvas');
        const margin = 10;
        const pageHeight = 297; // A4 height in mm
        const pageWidth = 210; // A4 width in mm
        const contentWidth = 0.8 * pageWidth;
        const pieChartWidth = (contentWidth - 3 * margin) / 2;
        
        let yOffset = 40; // Start below the title
        let xOffset = margin;
        let previousImgHeight = 0;

        doc.setFontSize(16);
        doc.text(`Development report for ${studentName}`, 105, 20, null, null, 'center');
        doc.text(presetDescription.innerText, 105, 30, null, null, 'center');

        charts.forEach((canvas, index) => {
            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);

            const isPieChart = preset.charts[index] && preset.charts[index].type === 'pie';
            const imgWidth = isPieChart ? pieChartWidth : contentWidth;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            // New row if overflow
            if (xOffset + imgWidth > pageWidth) {
                xOffset = margin;
                yOffset += previousImgHeight + margin;
            }

            // New page if overflow
            if (yOffset + imgHeight > pageHeight - margin) {
                doc.addPage();
                yOffset = margin;
                xOffset = margin;
            }

            let imgX = xOffset;
            let verticalShift = false

            if (isPieChart) {
                xOffset += imgWidth + margin;    
                // Prepare for next row if two pie charts are placed
                if (xOffset + imgWidth > contentWidth) {
                    xOffset = margin;
                    verticalShift = true;
                }
            } else {
                imgX = (210 - imgWidth) / 2; // Center non-pie images
                verticalShift = true
            }
            doc.addImage(imgData, 'PNG', imgX, yOffset, imgWidth, imgHeight);

            previousImgHeight = imgHeight;
            if (verticalShift) {
                yOffset += imgHeight + margin; // Increment yOffset after placing
            }
        });

        // Footer
        doc.setFontSize(10);
        for (let i = 1; i <= doc.internal.getNumberOfPages(); i++) {
            doc.setPage(i);
            doc.text(`Page ${i} (${studentName})`, 105, pageHeight - margin, null, null, 'center');
        }

        const fileName = studentName 
            ? `report_${presetTitle.innerText.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${studentName}.pdf`
            : 'report.pdf';
        doc.save(fileName);
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

const semanticColors = [ // performance code = index of the color in the array
    'rgba(239, 241, 242, 1)', // undefined
    'rgba(170, 8, 8, 1)', // negative
    'rgba(231, 101, 0, 1)', // critical
    'rgba(120, 143, 166, 1)', // neutral
    'rgba(4, 108, 122, 1)', // positive
    'rgba(37, 111, 58, 1)', // excellent 
];

function getSemanticColorByPerformanceCode(code) {
    const colorIndex = code ;
    if (colorIndex > 0 && colorIndex < semanticColors.length ) {
        return semanticColors[colorIndex];
    }
    // Default color
    return semanticColors[0]; // undefined 
}

function getSemanticColorByLabel(label) {
    const code = extractCodeFromLabel(label);
    return getSemanticColorByPerformanceCode(code);
}

function getSemanticBorderColorByPerformanceCode(code) {
    const semanticColor = getSemanticColorByPerformanceCode(code);
    return makeDarkerColor(semanticColor);
}

function getSemanticBorderColorByLabel(label) {
    const code = extractCodeFromLabel(label);
    return getSemanticBorderColorByPerformanceCode(code);
}

function makeDarkerColor(color) {
    // Extract r, g, b, a values using a regular expression
    const rgbaRegex = /rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/;
    const match = color.match(rgbaRegex);

    if (!match) {
        throw new Error('Invalid color format');
    }

    let r = parseInt(match[1], 10);
    let g = parseInt(match[2], 10);
    let b = parseInt(match[3], 10);
    const a = parseFloat(match[4]);

    r = Math.max(0, r - 10);
    g = Math.max(0, g - 10);
    b = Math.max(0, b - 10);

    // Construct the new rgba string
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function extractCodeFromLabel(label) {
    const code = parseInt(label.match(/^\d/)[0]);
    return code;
}

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
        // add busy indication
        insightsBtn.innerText = '';
        insightsBtn.insertAdjacentHTML('beforeend', '<svg class="animate-spin mt-0.5 mr-3 h-5 w-5 text-white" style="float: left" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">\n' +
            '      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>\n' +
            '      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>\n' +
            '    </svg>Loading...');

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
            // replace button with the generated insights
            insightsDiv.removeChild(insightsBtn);
            insightsDiv.classList.remove("text-center", "empty");
            insightsDiv.classList.add('markdown-content', 'border', 'rounded', 'p-4', 'my-4', 'bg-blue-100');

            // Convert Markdown to HTML and set it as the inner HTML of the div
            insightsDiv.innerHTML = marked(insights);

            container.appendChild(insightsDiv);
            return;
        }

        alert('Error generating insights');
    }

    const insightsDiv = document.createElement('div');
    insightsDiv.classList.add('markdown-content', 'text-center', 'border', 'rounded', 'p-4', 'my-4', 'bg-blue-100', 'empty');
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
        divContainer.style.paddingBottom = '30px'; // padding between charts
        divContainer.style.width = '45%';
        const canvas = document.createElement('canvas');

        pages[chartPage][chartSection].appendChild(divContainer);

        const filteredData = filterData(data, chart.config.filters);

        if (chart.type === 'line' || chart.type === 'bar') {
            const data = createBarLineChart(canvas, chart, filteredData);
            if (chart.config.type === 'grouped') {  
                divContainer.style.width = '80%'; // more space for the main chart
            }

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
            sectionEntry[1].style.gap = '20px';
            pageDiv.appendChild(sectionEntry[1]);
        });
        container.appendChild(pageDiv);
    });
}

function buildPieChart(ctx, type, dataAggregation, title = 'Pie Chart') {
    title = wrapString(title, 40);
    const dataValues = Object.values(dataAggregation);
    const total = dataValues.reduce((sum, value) => sum + value, 0);

    const labels = Object.keys(dataAggregation)
        .map((label, index) => {
            const percentage = (dataAggregation[label] / total * 100).toFixed(2) + '%';
            return `${label} (${percentage})`;
        })
        .sort(); // Sort the labels in ascending order

    return new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: labels.map((label) => getSemanticColorByLabel(label)),
                borderColor: labels.map((label) => getSemanticBorderColorByLabel(label)),
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
                        size: font_size_title
                    }
                },
                legend: {
                    labels: {
                        font: {
                            size: font_size_legend
                        }
                    }
                },
                datalabels: {
                    formatter: (value, context) => {
                        const percentage = Math.round(value / total * 100);
                        return percentage;
                    },
                    color: '#fff',
                    font: {
                        size: font_size_label
                    }
                },
                tooltip: {
                    enabled: true,
                    bodyFont: {
                        size: font_size_tooltip
                    },
                    titleFont: {
                        size: font_size_tooltip
                    }
                }
            }
        }
    });
}

function wrapString(value, maxLineLength = 10) {
    const words = value
        .toString()
        .split(" ");
    
    let line = '';
    const lines = []

    for (let word of words) {
        if (line.length === 0) {
            line = word;
            continue;
        }

        if (line.length + word.length > maxLineLength) {
            lines.push(line);
            line = word;
        } else {
            line += ' ' + word;
        }
    }
    lines.push(line);

    return lines;
}

function wrapValue(value) {
    return wrapString(this.getLabelForValue(value));
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
                            size: font_size_label
                        }
                    },
                    ticks: {
                        callback: wrapValue,
                        font: {
                            size: font_size_label
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: font_size_label
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: font_size_title
                    }
                },
                legend: {
                    labels: {
                        font: {
                            size: font_size_legend
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    bodyFont: {
                        size: font_size_tooltip
                    },
                    titleFont: {
                        size: font_size_tooltip
                    }
                },
                wrapLabels: {}
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
        // const url = new URL(window.location.href);
        // url.searchParams.set('preset', JSON.stringify(preset));
        // window.history.pushState({}, '', url);
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
