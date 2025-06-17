/* hooks/useRouteApi.ts
   Cloud Run の /route/crosswalk/ へ安全に POST するユーティリティ
   - 緯度経度のバリデーション
   - URLSearchParams でクエリ生成（スペルミス防止）
   - fetch のエラーハンドリング（HTTP ステータス / JSON パース）
*/

export interface LatLon {
  lat: number;
  lon: number;
}

export interface RouteResponse {
  origin: [number, number];
  destination: [number, number];
  total_duration: string;
  num_crosswalks: number;
  route_polyline: any[];
  matched_crosswalks: any[];
}

const BASE_URL =
  'https://kusukusumapproject-46431021282.asia-northeast2.run.app/route/crosswalk/';

const isValid = (v: number) => Number.isFinite(v) && !Number.isNaN(v);

/**
 * Cloud Run API へルート取得をリクエスト
 * @throws Error – バリデーション・HTTP・JSON パースいずれか失敗時
 */
export const useRouteApi = () => {
  const postRouteRequest = async (
    origin: LatLon,
    destination: LatLon,
    signal?: AbortSignal,
  ): Promise<RouteResponse> => {
    // --- 1. 緯度経度バリデーション --------------------------
    if (!isValid(origin.lat) || !isValid(origin.lon)) {
      throw new Error('origin が不正です');
    }
    if (!isValid(destination.lat) || !isValid(destination.lon)) {
      throw new Error('destination が不正です');
    }

    // --- 2. クエリ生成（スペルミス防止） ---------------------
    const qs = new URLSearchParams({
      origin: `${origin.lat},${origin.lon}`,
      destination: `${destination.lat},${destination.lon}`,
    }).toString();

    const url = `${BASE_URL}?${qs}`;

    // --- 3. POST リクエスト -------------------------------
    const res = await fetch(url, {
      method: 'POST',
      signal,
    }).catch((e) => {
      // fetch 自体のネットワークエラー
      throw new Error(`Network error: ${e.message}`);
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    try {
      const json = (await res.json()) as RouteResponse;
      return json;
    } catch (e) {
      throw new Error('JSON parse error');
    }
  };

  return { postRouteRequest };
};
