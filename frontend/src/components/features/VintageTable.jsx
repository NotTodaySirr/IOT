import React from 'react';

const VintageTable = ({ columns, data, renderRow, emptyMessage = 'NO DATA LOGGED YET...' }) => {
    return (
        <div className="overflow-y-auto flex-1 custom-scrollbar pr-2">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 bg-vintage-tan z-10">
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} className="border-b-2 border-vintage-coffee p-2">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((row, idx) => renderRow(row, idx))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="p-4 text-center opacity-50 italic">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default VintageTable;
