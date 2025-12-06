import React, { useState } from 'react';
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
import VintagePanel from '../ui/VintagePanel';
import VintageButton from '../ui/VintageButton';
import useChartHistory from '../../hooks/useChartHistory';

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

/**
 * Archive Chart Component
 * Self-contained chart with time range filter buttons.
 */
const ArchiveChart = () => {
    const [chartRange, setChartRange] = useState('24H');
    const { chartData, loading } = useChartHistory(chartRange);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                grid: { color: 'rgba(121, 85, 72, 0.1)' },
                ticks: {
                    color: '#795548',
                    font: { family: 'IBM Plex Mono' },
                    maxTicksLimit: 10
                }
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
                bodyFont: { family: 'IBM Plex Mono' },
                intersect: false,
                mode: 'index',
            }
        }
    };

    return (
        <VintagePanel title="ENVIRONMENTAL TRENDS" className="flex-1 min-h-[350px] flex flex-col">
            <div className="flex justify-end space-x-2 mb-2">
                {['24H', '7D', '1M', 'ALL'].map(range => (
                    <VintageButton
                        key={range}
                        onClick={() => setChartRange(range)}
                        className={`!px-3 !py-1 text-xs ${chartRange === range ? 'bg-vintage-coffee text-vintage-cream' : ''}`}
                    >
                        {range}
                    </VintageButton>
                ))}
            </div>
            <div className="flex-1 relative w-full h-full min-h-0">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-vintage-coffee font-mono animate-pulse">
                        FETCHING DATA...
                    </div>
                ) : (
                    <Line data={chartData} options={chartOptions} />
                )}
            </div>
        </VintagePanel>
    );
};

export default ArchiveChart;
