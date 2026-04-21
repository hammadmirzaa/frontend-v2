"use client";

import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";
import { ImageWrapper } from "./image-wrapper";

export interface TableColumn<T> {
  id: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  headerClassName?: string;
  cellClassName?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  headerBackground?: string;
  sortIconPlaceholder?: React.ReactNode;
  className?: string;
  minWidth?: string;
}

function DefaultSortIcon() {
  return (
    <ImageWrapper src="/svgs/sort.svg" alt="Sort Icon" width={20} height={20} />
  );
}

function getCellContent<T>(row: T, col: TableColumn<T>): React.ReactNode {
  if (col.render) {
    return col.render(row);
  }
  if (col.accessor === undefined) {
    return null;
  }
  if (typeof col.accessor === "function") {
    return (col.accessor as (row: T) => React.ReactNode)(row);
  }
  const value = (row as Record<string, unknown>)[col.accessor as string];
  return String(value);
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  headerBackground,
  sortIconPlaceholder,
  className,
  minWidth = "500px",
}: TableProps<T>) {
  const headerBg = headerBackground ?? COLORS.TABLE_HEADER_BG;
  const sortIcon = sortIconPlaceholder ?? <DefaultSortIcon />;

  return (
    <div className={cn("overflow-x-auto px-6 pt-6 ", className)}>
      <table className="w-full" style={{ minWidth }}>
        <thead>
          <tr
            className="border-b border-gray-200"
            style={{ backgroundColor: headerBg }}
          >
            {columns.map((col) => (
              <th
                key={col.id}
                className={cn(
                  "px-6 py-5 text-left text-sm font-bold text-gray-900",
                  col.headerClassName,
                )}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    className="flex w-full items-center justify-between hover:text-gray-900"
                  >
                    <p className="text-sm font-bold text-gray-900">
                      {col.label}
                    </p>
                    {sortIcon}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className="bg-white transition-colors hover:bg-gray-50"
            >
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={cn(
                    "px-6 py-4 text-sm text-gray-900",
                    col.cellClassName,
                  )}
                >
                  {getCellContent(row, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
