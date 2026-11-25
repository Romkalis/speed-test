// Превращение чисел в строки для вывода. Только чистые функции:
// ничего не печатают сами, просто возвращают текст.

const UNITS = ['Б', 'КБ', 'МБ', 'ГБ'];
const STEP = 1000; // десятичные единицы, как и в скорости

/**
 * 1536000 -> "1.54 МБ"
 */
export function formatBytes(bytes) {
  let value = bytes;
  let unitIndex = 0;

  while (value >= STEP && unitIndex < UNITS.length - 1) {
    value = value / STEP;
    unitIndex++;
  }

  const digits = unitIndex === 0 ? 0 : 2;
  return `${value.toFixed(digits)} ${UNITS[unitIndex]}`;
}

/**
 * 1234.5678 -> "1234 мс"
 */
export function formatDuration(ms) {
  return `${Math.round(ms)} мс`;
}

/**
 * Строка про один запрос:
 *   [ 3/10] ✓  842 мс   5.21 МБ   49.47 Мбит/с
 *   [ 4/10] ✗ 30001 мс  таймаут (больше 30 с)
 */
export function formatRequestLine(result, index, total, speedMbps) {
  const width = String(total).length;
  const number = String(index + 1).padStart(width, ' ');
  const prefix = `[${number}/${total}]`;
  const time = formatDuration(result.durationMs).padStart(9, ' ');

  if (!result.ok) {
    return `${prefix} ✗ ${time}  ${result.error}`;
  }

  const size = formatBytes(result.bytes).padStart(10, ' ');
  const speed = `${speedMbps.toFixed(2)} Мбит/с`.padStart(14, ' ');

  return `${prefix} ✓ ${time} ${size} ${speed}`;
}

/**
 * Итоговый блок со статистикой. Возвращает массив строк.
 */
export function formatSummary(stats) {
  const lines = [
    '',
    '──────── Итог ────────',
    `Успешных запросов:   ${stats.successCount} из ${stats.totalCount}`,
  ];

  if (stats.successCount === 0) {
    lines.push('Ни один запрос не завершился успешно — скорость посчитать нельзя.');
    return lines;
  }

  lines.push(
    `Скачано всего:       ${formatBytes(stats.totalBytes)}`,
    `Среднее время:       ${formatDuration(stats.averageDurationMs)}`,
    `Скорость скачивания: ${stats.speedMbps.toFixed(2)} Мбит/с (${stats.speedMBps.toFixed(2)} МБ/с)`,
  );

  return lines;
}
