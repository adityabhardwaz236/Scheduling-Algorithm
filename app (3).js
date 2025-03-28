// Handle the "Generate Process Inputs" button click
document.getElementById('generateInputsBtn').addEventListener('click', function() {
    const numProcesses = parseInt(document.getElementById('numProcesses').value);
    const useEnergy = document.getElementById('useEnergy').checked;

    if (numProcesses < 1) {
        alert("Please enter a valid number of processes.");
        return;
    }

    generateProcessInputs(numProcesses, useEnergy);
});

// Generate process inputs dynamically
function generateProcessInputs(numProcesses, useEnergy) {
    const processInputsDiv = document.getElementById('processInputs');
    processInputsDiv.innerHTML = ''; // Clear any existing inputs

    for (let i = 0; i < numProcesses; i++) {
        const processDiv = document.createElement('div');
        processDiv.classList.add('process-input');

        const arrivalTimeInput = document.createElement('input');
        arrivalTimeInput.type = 'number';
        arrivalTimeInput.placeholder = `Arrival Time for P${i + 1}`;
        arrivalTimeInput.id = `arrivalTime${i}`;
        arrivalTimeInput.required = true;

        const burstTimeInput = document.createElement('input');
        burstTimeInput.type = 'number';
        burstTimeInput.placeholder = `Burst Time for P${i + 1}`;
        burstTimeInput.id = `burstTime${i}`;
        burstTimeInput.required = true;

        processDiv.appendChild(arrivalTimeInput);
        processDiv.appendChild(burstTimeInput);

        if (useEnergy) {
            const energyUsageInput = document.createElement('input');
            energyUsageInput.type = 'number';
            energyUsageInput.placeholder = `Energy Usage for P${i + 1}`;
            energyUsageInput.id = `energyUsage${i}`;
            energyUsageInput.required = true;
            processDiv.appendChild(energyUsageInput);
        }

        processInputsDiv.appendChild(processDiv);
    }

    const timeQuantumDiv = document.getElementById('timeQuantumInput');
    if (!useEnergy) {
        timeQuantumDiv.classList.remove('hidden');
    } else {
        timeQuantumDiv.classList.add('hidden');
    }
}

// Handle the "Start Simulation" button click
document.getElementById('submitBtn').addEventListener('click', function() {
    const numProcesses = parseInt(document.getElementById('numProcesses').value);
    const useEnergy = document.getElementById('useEnergy').checked;
    const timeQuantum = parseInt(document.getElementById('timeQuantum').value);

    const processData = [];
    for (let i = 0; i < numProcesses; i++) {
        const arrivalTime = parseInt(document.getElementById(`arrivalTime${i}`).value);
        const burstTime = parseInt(document.getElementById(`burstTime${i}`).value);
        const energyUsage = useEnergy ? parseInt(document.getElementById(`energyUsage${i}`).value) : 0;

        processData.push({
            id: i + 1,
            arrivalTime,
            burstTime,
            remainingTime: burstTime,
            energyUsage,
            isFirstResponse: true,
            completionTime: 0,
            turnaroundTime: 0,
            waitingTime: 0,
            responseTime: 0,
            isInQueue: false,
            assignedTimeQuantum: useEnergy ? getDynamicTimeSlice(energyUsage) : timeQuantum
        });
    }

    if (!useEnergy && isNaN(timeQuantum)) {
        alert("Please enter a valid time quantum.");
        return;
    }

    simulateRoundRobin(processData, useEnergy);
});

// Simulate Round Robin Scheduling
function simulateRoundRobin(processData, useEnergy) {
    const queue = [];
    let currentTime = 0;
    let completed = 0;

    let totalEnergyUsage = 0;
    let totalExecutionTime = 0;
    let totalCPUTime = 0;

    while (completed < processData.length) {
        processData.forEach((process, index) => {
            if (process.arrivalTime <= currentTime && !process.isInQueue && process.remainingTime > 0) {
                queue.push(index);
                process.isInQueue = true;
            }
        });

        if (queue.length === 0) {
            currentTime++;
            continue;
        }

        const idx = queue.shift();
        const process = processData[idx];

        if (process.isFirstResponse) {
            process.responseTime = currentTime - process.arrivalTime;
            process.isFirstResponse = false;
        }

        const actualExecTime = Math.min(process.assignedTimeQuantum, process.remainingTime);

        totalEnergyUsage += process.energyUsage * actualExecTime;
        totalCPUTime += actualExecTime;

        currentTime += actualExecTime;
        process.remainingTime -= actualExecTime;

        processData.forEach((p, i) => {
            if (p.arrivalTime <= currentTime && !p.isInQueue && p.remainingTime > 0) {
                queue.push(i);
                p.isInQueue = true;
            }
        });

        if (process.remainingTime > 0) {
            queue.push(idx);
        } else {
            process.completionTime = currentTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;
            completed++;
        }
    }

    totalExecutionTime = currentTime;
    const cpuUtilization = (totalCPUTime / totalExecutionTime) * 100;

    updateUI(processData, totalEnergyUsage, totalCPUTime, totalExecutionTime, cpuUtilization);
}

// Determine dynamic time slice based on energy usage
function getDynamicTimeSlice(energyUsage) {
    if (energyUsage <= 2) return 6;
    if (energyUsage <= 5) return 4;
    return 2;
}

// Update UI with results
function updateUI(processData, totalEnergyUsage, totalCPUTime, totalExecutionTime, cpuUtilization) {
    const processTable = document.getElementById('processTable').getElementsByTagName('tbody')[0];
    processTable.innerHTML = '';

    processData.forEach(process => {
        const row = processTable.insertRow();
        row.insertCell(0).innerText = `P${process.id}`;
        row.insertCell(1).innerText = process.arrivalTime;
        row.insertCell(2).innerText = process.burstTime;
        row.insertCell(3).innerText = process.completionTime;
        row.insertCell(4).innerText = process.turnaroundTime;
        row.insertCell(5).innerText = process.waitingTime;
        row.insertCell(6).innerText = process.responseTime;
        row.insertCell(7).innerText = process.assignedTimeQuantum;
    });

    document.getElementById('totalEnergyUsage').innerText = `Total Energy Usage: ${totalEnergyUsage}`;
    document.getElementById('totalCPUTime').innerText = `Total CPU Time: ${totalCPUTime}`;
    document.getElementById('totalExecutionTime').innerText = `Total Execution Time: ${totalExecutionTime}`;
    document.getElementById('cpuUtilization').innerText = `CPU Utilization: ${cpuUtilization.toFixed(2)}%`;
}

// Dark Mode Toggle Functionality
document.getElementById('darkModeToggle').addEventListener('change', function() {
    document.body.classList.toggle('dark-mode');
});
