/**
 * Frappe Charts typescript types
 * Based in https://github.com/lightyen/frappe-charts-ts
 */

declare module 'frappe-charts' {
  export interface MarkerOptions {
    /** default: right */
    labelPos?: 'left' | 'right'
  }

  export interface RegionOptions {
    /** default: right */
    labelPos: 'left' | 'right'
  }

  export interface Marker {
    label: string
    value: number
    options?: MarkerOptions
  }

  export interface Region {
    label: string
    start: number
    end: number
    options?: RegionOptions
  }

  /** Chart Data Set */
  export interface DataSet {
    name?: string
    values?: number[]
    /** for mixed Bar/Line Chart */
    chartType?: 'bar' | 'line'
  }

  export interface CommonData {
    labels: (string | number)[]
    datasets: DataSet[]
    yMarkers?: Marker[]
    yRegions?: Region[]
  }

  export interface HeatmapData {
    /** key: unix timestamp in second, value: count */
    dataPoints: { [key: number]: number }
    start?: Date
    end?: Date
  }

  /** Common Data or Heatmap Data */
  export type ChartData = CommonData | HeatmapData

  /** Chart Data Point with "data-select" event */
  export interface DataPoint {
    label: string | number
    index: number
    values: number[]
  }

  export type ChartType = 'line' | 'bar' | 'axis-mixed' | 'pie' | 'percentage' | 'heatmap' | 'donut'

  export interface BarOptions {
    /** min: 0, max: 2, default: 0.5 */
    spaceRatio?: number
    /**
         Renders multiple bar datasets in a stacked configuration,
        rather than the default adjacent.
     */
    stacked?: boolean
    height?: number
    depth?: number
  }

  export interface AxisOptions {
    /** default: span */
    xAxisMode?: 'span' | 'tick'
    /** default: span */
    yAxisMode?: 'span' | 'tick'
    /** default: false */
    xIsSeries?: boolean
  }

  export interface LineOptions {
    /** default: 4 */
    dotSize?: number
    /** default: 0 */
    regionFill?: number
    /** default: 0 */
    hideDots?: number
    /** default: 0 */
    hideLine?: number
    /** default: 0 */
    heatline?: number
    /** default: 0 */
    spline?: number
  }

  export interface TooltipOptions {
    formatTooltipX?: (value: string | number) => string
    formatTooltipY?: (value: number) => string
  }

  /** Frappe Chart Options */
  export interface ChartOptions {
    /** The title of chart */
    title?: string
    /** Chart data */
    data: ChartData
    /** default: "line" */
    type?: ChartType
    /** default: 240 */
    height?: number
    /**
     * default: ['light-blue', 'blue', 'violet', 'red', 'orange', 'yellow', 'green',
     * 'light-green', 'purple', 'magenta', 'light-grey', 'dark-grey']
     */
    colors?: string[]
    barOptions?: BarOptions
    axisOptions?: AxisOptions
    lineOptions?: LineOptions
    tooltipOptions?: TooltipOptions
    /** defalt: 0 */
    valuesOverPoints?: number
    maxSlices?: number
    isNavigable?: boolean
    countLabel?: string
    discreteDomains?: number

    // ! UPDATED
    /**
     * Sometimes long legends would overlap with neighboring legends, this option truncates it to a fixed length
     * @default false
     */
    truncateLegends?: boolean
  }

  class Chart {
    public parent: HTMLElement

    /**
     * Create a Chart.
     * @param element - A DOM element or element ID.
     * @param options - Chart options.
     */
    constructor(element: HTMLElement | string, options: ChartOptions)

    addDataPoint: (label: string, valueFromEachDataset: number[], index?: number) => void
    removeDataPoint: (index?: number) => void
    update: (data: ChartData) => void
    export: () => void
  }
}
