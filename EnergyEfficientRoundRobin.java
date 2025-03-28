import java.util.*;

public class EnergyEfficientRoundRobin {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // User input for number of processes
        System.out.print("Enter the number of processes: ");
        int n = sc.nextInt();

        // Ask if energy efficiency should be considered
        System.out.print("Do you want to use Energy Usage? (1 for Yes, 0 for No): ");
        boolean useEnergy = sc.nextInt() == 1;

        int timeQuantum = 0;
        if (!useEnergy) {
            System.out.print("Enter the fixed time quantum: ");
            timeQuantum = sc.nextInt();
        }

        // Process properties
        int[] processId = new int[n];
        int[] arrivalTime = new int[n];
        int[] burstTime = new int[n];
        int[] remainingTime = new int[n];
        int[] completionTime = new int[n];
        int[] turnaroundTime = new int[n];
        int[] waitingTime = new int[n];
        int[] responseTime = new int[n];
        int[] energyUsage = new int[n]; // Energy usage (1-10 scale)
        boolean[] isFirstResponse = new boolean[n];

        // Input process details
        for (int i = 0; i < n; i++) {
            processId[i] = i + 1;
            System.out.print("Enter arrival time of P" + processId[i] + ": ");
            arrivalTime[i] = sc.nextInt();
            System.out.print("Enter burst time of P" + processId[i] + ": ");
            burstTime[i] = sc.nextInt();
            remainingTime[i] = burstTime[i];
            isFirstResponse[i] = true;

            if (useEnergy) {
                System.out.print("Enter energy usage of P" + processId[i] + " (1-10, where 1 is lowest power, 10 is highest power): ");
                energyUsage[i] = sc.nextInt();
            } else {
                energyUsage[i] = 0; // Not used if energy mode is off
            }
        }

        Queue<Integer> queue = new LinkedList<>();
        int currentTime = 0, completed = 0;
        boolean[] isInQueue = new boolean[n];
        
        // Initialize performance data
        int totalEnergyUsage = 0;
        int totalExecutionTime = 0;
        int totalCPUTime = 0;

        while (completed < n) {
            // Add arriving processes to queue
            for (int i = 0; i < n; i++) {
                if (arrivalTime[i] <= currentTime && !isInQueue[i] && remainingTime[i] > 0) {
                    queue.add(i);
                    isInQueue[i] = true;
                }
            }

            if (queue.isEmpty()) {
                currentTime++;
                continue;
            }

            int idx = queue.poll();

            if (isFirstResponse[idx]) {
                responseTime[idx] = currentTime - arrivalTime[idx];
                isFirstResponse[idx] = false;
            }

            // Determine time quantum based on energy usage (if enabled)
            int quantum = useEnergy ? getDynamicTimeSlice(energyUsage[idx]) : timeQuantum;
            int execTime = Math.min(quantum, remainingTime[idx]);

            // Display the process and time quantum
            System.out.println("\nExecuting Process P" + processId[idx] + " | Time Slice: " + execTime
                    + (useEnergy ? " (Energy Aware)" : " (Fixed)"));

            // Update total energy and CPU time
            totalEnergyUsage += energyUsage[idx] * execTime;
            totalCPUTime += execTime;

            currentTime += execTime;
            remainingTime[idx] -= execTime;

            // Add new arriving processes to queue
            for (int i = 0; i < n; i++) {
                if (arrivalTime[i] <= currentTime && !isInQueue[i] && remainingTime[i] > 0) {
                    queue.add(i);
                    isInQueue[i] = true;
                }
            }

            if (remainingTime[idx] > 0) {
                queue.add(idx);
            } else {
                completionTime[idx] = currentTime;
                turnaroundTime[idx] = completionTime[idx] - arrivalTime[idx];
                waitingTime[idx] = turnaroundTime[idx] - burstTime[idx];
                completed++;
            }
        }

        // Calculate CPU Utilization and Execution Time
        totalExecutionTime = currentTime;
        double cpuUtilization = (double) totalCPUTime / totalExecutionTime * 100;

        // Display the result
        System.out.println("\nProcess\tAT\tBT\tCT\tTAT\tWT\tRT");
        for (int i = 0; i < n; i++) {
            System.out.println("P" + processId[i] + "\t" + arrivalTime[i] + "\t" + burstTime[i] + "\t"
                    + completionTime[i] + "\t" + turnaroundTime[i] + "\t" + waitingTime[i] + "\t" + responseTime[i]);
        }

        // Print performance data
        System.out.println("\nPerformance Metrics:");
        System.out.println("Total Energy Usage: " + totalEnergyUsage);
        System.out.println("Total CPU Time: " + totalCPUTime);
        System.out.println("Total Execution Time: " + totalExecutionTime);
        System.out.println("CPU Utilization: " + cpuUtilization + "%");

        sc.close();
    }

    // Function to determine dynamic time quantum based on energy usage
    public static int getDynamicTimeSlice(int energyUsage) {
        if (energyUsage <= 2) return 6; // Low energy usage → Longer time slice
        if (energyUsage <= 5) return 4; // Medium energy usage → Normal time slice
        return 2; // High energy usage → Shorter time slice
    }
}
