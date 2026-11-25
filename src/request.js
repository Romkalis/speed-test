// Один замер: один запрос, полное чтение ответа, время и объём.
// Это единственное место в проекте, где есть сеть (побочные эффекты).

/**
 * Добавляет к адресу уникальный параметр, чтобы кэш (CDN, прокси)
 * не отдал нам сохранённую копию вместо реального скачивания.
 * Чистая функция: исходный URL не меняем, возвращаем новую строку.
 */
export function addCacheBuster(url, attempt) {
  const result = new URL(url);
  result.searchParams.set('_nocache', `${Date.now()}-${attempt}`);
  return result.toString();
}

/**
 * Читает тело ответа потоком и считает байты.
 * Целиком файл в память не кладём — только складываем размеры кусков.
 */
async function countBodyBytes(body) {
  let bytes = 0;

  for await (const chunk of body) {
    bytes += chunk.length;
  }

  return bytes;
}

/**
 * Делает один запрос и возвращает результат.
 * Никогда не бросает исключение — ошибку кладёт в результат,
 * чтобы основной цикл мог спокойно идти дальше.
 *
 * Возвращает:
 *   { ok: true,  bytes, durationMs }
 *   { ok: false, error, durationMs }
 */
export async function measureRequest(url, timeoutMs) {
  const start = performance.now();

  try {
    // Таймаут через signal действует и на ожидание заголовков,
    // и на чтение тела — поэтому зависшее скачивание тоже прервётся.
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!response.ok) {
      // Тело всё равно надо освободить, иначе соединение повиснет.
      await response.body?.cancel();
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    // ВАЖНО: fetch завершается, когда пришли только заголовки.
    // Время останавливаем лишь после того, как дочитали тело.
    const bytes = response.body ? await countBodyBytes(response.body) : 0;
    const durationMs = performance.now() - start;

    return { ok: true, bytes, durationMs };
  } catch (error) {
    const durationMs = performance.now() - start;
    return { ok: false, error: describeError(error, timeoutMs), durationMs };
  }
}

/**
 * Превращает системную ошибку в короткий понятный текст.
 */
export function describeError(error, timeoutMs) {
  if (error.name === 'TimeoutError') {
    return `таймаут (больше ${timeoutMs / 1000} с)`;
  }

  // У ошибок сети fetch настоящая причина лежит в error.cause
  if (error.cause) {
    return `сетевая ошибка: ${error.cause.code ?? error.cause.message}`;
  }

  return error.message;
}
