export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getPaginationMeta(
  total: number,
  { page, limit }: PaginationParams
): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function getPaginationSkip({ page, limit }: PaginationParams): number {
  return (page - 1) * limit;
}
