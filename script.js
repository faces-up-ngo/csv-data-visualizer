let allData = null;
let data = null;

const chartsContainer = document.getElementById('chartsContainer');
const chartsGenerationContainer = document.getElementById('chartsGenerationContainer');
const dataLoadedContainer = document.getElementById('dataLoadedContainer');
const pdfChartsContainer = document.getElementById('pdfContainer');
const addFilterBtn = document.getElementById('addFilterBtn');
const filtersContainer = document.getElementById('filtersContainer');
const chartTypeSelect = document.getElementById('chartType');

function filterData() {
    const filters = filtersContainer.querySelectorAll(':scope > div');
    let filteredData = allData.slice(1);

    filters.forEach(filter => {
        const filterBy = filter.querySelectorAll('div')[0].querySelector('select').value;
        const filterValue = filter.querySelectorAll('div')[1].querySelector('select').value;

        if (filterBy === '-1' || filterValue === '-1') {
            return;
        }

        filteredData = filteredData.filter(row => row[filterBy] === filterValue);
    });

    data = filteredData;
}

addFilterBtn.addEventListener('click', () => {
    const filtersSection = document.createElement('div');

    filtersSection.classList.add('flex', 'flex-col', 'mb-4', 'mt-4', 'gap-4', 'p-2', 'border', 'border-gray-300', 'rounded');

    const filterBy = buildSelect('Filter by', buildColumnOptions(true));
    filtersSection.appendChild(filterBy);

    const filterValue = buildSelect('Filter value', []);
    filterValue.style.display = 'none';
    filtersSection.append(filterValue);

    const removeFilterBtn = document.createElement('button');
    removeFilterBtn.innerText = 'Remove';
    removeFilterBtn.classList.add('bg-red-500', 'text-white', 'py-2', 'px-4', 'rounded', 'hover:bg-red-700');
    removeFilterBtn.style.width = 'fit-content';
    removeFilterBtn.addEventListener('click', () => {
        filtersSection.remove();
        filterData();
    });
    filtersSection.appendChild(removeFilterBtn);

    filterBy.querySelector('select').addEventListener('change', () => {
        if (filterBy.querySelector('select').value === '-1') {
            filterValue.style.display = 'none';
            return;
        }

        filterValue.style.display = 'block';
        const filterByValue = filterBy.querySelector('select').value;
        filterValue.querySelector('select').innerHTML = '';
        const options = buildRowValueOptions(filterByValue);
        options.forEach(option => {
            filterValue.querySelector('select').appendChild(option);
        });

        filterValue.querySelector('select').addEventListener('change', (event) => {
            // How to get the text from the selected value
            const column = filterBy.querySelector('select').value;
            const value = event.target.options[event.target.selectedIndex].text;

            data = allData.filter(row => row[column] === value);
        });
    });

    filtersContainer.appendChild(filtersSection);
});

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
                        data = [...results.data.slice(1)];
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
    doc.text('FacesUP', 105, 20, null, null, 'center');
    doc.setFontSize(16);
    // Add all Filters
    // Find only top level divs
    const filters = filtersContainer.querySelectorAll(':scope > div');

    let position = 30;
    filters.forEach(filter => {
        console.log(filter);
        const filterBy = filter.querySelectorAll('div')[0].querySelector('select').value;

        const filterBySelect = filter.querySelectorAll('div')[1].querySelector('select');
        const filterByValue = filterBySelect.value;
        const filterByText = filterBySelect.options[filterBySelect.selectedIndex].text;

        if (filterBy === '-1' || filterByValue === '-1') {
            return;
        }

        doc.text(`Filter By: ${allData[0][filterBy]} - ${filterByText}`, 105, position, null, null, 'center');
        position += 10;
    });

    // Hide buttonsContainer and show chartsContainer
    chartsContainer.querySelectorAll('button').forEach(btn => btn.style.display = 'none');

    html2canvas(chartsContainer).then(canvas => {
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

        doc.save('exported-content.pdf');
        chartsContainer.querySelectorAll('button').forEach(btn => btn.style.display = 'block');
    });
});

document.getElementById('loadData')
    .addEventListener('click', () => {
        allData = Papa.parse(document.getElementById('csvInput').value).data;
        data = [...allData.slice(1)];
        hideDataLoadingContainer();
        showDataLoaded();
        showChartsGeneration();
    });

function buildSelectOption(index, value) {
    const option = document.createElement('option');
    option.value = index;
    option.text = value;
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

function buildColumnOptions(addEmptyOption = false) {
    const options = allData[0].map((column, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = column;
        return option;
    });

    if (addEmptyOption) {
        options.unshift(buildSelectOption(-1, ''));
    }

    return options;
}

function buildRowValueOptions(column) {
    const options = [...new Set(allData.slice(1).map(row => row[column]))].map((value, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = value;
        return option;
    });

    options.unshift(buildSelectOption(-1, ''));

    return options;
}

const COLUMN_TO_EXCLUDE_CLASS = 'column-to-exclude';
const COLUMN_TO_INCLUDE_CLASS = 'column-to-include';

document.getElementById('chartType')
    .addEventListener('change', () => {
        const chartType = document.getElementById('chartType').value;

        const optionsContainer = document.getElementById('optionsContainer');

        if (chartType !== '') {
            optionsContainer.style.display = 'block';
        } else {
            optionsContainer.style.display = 'none';
        }

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
            return;
        }

        if (chartType === 'pie' || chartType === 'doughnut') {
            const gridContainer = document.createElement('div');
            gridContainer.classList.add('grid', 'grid-cols-2', 'gap-4');

            const includeContainer = document.createElement('div');
            const includeLabel = document.createElement('label');
            includeLabel.innerText = 'Columns to include';
            const addIncludeBtn = document.createElement('button');
            addIncludeBtn.innerText = 'Add';
            addIncludeBtn.style.marginLeft = '10px';
            addIncludeBtn.classList.add('bg-blue-500', 'text-white', 'py-2', 'px-4', 'rounded', 'hover:bg-blue-700');
            addIncludeBtn.style.width = 'fit-content';
            addIncludeBtn.addEventListener('click', () => {
                const columnToInclude = buildSelect('', buildColumnOptions(), true);
                columnToInclude.style.marginTop = '10px';
                columnToInclude.querySelector('select').classList.add(COLUMN_TO_INCLUDE_CLASS);
                includeContainer.appendChild(columnToInclude);
            });

            includeContainer.appendChild(includeLabel);
            includeContainer.appendChild(addIncludeBtn);

            const excludeContainer = document.createElement('div');
            const excludeLabel = document.createElement('label');
            excludeLabel.innerText = 'Columns to exclude';
            const addExcludeBtn = document.createElement('button');
            addExcludeBtn.innerText = 'Add';
            addExcludeBtn.style.marginLeft = '10px';
            addExcludeBtn.classList.add('bg-blue-500', 'text-white', 'py-2', 'px-4', 'rounded', 'hover:bg-blue-700');
            addExcludeBtn.style.width = 'fit-content';
            addExcludeBtn.addEventListener('click', () => {
                const columnToExclude = buildSelect('', buildColumnOptions(), true);
                columnToExclude.style.marginTop = '10px';
                columnToExclude.querySelector('select').classList.add(COLUMN_TO_EXCLUDE_CLASS);
                excludeContainer.appendChild(columnToExclude);
            });

            excludeContainer.appendChild(excludeLabel);
            excludeContainer.appendChild(addExcludeBtn);

            gridContainer.appendChild(includeContainer);
            gridContainer.appendChild(excludeContainer);
            gridContainer.style.marginTop = '10px';

            // Create title input for the pie chart
            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.id = 'chartTitle';
            titleInput.placeholder = 'Chart title';
            titleInput.classList.add('p-2', 'border', 'border-gray-300', 'rounded');
            optionsContainer.appendChild(titleInput);

            optionsContainer.appendChild(gridContainer);
        }
    });

// ...existing code...

document.getElementById('generateBtn').addEventListener('click', () => {
    const optionsContainer = document.getElementById('optionsContainer');
    const chartType = chartTypeSelect.value;

    if (chartType === 'pie' || chartType === 'doughnut') {
        const columnsToInclude = Array.from(optionsContainer.querySelectorAll(`.${COLUMN_TO_INCLUDE_CLASS}`)).map(select => select.value);
        const columnsToExclude = Array.from(optionsContainer.querySelectorAll(`.${COLUMN_TO_EXCLUDE_CLASS}`)).map(select => select.value);

        const dataWithoutColumns = data.map(row => {
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

        const title = document.getElementById('chartTitle').value || 'Pie Chart';

        const ctx = canvas.getContext('2d');
        const chart = buildPieChart(ctx, pieAggregation, title);
        charts.push(chart);

        chartsContainer.appendChild(canvasContainer);

        return;
    }

    if (chartType === 'line' || chartType === 'bar') {
        const optionsSelects = optionsContainer.querySelectorAll('select');

        const xAxisColumn = optionsSelects[0].value;
        const yAxisColumns = [...optionsSelects].slice(1).map(select => select.value);

        const chartType = document.getElementById('chartType').value;

        const labels = data.map(row => row[xAxisColumn]);

        const dataSets = yAxisColumns.map((yAxisColumn, index) => {
            const mappedData = data.map(row => parseFloat(row[yAxisColumn]));
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
    }
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

function buildPieChart(ctx, dataAggregation, title = 'Pie Chart') {
    const labels = Object.keys(dataAggregation);
    const dataValues = Object.values(dataAggregation);

    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: labels.map(() => getRandomColor()),
                borderColor: labels.map(() => getRandomColor()),
                borderWidth: 3
            }]
        },
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