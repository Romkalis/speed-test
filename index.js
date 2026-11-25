#!/usr/bin/env node
// Точка входа: склеивает модули вместе.
// Здесь живут все побочные эффекты: чтение argv, сеть, вывод в консоль, код выхода.

import { parseArgs } from './src/args.js';
import { addCacheBuster, measureRequest } from './src/request.js';
import { calculateStats, toMegabitsPerSecond } from './src/stats.js';
import { formatRequestLine, formatSummary } from './src/format.js';

/**
 * Делает count запросов СТРОГО последовательно:
 * следующий начинается только после того, как предыдущий закончился.
 * Поэтому обычный for + await, а не Promise.all.
 */
async function runMeasurements(url, count, timeoutMs) {
  const results = [];

  for (let i = 0; i < count; i++) {
    const requestUrl = addCacheBuster(url, i);
    const result = await measureRequest(requestUrl, timeoutMs);

    results.push(result);

    const speed = result.ok ? toMegabitsPerSecond(result.bytes, result.durationMs) : 0;
    console.log(formatRequestLine(result, i, count, speed));
  }

  return results;
}

async function main() {
  let options;

  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Ошибка: ${error.message}`);
    console.error('Использование: node index.js <url> [--count 10] [--timeout 30]');
    process.exitCode = 1;
    return;
  }

  const { url, count, timeoutMs } = options;

  console.log(`Адрес:    ${url}`);
  console.log(`Запросов: ${count}, таймаут: ${timeoutMs / 1000} с`);
  console.log('');

  const results = await runMeasurements(url, count, timeoutMs);
  const stats = calculateStats(results);

  for (const line of formatSummary(stats)) {
    console.log(line);
  }

  // Если не скачалось вообще ничего — сообщаем об ошибке кодом выхода,
  // чтобы скрипт можно было использовать в CI или других скриптах.
  if (stats.successCount === 0) {
    process.exitCode = 1;
  }
}

main();
