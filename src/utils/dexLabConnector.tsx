import { DexLabVolume } from './types';

export default class DexLabApi {
  static URL: string = 'https://api.dexlab.space/v1/';

  static async get(path: string) {
    try {
      const url = this.URL;
      const response = await fetch(url + path);
      if (response.ok) {
        const responseJson = await response.json();
        return responseJson.success ? responseJson.data : null;
      }
    } catch (err) {
      console.log(`Error fetching from DexLab API ${path}: ${err}`);
    }
    return null;
  }

  static async get24HourVolumes(
    marketAddress: string,
  ): Promise<DexLabVolume | null> {
    return DexLabApi.get(`volumes/${marketAddress}`);
  }
}