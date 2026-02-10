import { expect, test } from '@playwright/test';

test.describe('メトロノーム基本操作', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ページが表示され、メトロノームコンポーネントが存在する', async ({
    page,
  }) => {
    await expect(page.getByTestId('metronome')).toBeVisible();
  });

  test('初期BPMが100である', async ({ page }) => {
    await expect(page.getByTestId('bpm-value')).toHaveText('100');
  });

  test('初期拍子が4/4である（ビートボタンが4つ）', async ({ page }) => {
    const beats = page.getByTestId('beat-button');
    await expect(beats).toHaveCount(4);
  });

  test('再生/停止ボタンをクリックでトグルできる', async ({ page }) => {
    const playButton = page.getByTestId('play-button');
    await expect(playButton).toHaveAttribute('aria-label', '再生');

    await playButton.click();
    await expect(playButton).toHaveAttribute('aria-label', '停止');

    await playButton.click();
    await expect(playButton).toHaveAttribute('aria-label', '再生');
  });

  test('BPMスライダーで値を変更できる', async ({ page }) => {
    const slider = page.getByTestId('bpm-slider');
    // スライダーの値を変更
    await slider.fill('150');
    await expect(page.getByTestId('bpm-value')).toHaveText('150');
  });

  test('拍子を3/4に変更するとビートボタンが3つになる', async ({ page }) => {
    const tsSelect = page.getByTestId('time-signature-select');
    // 3/4ボタンをクリック
    await tsSelect.getByText('3/4').click();
    const beats = page.getByTestId('beat-button');
    await expect(beats).toHaveCount(3);
  });

  test('拍子を6/8に変更するとビートボタンが6つになる', async ({ page }) => {
    const tsSelect = page.getByTestId('time-signature-select');
    await tsSelect.getByText('6/8').click();
    const beats = page.getByTestId('beat-button');
    await expect(beats).toHaveCount(6);
  });

  test('ビートボタンをクリックするとアクセントが切り替わる', async ({
    page,
  }) => {
    const firstBeat = page.getByTestId('beat-button').first();
    // 初期は strong
    await expect(firstBeat).toHaveAttribute('aria-label', '拍1: strong');
    // クリック → normal
    await firstBeat.click();
    await expect(firstBeat).toHaveAttribute('aria-label', '拍1: normal');
    // クリック → mute
    await firstBeat.click();
    await expect(firstBeat).toHaveAttribute('aria-label', '拍1: mute');
    // クリック → strong
    await firstBeat.click();
    await expect(firstBeat).toHaveAttribute('aria-label', '拍1: strong');
  });
});
