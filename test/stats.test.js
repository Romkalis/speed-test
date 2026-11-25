import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculateStats, toMegabitsPerSecond } from '../src/stats.js';
import { parseArgs } from '../src/args.js';
import { formatBytes } from '../src/format.js';

test('1 000 000 байт за 1 секунду = 8 Мбит/с', () => {
  assert.equal(toMegabitsPerSecond(1_000_000, 1000), 8);
});

test('скорость считается как общие байты / общее время, а не среднее скоростей', () => {
  const results = [
    { ok: true, bytes: 1_000_000, durationMs: 1000 }, // 8 Мбит/с
    { ok: true, bytes: 1_000_000, durationMs: 3000 }, // ~2.67 Мбит/с
  ];
  const stats = calculateStats(results);

  // 2 МБ за 4 с = 4 Мбит/с (а среднее скоростей дало бы ~5.33)
  assert.equal(stats.speedMbps, 4);
  assert.equal(stats.averageDurationMs, 2000);
});

test('неудачные запросы не попадают в статистику', () => {
  const results = [
    { ok: true, bytes: 500, durationMs: 100 },
    { ok: false, error: 'таймаут', durationMs: 30000 },
  ];
  const stats = calculateStats(results);

  assert.equal(stats.successCount, 1);
  assert.equal(stats.failedCount, 1);
  assert.equal(stats.totalBytes, 500);
  assert.equal(stats.averageDurationMs, 100);
});

test('если все запросы упали — нули, без деления на ноль', () => {
  const stats = calculateStats([{ ok: false, error: 'x', durationMs: 10 }]);

  assert.equal(stats.successCount, 0);
  assert.equal(stats.speedMbps, 0);
});

test('parseArgs: значения по умолчанию и флаги', () => {
  const defaults = parseArgs(['https://example.com/a.jpg']);
  assert.equal(defaults.count, 10);
  assert.equal(defaults.timeoutMs, 30_000);

  const custom = parseArgs(['https://example.com/a.jpg', '--count', '3', '--timeout', '5']);
  assert.equal(custom.count, 3);
  assert.equal(custom.timeoutMs, 5000);
});

test('parseArgs: ошибки на плохих данных', () => {
  assert.throws(() => parseArgs([]));
  assert.throws(() => parseArgs(['not-a-url']));
  assert.throws(() => parseArgs(['ftp://example.com']));
  assert.throws(() => parseArgs(['https://example.com', '--count', '0']));
});

test('formatBytes', () => {
  assert.equal(formatBytes(512), '512 Б');
  assert.equal(formatBytes(1_540_000), '1.54 МБ');
});
