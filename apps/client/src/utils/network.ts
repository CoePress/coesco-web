export function isOnline(): boolean {
  return navigator.onLine;
}

export function isSlowConnection(): boolean {
  const connection = (navigator as any).connection
    || (navigator as any).mozConnection
    || (navigator as any).webkitConnection;

  if (!connection)
    return false;

  const slowTypes = ["slow-2g", "2g"];
  return slowTypes.includes(connection.effectiveType) || connection.saveData === true;
}

export function shouldQueue(method: string): boolean {
  if (!isOnline())
    return true;
  if (method === "GET")
    return false;
  if (isSlowConnection())
    return true;
  return false;
}
