import React, { useRef } from 'react';

/**
 * Custom hook for horizontal table scroll functionality
 * Consolidates the scroll logic used across multiple table components
 * 
 * @param scrollAmount - Amount to scroll in pixels (default: 300)
 * @returns Object with tableScrollRef, scrollLeft, and scrollRight functions
 */
export const useTableScroll = (scrollAmount: number = 300) => {
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollToStart = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scrollToEnd = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ 
        left: tableScrollRef.current.scrollWidth, 
        behavior: 'smooth' 
      });
    }
  };

  return {
    tableScrollRef,
    scrollLeft,
    scrollRight,
    scrollToStart,
    scrollToEnd
  };
};