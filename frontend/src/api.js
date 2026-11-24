export async function api(path, options = {}) {
  const { method = 'GET', body, signal } = options;
  const json = body !== undefined && !(body instanceof FormData);
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, signal, body: json ? JSON.stringify(body) : body,
      headers: json ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível acessar o IF Swap. Verifique se o servidor está iniciado.');
  }
  if (response.status === 204) return;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Não foi possível concluir a operação.');
    error.status = response.status;
    throw error;
  }
  return data;
}
