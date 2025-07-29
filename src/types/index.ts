export type ApiResponse = {
  status: "success" | "error"
  message: string
}

export interface MealPreference {
  type: "VEG" | "NON_VEG"
  nonVegType: "CHICKEN" | "FISH" | "EGG" | "NONE"
  message?: string
}

export interface SearchParams {
  [key: string]: string | string[] | undefined
}

export interface Option {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
  withCount?: boolean
}

export interface DataTableFilterField<TData> {
  label: string
  value: keyof TData
  placeholder?: string
  options?: Option[]
}

export interface DataTableFilterOption<TData> {
  id: string
  label: string
  value: keyof TData
  options: Option[]
  filterValues?: string[]
  filterOperator?: string
  isMulti?: boolean
}

// export type DrizzleWhere<T> =
//   | SQL<unknown>
//   | ((aliases: T) => SQL<T> | undefined)
//   | undefined;
