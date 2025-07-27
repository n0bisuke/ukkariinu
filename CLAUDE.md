# Google Meet録画忘れ防止Chrome拡張 開発メモ

## プロジェクト概要
Google Meetでの録画忘れを防止するChrome拡張機能。ミーティング開始30秒後に警告し、録画開始まで60秒間隔で継続的にリマインドする。

## 主要機能
- **録画状態監視**: リアルタイムで録画ボタンの状態を検出
- **自動警告**: 30秒後に初回警告（alert + 音声 + カスタムポップアップ）
- **継続リマインド**: 60秒間隔で再警告（録画開始まで継続）
- **視覚的インジケーター**: 画面右上に録画状態を常時表示
- **ワンクリック録画開始**: 警告から直接録画開始可能

## 技術的な実装ポイント

### 1. 録画ボタン検出の工夫
複数のセレクターを使用してGoogle Meetの仕様変更に対応：
```javascript
const recordButton = document.querySelector('[data-tooltip="録画を開始"]') ||
                    document.querySelector('[aria-label*="録画"]') ||
                    document.querySelector('[aria-label*="Record"]') ||
                    document.querySelector('button[jsname="BOHaEe"]');
```

### 2. URL検出の改善
ミーティングルームの確実な検出：
```javascript
const isMeetingRoom = url.match(/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/);
```

### 3. 継続的警告システム
- `hasShownWarning`: 初回警告フラグ
- `lastWarningTime`: 最後の警告時刻
- `warningInterval`: 60秒間隔での再警告

### 4. Web Audio APIによる警告音
ビープ音（800Hz→600Hz→800Hz）を0.6秒間再生：
```javascript
oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
```

## 開発中に対処した問題

### 1. Content Scriptの読み込み問題
- **問題**: popup.jsからcontent scriptにメッセージが届かない
- **解決**: `chrome.runtime.onMessage.addListener`を追加し、適切なレスポンス処理を実装

### 2. URL変更の検出
- **問題**: SPAでのページ遷移を検出できない
- **解決**: `setInterval`でURL変更を監視し、cleanup→再初期化を実行

### 3. 重複実行の防止
- **問題**: 複数のintervalが同時実行される
- **解決**: 既存のintervalをクリアしてから新しいintervalを設定

### 4. Chrome拡張の更新反映
- **問題**: コード変更が反映されない
- **解決**: 拡張機能を完全削除→再読み込みする手順を確立

## ファイル構成
```
meet-rec-checker/
├── manifest.json          # Chrome拡張の設定
├── content.js            # Google Meetページで実行されるメインスクリプト
├── styles.css            # UI要素のスタイル
├── popup.html            # 拡張機能ポップアップのHTML
├── popup.js              # ポップアップの機能
├── icons/                # アイコンディレクトリ（未実装）
├── README.md             # ユーザー向け説明
├── CLAUDE.md             # 開発メモ（このファイル）
└── .gitignore            # Git除外設定
```

## Chrome Web Store リリース準備

### Chrome Web Store 審査履歴

#### v1.0 → v1.1 (2025/07/27)
**リジェクト理由**: 未使用権限 (`notifications`パーミッション)
**対応**: 
- `notifications`権限を削除
- `activeTab`を`host_permissions`に変更
- プライバシーポリシー更新
- バージョン1.1で再提出

### 必要な修正項目
1. **TypeScriptエラー修正**:
   - `webkitAudioContext`の型エラー
   - 未使用変数`sender`の削除

2. **アイコン作成**: 16px, 48px, 128px のアイコンファイル

3. **最小権限化 (v1.1で完了)**:
   - `permissions: []` (空配列)
   - `host_permissions: ["https://meet.google.com/*"]` のみ

### ストア掲載情報
- **カテゴリ**: 仕事効率化（Productivity）
- **言語**: 日本語
- **キーワード**: Google Meet, 録画, 忘れ防止, ミーティング, 会議

## 今後の改善案
1. **設定画面**: 警告タイミングのカスタマイズ
2. **多言語対応**: 英語版の追加
3. **統計機能**: 録画忘れ回数の記録
4. **音声設定**: 警告音のON/OFF切り替え

## Chrome Web Store パッケージ作成手順

### ZIPファイル作成
```bash
# srcフォルダに移動
cd src

# ZIPファイルを作成（ルートフォルダを含めずに圧縮）
zip -r ../meet-recording-reminder-v1.1.zip . -x "*.DS_Store" "*.git*"
```

### パッケージに含まれるファイル
- `manifest.json` - 拡張機能の設定
- `content.js` - メインスクリプト
- `popup.html` - ポップアップのHTML
- `popup.js` - ポップアップの機能
- `styles.css` - スタイルシート
- `icons/` - アイコンフォルダ（現在空）

## デバッグ用コマンド
```javascript
// コンソールでテスト用に警告を即座に発生させる
meetingStartTime = Date.now() - 35000;

// 録画状態を手動確認
console.log({isRecording, meetingStartTime, hasShownWarning, lastWarningTime});
```

## 注意事項
- Google Meetの仕様変更により録画ボタンの検出が困難になる可能性あり
- Web Audio APIはユーザーインタラクション後でないと動作しない場合がある
- manifest v3の仕様に準拠している