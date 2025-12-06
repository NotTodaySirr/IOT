import React, { useState } from 'react';
import VintagePanel from '../ui/VintagePanel';
import VintageTable from '../ui/VintageTable';
import Pagination from '../common/Pagination';
import useTableHistory from '../../hooks/useTableHistory';

/**
 * Archive Table Component
 * Self-contained data log table with date picker and pagination.
 */
const ArchiveTable = () => {
    const [tableDate, setTableDate] = useState(new Date().toISOString().split('T')[0]);
    const { tableData, page, setPage, totalPages, totalRecords, loading } = useTableHistory(tableDate);

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
        <VintagePanel title="DATA LOG (CLOUD SYNC)" className="flex-1 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-2 px-1">
                <div className="text-vintage-coffee font-mono text-sm">
                    Total Records: {totalRecords}
                </div>
                <input
                    type="date"
                    value={tableDate}
                    onChange={(e) => setTableDate(e.target.value)}
                    className="bg-vintage-paper border border-vintage-coffee text-vintage-coffee font-mono text-sm p-1 rounded focus:outline-none focus:ring-1 focus:ring-vintage-coffee"
                />
            </div>

            <div className="flex-1 relative min-h-0 flex flex-col">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-vintage-coffee font-mono animate-pulse">
                        LOADING RECORDS...
                    </div>
                ) : (
                    <VintageTable
                        columns={columns}
                        data={tableData}
                        renderRow={renderRow}
                        emptyMessage={`NO RECORDS FOUND FOR ${tableDate}`}
                    />
                )}
            </div>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                className="mt-2 border-t border-vintage-coffee/20 pt-2"
            />
        </VintagePanel>
    );
};

export default ArchiveTable;
