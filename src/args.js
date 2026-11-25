const DEFAULT_COUNT = 10;
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Превращает строку в целое положительное число.
 * Если строка не число или число <= 0 — бросает ошибку с понятным текстом.
 */
export function parsePositiveInt(value, name) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${name} должен быть целым положительным числом, получено: "${value}"`);
  }

  return number;
}

/**
 * Проверяет, что строка — корректный http(s) адрес.
 * Возвращает объект URL.
 */
export function parseUrl(value) {
  if (!value) {
    throw new Error('Не указан адрес. Пример: node index.js https://example.com/big.jpg');
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Некорректный адрес: "${value}"`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Поддерживаются только http и https, получено: "${url.protocol}"`);
  }

  return url;
}

/**
 * Разбирает аргументы вида:
 *   <url> [--count 10] [--timeout 30]
 * argv — это process.argv.slice(2).
 */
export function parseArgs(argv) {
  let urlValue = null;
  let count = DEFAULT_COUNT;
  let timeoutMs = DEFAULT_TIMEOUT_MS;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--count' || arg === '-n') {
      count = parsePositiveInt(argv[i + 1], '--count');
      i++; // значение уже забрали, пропускаем его
    } else if (arg === '--timeout' || arg === '-t') {
      const seconds = parsePositiveInt(argv[i + 1], '--timeout');
      timeoutMs = seconds * 1000;
      i++;
    } else if (arg.startsWith('-')) {
      throw new Error(`Неизвестный флаг: ${arg}`);
    } else {
      urlValue = arg;
    }
  }

  const url = parseUrl(urlValue);

  return { url, count, timeoutMs };
}
