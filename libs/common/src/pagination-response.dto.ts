export interface PaginationMeta {
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly totalPages: number
}

export interface PaginationResponse<T> {
  readonly data: readonly T[]
  readonly meta: PaginationMeta
}
