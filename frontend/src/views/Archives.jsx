import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import VintagePanel from '../components/ui/VintagePanel';
import VintageTable from '../components/features/VintageTable';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

const Archives = ({ history = [] }) => {
    const chartData = {
        labels: history.map(h => h.time),
        datasets: [
            {
                label: 'Temp (°C)',
                data: history.map(h => h.temp),
                borderColor: '#795548', // Vintage Coffee
                backgroundColor: '#795548',
                tension: 0.1,
                borderWidth: 2,
                pointRadius: 2,
            },
            {
                label: 'Humidity (%)',
                data: history.map(h => h.humidity),
                borderColor: '#2196F3', // Blue for humidity
                backgroundColor: '#2196F3',
                tension: 0.1,
                borderWidth: 2,
                pointRadius: 2,
            },
            {
                label: 'CO (PPM)',
                data: history.map(h => h.co),
                borderColor: '#ff6b6b', // Red for alert
                backgroundColor: '#ff6b6b',
                tension: 0.1,
                borderWidth: 2,
                pointRadius: 2,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: { color: 'rgba(121, 85, 72, 0.1)' }, // Faint coffee grid
                ticks: { color: '#795548', font: { family: 'IBM Plex Mono' } }
            },
            y: {
                grid: { color: 'rgba(121, 85, 72, 0.1)' },
                ticks: { color: '#795548', font: { family: 'IBM Plex Mono' } }
            }
        },
        plugins: {
            legend: {
                labels: { color: '#795548', font: { family: 'IBM Plex Mono' } }
            },
            tooltip: {
                backgroundColor: '#FAF3E0',
                titleColor: '#795548',
                bodyColor: '#795548',
                borderColor: '#795548',
                borderWidth: 1,
                titleFont: { family: 'IBM Plex Mono' },
                bodyFont: { family: 'IBM Plex Mono' }
            }
        }
    };

    const columns = ['TIMESTAMP', 'TEMP', 'HUMID', 'CO', 'STATUS'];

    const renderRow = (entry, idx) => (
        <tr key={idx} className="even:bg-vintage-coffee/5 hover:bg-vintage-coffee/10 transition-colors">
            <td className="p-2 border-b border-vintage-coffee/20 font-mono">{entry.time}</td>
            <td className="p-2 border-b border-vintage-coffee/20 font-mono">{entry.temp}°C</td>
            <td className="p-2 border-b border-vintage-coffee/20 font-mono">{entry.humidity}%</td>
            <td className={`p-2 border-b border-vintage-coffee/20 font-mono font-bold ${entry.co > 50 ? 'text-red-600 animate-pulse' : ''}`}>{entry.co} PPM</td>
            <td className={`p-2 border-b border-vintage-coffee/20 font-mono font-bold ${entry.status === 'DANGER' ? 'text-red-600' : entry.status === 'WARN' ? 'text-orange-600' : 'text-vintage-coffee'}`}>{entry.status}</td>
        </tr>
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Chart Section */}
            <VintagePanel title="ENVIRONMENTAL TRENDS" className="flex-1 min-h-[300px] flex flex-col">
                <div className="flex-1 relative w-full h-full min-h-0">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </VintagePanel>

            {/* Log Table Section */}
            <VintagePanel title="DATA LOG (CLOUD SYNC)" className="flex-1 min-h-[250px] flex flex-col">
                <VintageTable
                    columns={columns}
                    data={[...history].reverse()}
                    renderRow={renderRow}
                />
            </VintagePanel>
        </div>
    );
};

export default Archives;
