export interface WindGridHeader {
  parameterCategory: number;
  parameterNumber: number;
  lo1: number;
  la1: number;
  lo2: number;
  la2: number;
  dx: number;
  dy: number;
  nx: number;
  ny: number;
  refTime: string;
}

export interface WindGrid {
  header: WindGridHeader;
  data: number[];
}

export type WindGridDataset = [WindGrid, WindGrid];

export interface WindGridProvider {
  readonly id: string;
  getWindGrid(): Promise<WindGridDataset>;
}

export class WindGridError extends Error {
  public readonly providerId: string;
  public readonly cause?: unknown;

  constructor(message: string, providerId: string, cause?: unknown) {
    super(message);
    this.name = "WindGridError";
    this.providerId = providerId;
    this.cause = cause;
  }
}
