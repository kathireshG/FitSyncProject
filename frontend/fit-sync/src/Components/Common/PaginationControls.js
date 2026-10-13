import React from "react";

function PaginationControls({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-3 mt-4" aria-label="Pagination">
      <button
        type="button"
        className="border rounded px-3 py-1 disabled:opacity-50"
        disabled={!pagination.hasPreviousPage}
        onClick={() => onPageChange(pagination.page - 1)}
      >
        Previous
      </button>
      <span className="text-sm text-gray-600">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <button
        type="button"
        className="border rounded px-3 py-1 disabled:opacity-50"
        disabled={!pagination.hasNextPage}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Next
      </button>
    </nav>
  );
}

export default PaginationControls;
