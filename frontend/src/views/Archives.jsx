import React from 'react';
import ArchiveChart from '../components/archive/ArchiveChart';
import ArchiveTable from '../components/archive/ArchiveTable';

/**
 * Archives Page View
 * Displays environmental data trends and historical logs.
 */
const Archives = () => {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <ArchiveChart />
            <ArchiveTable />
        </div>
    );
};

export default Archives;
