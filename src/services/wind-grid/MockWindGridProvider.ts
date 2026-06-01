import type { WindGrid, WindGridDataset, WindGridHeader, WindGridProvider } from "./types";

const LO1 = -100;
const LO2 = -85;
const LA1 = 32;
const LA2 = 22;
const DX = 0.5;
const DY = 0.5;

function header(parameterNumber: number, refTime: string): WindGridHeader {
  const nx = Math.round((LO2 - LO1) / DX) + 1;
  const ny = Math.round((LA1 - LA2) / DY) + 1;
  return {
    parameterCategory: 2,
    parameterNumber,
    lo1: LO1,
    la1: LA1,
    lo2: LO2,
    la2: LA2,
    dx: DX,
    dy: DY,
    nx,
    ny,
    refTime,
  };
}

function buildGrid(parameterNumber: number, refTime: string): WindGrid {
  const h = header(parameterNumber, refTime);
  const data: number[] = [];

  for (let j = 0; j < h.ny; j++) {
    const lat = LA1 - j * DY;
    for (let i = 0; i < h.nx; i++) {
      const lon = LO1 + i * DX;
      const latFactor = (lat - LA2) / (LA1 - LA2);
      const lonFactor = (lon - LO1) / (LO2 - LO1);

      const swirl = Math.sin(lonFactor * Math.PI * 2) * Math.cos(latFactor * Math.PI);
      const gulfBoost = 1 - Math.abs(latFactor - 0.4) * 1.2;

      let value: number;
      if (parameterNumber === 2) {
        value =
          -6 +
          swirl * 3 +
          gulfBoost * 1.5 +
          (Math.sin(lat * 0.6) + Math.cos(lon * 0.4)) * 1.2;
      } else {
        value =
          5 +
          swirl * -2 +
          gulfBoost * 1.8 +
          (Math.cos(lat * 0.5) - Math.sin(lon * 0.3)) * 1.1;
      }
      data.push(value);
    }
  }

  return { header: h, data };
}

export class MockWindGridProvider implements WindGridProvider {
  readonly id = "mock";

  async getWindGrid(): Promise<WindGridDataset> {
    const refTime = new Date().toISOString();
    return Promise.resolve([buildGrid(2, refTime), buildGrid(3, refTime)]);
  }
}
