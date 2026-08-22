import { useState, useCallback } from 'react';

export interface PaginatedListState {
  page: number;
  rowsPerPage: number;
  search: string;
  searchInput: string;
}

export interface PaginatedListActions {
  setPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  setSearch: (value: string) => void;
  setSearchInput: (value: string) => void;
  handlePageChange: (_: unknown, newPage: number) => void;
  handleRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchSubmit: () => void;
  resetPage: () => void;
}

export function usePaginatedList(defaultRowsPerPage = 20): PaginatedListState & PaginatedListActions {
  const [page, setPageRaw] = useState(0);
  const [rowsPerPage, setRowsPerPageRaw] = useState(defaultRowsPerPage);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const setPage = useCallback((p: number) => setPageRaw(p), []);

  const setRowsPerPage = useCallback((rows: number) => {
    setRowsPerPageRaw(rows);
    setPageRaw(0);
  }, []);

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPageRaw(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageRaw(parseInt(event.target.value, 10));
    setPageRaw(0);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setSearch(searchInput);
    setPageRaw(0);
  }, [searchInput]);

  const resetPage = useCallback(() => setPageRaw(0), []);

  return {
    page,
    rowsPerPage,
    search,
    searchInput,
    setPage,
    setRowsPerPage,
    setSearch,
    setSearchInput,
    handlePageChange,
    handleRowsPerPageChange,
    handleSearchSubmit,
    resetPage,
  };
}
