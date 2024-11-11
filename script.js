document.getElementById('fileInput').addEventListener('change', handleFileUpload);
document.getElementById('generateReportButton').addEventListener('click', generateReport);

let studentsData = [];
let chartInstances = [];

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        Papa.parse(file, {
            header: true,
            complete: function (results) {
                studentsData = results.data;
                populateStudentSelect(studentsData);
            }
        });
    }
}

function populateStudentSelect(data) {
    const studentSelect = document.getElementById('studentSelect');
    studentSelect.innerHTML = ''; // Clear previous options
    const uniqueStudents = [...new Set(data.map(item => item['Student Number']))];
    uniqueStudents.forEach((studentNumber, index) => {
        const option = document.createElement('option');
        option.value = studentNumber;
        option.textContent = studentNumber;
        studentSelect.appendChild(option);
    });
}

function generateReport() {
    const selectedStudentNumber = document.getElementById('studentSelect').value;
    const studentData = studentsData.filter(item => item['Student Number'] === selectedStudentNumber);
    document.getElementById('studentName').innerText = selectedStudentNumber;

    chartInstances.forEach(chart => chart.destroy());
    chartInstances = [];

    // Process historical data
    const labels = studentData.map(item => item['Assessment Period']);

    const createDataset = (label, dataKey) => {
        return {
            label: label,
            data: studentData.map(item => parseFloat(item[dataKey])),
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 5,
            fill: true
        };
    };

    const skillCategories = [
        { id: 'generalAppearanceChart', key: "Good General appearance", label: "General Appearance" },
        { id: 'willingnessToListenChart', key: "Willingness to listen and ask questions", label: "Willingness to Listen" },
        { id: 'willingnessToCooperateChart', key: "Willing to co-operate", label: "Willingness to Cooperate" },
        { id: 'effortAndEngagementChart', key: "Shows effort and engagement during sessions", label: "Effort and Engagement" },
        { id: 'identifyFeelingsChart', key: "Ability to identify and name their feelings and emotions", label: "Identify Feelings" },
        { id: 'senseOfSelfChart', key: "Ability to demonstrate a strong sense of self", label: "Sense of Self" },
        { id: 'empathyChart', key: "Ability to show empathy when appropriate", label: "Empathy" },
        { id: 'expressFeelingsVerballyChart', key: "Willingness to express feelings and emotions verbally", label: "Express Feelings Verbally" },
        { id: 'expressFeelingsThroughArtChart', key: "Willingness to express feelings and emotions through artwork", label: "Express Feelings Through Art" },
        { id: 'imaginationOriginalityChart', key: "Demonstrates imagination  and originality through their works.", label: "Imagination and Originality" },
        { id: 'completeArtProjectsChart', key: "Ability to complete art projects as instructed", label: "Complete Art Projects" },
        { id: 'shareArtisticWorkChart', key: "Willingness to show and share artistic work done with others", label: "Share Artistic Work" },
        { id: 'experimentWithArtMaterialsChart', key: "Willingness to experiment with art materials", label: "Experiment with Art Materials" },
        { id: 'useAbstractionChart', key: "Ability to use abstraction in their works or titles", label: "Use Abstraction" },
        { id: 'concentrateFollowInstructionsChart', key: "Willingness to concentrate, listen and follow facilitator's instructions", label: "Concentrate and Follow Instructions" },
        { id: 'appreciationForOthersChart', key: "Shows appreciation for others", label: "Appreciation for Others" },
        { id: 'interactWithFacilitatorsChart', key: "Ability to interact with facilitators and others", label: "Interact with Facilitators" },
        { id: 'problemSolvingSkillsChart', key: "Ability to demonstrate good problem solving skills in class", label: "Problem Solving Skills" },
        { id: 'shareToolsMaterialsChart', key: "Willing to freely share tools and art materials with others", label: "Share Tools and Materials" },
        { id: 'perseveranceDuringTasksChart', key: "Level of perseverance during difficult tasks", label: "Perseverance During Tasks" },
        { id: 'keepCalmChart', key: "Ability to keep calm when faced with a challenge or uncertainty", label: "Keep Calm" },
        { id: 'selfConfidenceChart', key: "Displays self-confidence", label: "Self-Confidence" },
        { id: 'solveProblemsChart', key: "Ability to solve problems", label: "Solve Problems" },
        { id: 'leadershipInitiativeChart', key: "Ability to demonstrate leadership or take intiative", label: "Leadership or Initiative" }
    ];

    skillCategories.forEach(category => {
        const ctx = document.getElementById(category.id).getContext('2d');
        const dataset = createDataset(category.label, category.key);
        
        const type = dataset.data.length === 1 ? 'bar' : 'line';

        const chart = new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [dataset]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        ticks: {
                            font: {
                                size: 24
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                size: 24
                            }
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: category.label,
                        font: {
                            size: 30
                        }
                    },
                    legend: {
                        labels: {
                            font: {
                                size: 24
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        bodyFont: {
                            size: 24
                        },
                        titleFont: {
                            size: 24
                        }
                    }
                }
            }
        });
        chartInstances.push(chart);
    });
}
