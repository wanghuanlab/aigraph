import { expect, test } from '@playwright/test';

test('indexeddb storage suite passes in a real browser', async ({ page }) => {
  await page.goto('/#module=exam');
  const passed = await page.evaluate(async () => {
    const suite = await import('/tests/exam-storage.browser.ts');
    const result = await suite.runStorageTests();
    return result.passed;
  });
  expect(passed).toHaveLength(9);
});

test('a practice answer and uploaded file survive reload, then the record can be deleted', async ({ page }) => {
  await page.goto('/#module=exam');
  await page.getByRole('button', { name: '开始全题练习' }).click();
  await expect(page.getByRole('heading', { name: /1\.1\.1/ })).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles({
    name: '1.1.1-1.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
  });
  const savedFile = page.getByRole('button', { name: '1.1.1-1.jpg', exact: true });
  await expect(savedFile).toBeVisible();
  await page.reload();
  await expect(savedFile).toBeVisible();
  await page.getByRole('button', { name: '结束练习' }).click();
  await page.getByRole('button', { name: '确认结束练习' }).click();
  await page.getByRole('button', { name: '返回考试中心' }).click();
  await expect(page.getByRole('heading', { name: '考试中心' })).toBeVisible();
  await page.getByRole('button', { name: /删除/ }).click();
  await page.getByRole('button', { name: '删除答卷' }).click();
  await expect(page.getByText('还没有作答记录')).toBeVisible();
});
