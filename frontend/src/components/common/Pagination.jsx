import React from 'react';
import VintageButton from '../ui/VintageButton';

/**
 * Reusable Pagination component.
 * 
 * @param {object} props
 * @param {number} props.currentPage - Current page number (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {function} props.onPageChange - Callback when page changes
 * @param {string} props.className - Optional additional classes
 */
const Pagination = ({ currentPage, totalPages, onPageChange, className = '' }) => {
    return (
        <div className={`flex justify-between items-center ${className}`}>
            <VintageButton
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="!px-3 !py-1 text-xs"
            >
                PREV
            </VintageButton>
            <span className="font-mono text-vintage-coffee text-sm">
                PAGE {currentPage} OF {totalPages}
            </span>
            <VintageButton
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="!px-3 !py-1 text-xs"
            >
                NEXT
            </VintageButton>
        </div>
    );
};

export default Pagination;
