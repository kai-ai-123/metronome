'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'install-prompt-dismissed';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // 既に非表示にしている場合はスキップ
    if (localStorage.getItem(DISMISS_KEY)) return;
    setDismissed(false);

    // スタンドアロンで起動済みなら表示不要
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // iOS判定
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    const isStandalone = (
      navigator as unknown as { standalone?: boolean }
    ).standalone;

    if (isIOS && !isStandalone) {
      setShowIOSPrompt(true);
      return;
    }

    // Android/Desktop: beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIOSPrompt(false);
  }, []);

  if (dismissed) return null;
  if (!deferredPrompt && !showIOSPrompt) return null;

  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
      {showIOSPrompt ? (
        <>
          <p className="text-sm text-gray-700">
            ホーム画面に追加すると、アプリのように使えます。
          </p>
          <p className="text-xs text-gray-500">
            Safari の共有ボタン
            <span className="inline-block mx-1 text-base leading-none align-middle">
              ⎋
            </span>
            →「ホーム画面に追加」をタップ
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-700">
          ホーム画面に追加すると、アプリのように使えます。
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          onClick={handleDismiss}
          className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
        >
          閉じる
        </button>
        {deferredPrompt && (
          <button
            onClick={handleInstall}
            className="text-xs font-medium bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-800"
          >
            インストール
          </button>
        )}
      </div>
    </div>
  );
}
