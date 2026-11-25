// Подсчёт итогов. Только чистые функции: массив результатов -> числа.

const BITS_IN_BYTE = 8;
const MS_IN_SECOND = 1000;
const BITS_IN_MEGABIT = 1_000_000; // десятичный мегабит, как у провайдеров
const BYTES_IN_MEGABYTE = 1_000_000; // десятичный мегабайт (MB, не MiB)

/**
 * Сумма значений поля у всех элементов массива.
 */
function sumBy(items, key) {
  let total = 0;
  for (const item of items) {
    total += item[key];
  }
  return total;
}

/**
 * Скорость в мегабитах в секунду.
 */
export function toMegabitsPerSecond(bytes, durationMs) {
  if (durationMs <= 0) return 0;

  const bits = bytes * BITS_IN_BYTE;
  const seconds = durationMs / MS_IN_SECOND;

  return bits / seconds / BITS_IN_MEGABIT;
}

/**
 * Скорость в мегабайтах в секунду.
 */
export function toMegabytesPerSecond(bytes, durationMs) {
  if (durationMs <= 0) return 0;

  const seconds = durationMs / MS_IN_SECOND;

  return bytes / seconds / BYTES_IN_MEGABYTE;
}

/**
 * Считает итоговую статистику по всем запросам.
 *
 * Скорость = все скачанные байты / всё время скачивания.
 * Не среднее скоростей отдельных запросов — оно было бы завышено
 * быстрыми запросами и не отражало бы реальную картину.
 */
export function calculateStats(results) {
  const successful = results.filter((result) => result.ok);
  const failedCount = results.length - successful.length;

  if (successful.length === 0) {
    return {
      totalCount: results.length,
      successCount: 0,
      failedCount,
      totalBytes: 0,
      totalDurationMs: 0,
      averageDurationMs: 0,
      speedMbps: 0,
      speedMBps: 0,
    };
  }

  const totalBytes = sumBy(successful, 'bytes');
  const totalDurationMs = sumBy(successful, 'durationMs');

  return {
    totalCount: results.length,
    successCount: successful.length,
    failedCount,
    totalBytes,
    totalDurationMs,
    averageDurationMs: totalDurationMs / successful.length,
    speedMbps: toMegabitsPerSecond(totalBytes, totalDurationMs),
    speedMBps: toMegabytesPerSecond(totalBytes, totalDurationMs),
  };
}
