let allData = null;
let data = null;

const chartsContainer = document.getElementById('chartsContainer');
const chartsGenerationContainer = document.getElementById('chartsGenerationContainer');
const dataLoadedContainer = document.getElementById('dataLoadedContainer');
const pdfChartsContainer = document.getElementById('pdfContainer');
const charts = [];

function showChartsGeneration() {
    chartsGenerationContainer.style.display = 'block';
}

function showDataLoaded() {
    dataLoadedContainer.style.display = 'block';
}

function hideDataLoadingContainer() {
    document.getElementById('dataLoadingContainer').style.display = 'none';
}

document.getElementById('uploadData').addEventListener('click', () => {
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
                        allData = results.data;
                        console.log(allData);
                        const studentSelect = document.getElementById('studentSelect');
                        studentSelect.innerHTML = '';
                        const students = [...new Set(allData.slice(1).map(r => r[1]))];
                        studentSelect.appendChild(document.createElement('option'));
                        students.forEach(student => {
                            const option = document.createElement('option');
                            option.value = student;
                            option.text = student;
                            studentSelect.appendChild(option);
                        });
                        hideDataLoadingContainer();
                        showDataLoaded();
                        showChartsGeneration();
                    },
                    error: function (error) {
                        console.error('Error parsing CSV:', error);
                        alert('Error parsing CSV data.');
                    }
                });
            };
            reader.readAsText(file);
        }
    };
    fileInput.click();
});

document.getElementById('exportPdf').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title and subtitle
    doc.setFontSize(22);
    doc.text('FacesUP Student Overview', 105, 20, null, null, 'center');
    doc.setFontSize(16);
    doc.text(`Student: ${document.getElementById('studentSelect').value}`, 105, 30, null, null, 'center');

    // Hide buttonsContainer and show chartsContainer
    chartsContainer.querySelectorAll('button').forEach(btn => btn.style.display = 'none');

    html2canvas(chartsContainer).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;

        let position = 40;

        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        doc.save('exported-content.pdf');
        chartsContainer.querySelectorAll('button').forEach(btn => btn.style.display = 'block');
    });
});

document.getElementById('studentSelect')
    .addEventListener('change', () => {
        const student = document.getElementById('studentSelect').value;
        const studentData = allData.filter(row => row[1] === student);
        studentData.unshift(allData[0]);
        data = studentData
    });

document.getElementById('loadData')
    .addEventListener('click', () => {
        allData = Papa.parse(document.getElementById('csvInput').value).data;
        const studentSelect = document.getElementById('studentSelect');
        studentSelect.innerHTML = '';
        const students = [...new Set(allData.slice(1).map(r => r[1]))];
        studentSelect.appendChild(document.createElement('option'));
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student;
            option.text = student;
            studentSelect.appendChild(option);
        });

        hideDataLoadingContainer();
        showDataLoaded();
        showChartsGeneration();
    });

function buildSelectOption(index, value) {
    const option = document.createElement('option');
    option.value = index;
    option.text = column;
    return option;
}

function buildSelect(name, options, deleteBtn = false) {
    const axisContainer = document.createElement('div');
    const label = document.createElement('label');
    label.innerText = name;

    const select = document.createElement('select');
    select.classList.add('p-2', 'border', 'border-gray-300', 'rounded');
    select.style.marginLeft = '10px';
    select.id = `${name.toLowerCase()}Select`;

    options.forEach(option => {
        select.appendChild(option);
    });

    axisContainer.appendChild(label);
    axisContainer.appendChild(select);

    if (deleteBtn) {
        const delBtn = document.createElement('button');
        delBtn.innerText = 'Delete';
        delBtn.classList.add('bg-red-500', 'text-white', 'py-2', 'px-4', 'rounded', 'hover:bg-red-700');
        delBtn.style.marginLeft = '10px';
        delBtn.addEventListener('click', () => {
            axisContainer.remove();
        });
        axisContainer.appendChild(delBtn);
    }

    return axisContainer;
}

function buildColumnOptions() {
    const options = allData[0].map((column, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = column;
        return option;
    });

    return options;
}

document.getElementById('chartType')
    .addEventListener('change', () => {
        const chartType = document.getElementById('chartType').value;

        const optionsContainer = document.getElementById('optionsContainer');

        optionsContainer.innerHTML = '';

        if (chartType === 'line' || chartType === 'bar') {
            const xAxisContainer = buildSelect('X Axis', buildColumnOptions());
            const yAxisContainer = buildSelect('Y Axis', buildColumnOptions());

            optionsContainer.appendChild(xAxisContainer);
            optionsContainer.appendChild(yAxisContainer);

            const btn = document.createElement('button');
            btn.innerText = 'Add Y Axis';
            btn.classList.add('bg-purple-500', 'text-white', 'py-2', 'px-4', 'rounded', 'hover:bg-purple-700');
            btn.style.width = 'fit-content';
            optionsContainer.appendChild(btn);

            btn.addEventListener('click', () => {
                const yAxisContainer = buildSelect('Y Axis', buildColumnOptions(), true);
                optionsContainer.appendChild(yAxisContainer);
                optionsContainer.appendChild(btn);
            });
        }
    });

document.getElementById('generateBtn').addEventListener('click', () => {
    const optionsContainer = document.getElementById('optionsContainer');

    const optionsLabels = optionsContainer.querySelectorAll('label');
    const optionsSelects = optionsContainer.querySelectorAll('select');

    const xAxisColumn = optionsSelects[0].value;
    const yAxisColumns = [...optionsSelects].slice(1).map(select => select.value);

    const chartType = document.getElementById('chartType').value;

    const labels = data.map(row => row[xAxisColumn]).slice(1);

    const dataSets = yAxisColumns.map((yAxisColumn, index) => {
        const mappedData = data.map(row => parseFloat(row[yAxisColumn])).slice(1);
        return {
            label: allData[0][optionsSelects[index + 1].value],
            data: mappedData
        }
    });

    const canvasContainer = document.createElement('div');
    canvasContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    canvasContainer.style.width = '50%';

    const btnsContainer = document.createElement('div');
    btnsContainer.style.padding = '10px';
    btnsContainer.style.display = 'flex';
    btnsContainer.style.gap = '10px';

    const delBtn = document.createElement('button');
    delBtn.innerText = 'Delete';
    delBtn.classList.add('bg-red-500', 'text-white', 'py-2', 'px-4', 'rounded', 'hover:bg-red-700');
    delBtn.style.width = 'fit-content';
    delBtn.addEventListener('click', () => {
        canvasContainer.remove();
    });

    const increaseSizeBtn = document.createElement('button');
    increaseSizeBtn.innerText = '+';
    increaseSizeBtn.style.width = 'fit-content';
    increaseSizeBtn.classList.add('bg-blue-500', 'text-white', 'py-2', 'px-4', 'rounded', 'hover:bg-blue-700');
    increaseSizeBtn.addEventListener('click', () => {
        canvasContainer.style.width = '75%';
    });

    const decreaseSizeBtn = document.createElement('button');
    decreaseSizeBtn.innerText = '-';
    decreaseSizeBtn.style.width = 'fit-content';
    decreaseSizeBtn.classList.add('bg-blue-500', 'text-white', 'py-2', 'px-4', 'rounded', 'hover:bg-blue-700');
    decreaseSizeBtn.addEventListener('click', () => {
        canvasContainer.style.width = '50%';
    });

    btnsContainer.appendChild(increaseSizeBtn);
    btnsContainer.appendChild(decreaseSizeBtn);
    btnsContainer.appendChild(delBtn);

    canvasContainer.appendChild(btnsContainer);

    canvasContainer.classList.add('resizable-container');
    const canvas = document.createElement('canvas');

    canvasContainer.appendChild(canvas);
    canvas.id = `${charts.length}canvas`;

    if (charts.length === 0) {
        chartsContainer.appendChild(canvasContainer);
    } else {
        chartsContainer.insertBefore(canvasContainer, chartsContainer.children[0]);
    }

    const ctx = canvas.getContext('2d');
    const chart = buildChart(ctx, labels, dataSets, xAxisColumn, chartType);
    charts.push(chart);
});

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
    const randomIndex = Math.floor(Math.random() * chartColors.length);
    return chartColors[randomIndex];
}

function buildChart(ctx, labels, dataSets, xAxisColumn, chartType) {
    const dataArray = dataSets.map(data => {
        data.backgroundColor = getRandomColor();
        data.borderColor = getRandomColor();
        data.borderWidth = 3;
        return data;
    });

    console.log(dataArray);

    return new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: dataArray
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: allData[0][xAxisColumn],
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
                    title: {
                        display: true,
                        text: 'Data',
                        font: {
                            size: 18
                        }
                    },
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
                    text: `Data for ${allData[0][xAxisColumn]}`,
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