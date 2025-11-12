import React, { useState } from 'react';
import { EnhancedDataTable } from '@/components/DataTable';
import { useClientPages, useDeleteClientPage } from '@/hooks/api/useClientPages';
import { showSuccess, showError, showPromise } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { OpenAPI } from '@/client';

interface EnhancedClientPagesListProps {
  clientId: string;
}

/**
 * Enhanced Client Pages List Component
 *
 * Wraps the EnhancedDataTable with API integration for fetching, exporting, and deleting client pages.
 * This component handles all the data fetching logic and provides handlers for bulk operations.
 *
 * Usage:
 * ```tsx
 * <EnhancedClientPagesList clientId="your-client-uuid" />
 * ```
 */
export const EnhancedClientPagesList: React.FC<EnhancedClientPagesListProps> = ({
  clientId,
}) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Fetch client pages with pagination
  const { data, isLoading, refetch } = useClientPages({
    client_id: clientId,
    page,
    page_size: pageSize,
  });

  // Delete mutation
  const deletePageMutation = useDeleteClientPage();

  /**
   * Handle export of selected pages
   * Downloads a CSV file with the selected pages
   */
  const handleExport = async (selectedIds: string[]) => {
    try {
      // Build export URL with parameters
      const params = new URLSearchParams({
        client_id: clientId,
        format: 'csv',
        page_ids: selectedIds.join(','),
      });

      const exportUrl = `${OpenAPI.BASE}/api/client-pages/export?${params}`;

      // Use fetch to download the file
      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          ...OpenAPI.HEADERS,
        },
        credentials: OpenAPI.WITH_CREDENTIALS ? 'include' : 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `pages-export-${Date.now()}.csv`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccess(`Exported ${selectedIds.length} pages successfully`);
    } catch (error: any) {
      console.error('Export error:', error);
      showError(error.message || 'Failed to export pages');
    }
  };

  /**
   * Handle bulk deletion of selected pages
   * Shows confirmation dialog and deletes pages one by one
   */
  const handleDelete = async (selectedIds: string[]) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} page${selectedIds.length !== 1 ? 's' : ''}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      // Delete all selected pages
      const deletePromise = Promise.all(
        selectedIds.map((id) => deletePageMutation.mutateAsync(id))
      );

      await showPromise(deletePromise, {
        loading: `Deleting ${selectedIds.length} pages...`,
        success: `Successfully deleted ${selectedIds.length} pages`,
        error: 'Failed to delete some pages',
      });

      // Refresh the data
      await refetch();

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['client-pages'],
      });
      queryClient.invalidateQueries({
        queryKey: ['client-page-count', clientId],
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      // Error is already shown by showPromise
    }
  };

  /**
   * Handle page change from pagination
   */
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  /**
   * Handle page size change from pagination
   */
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  return (
    <EnhancedDataTable
      clientId={clientId}
      data={data?.pages || []}
      totalCount={data?.total || 0}
      isLoading={isLoading}
      onExport={handleExport}
      onDelete={handleDelete}
    />
  );
};
