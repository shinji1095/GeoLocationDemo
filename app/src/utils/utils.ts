export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = (θ * 180) / Math.PI;
  return (bearing + 360) % 360;
}

export function makeWsUrl(path: string, httpsPort = 4443, httpPort = 4000) {
  const { protocol, hostname } = window.location;
  if (protocol === 'https:') {
    return `wss://${hostname}:${httpsPort}${path}`;
  }
  return `ws://${hostname}:${httpPort}${path}`;
}
