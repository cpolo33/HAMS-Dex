import { BonfidaTrade, BonfidaVolume } from './types';

export default class BonfidaApi {
  static URL: string = 'https://api.solhamster.space/';
  static SERUM_URL: string = 'https://serum-api.bonfida.com/';

  static async get(path: string, serum: boolean = false) {
    try {
      const url = serum ? this.SERUM_URL : this.URL;
      const response = await fetch(url + path);
      if (response.ok) {
        const responseJson = await response.json();
        return responseJson.success ? responseJson.data : null;
      }
    } catch (err) {
      console.log(`Error fetching from Bonfida API ${path}: ${err}`);
    }
    return null;
  }

  static async getRecentTrades(
    marketAddress: string,
  ): Promise<BonfidaTrade[] | null> {
    return BonfidaApi.get(`trades/address/${marketAddress}`);
  }

  static async get24HourVolumes(
    marketName: string,
  ): Promise<BonfidaVolume[] | null> {
    return BonfidaApi.get(`volumes/${marketName}`, true);
  }
}

export const BONFIDA_DATA_FEED = 'https://api.solhamster.space/tv';