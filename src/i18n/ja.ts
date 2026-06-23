export default {
  // ── Common ──────────────────────────────────────────────────────────────
  common: {
    cancel: "キャンセル",
    save: "保存",
    delete: "削除",
    edit: "編集",
    create: "作成",
    reset: "リセット",
    skip: "スキップ",
    close: "閉じる",
    ok: "OK",
    yes: "はい",
    no: "いいえ",
    back: "戻る",
    add: "追加",
    done: "完了",
  },

  // ── Home Screen ──────────────────────────────────────────────────────────
  home: {
    title: "Quikli",
    listsUsed: "{{count}}/{{max}} リスト使用中",
    streak: "{{count}}日連続",
    filterAll: "すべて",
    emptyTitle: "まだ何もありません！",
    emptySubtitle: "+ をタップして最初のリストを作成",
    emptyFilter: "このカテゴリにリストがありません",
    bannerText: "もうすぐ出発？リマインダーが設定されています。",
    menuEdit: "リストを編集",
    menuSetReminder: "リマインダーを設定",
    menuReminderAlreadySet: "設定済み — タップして変更",
    menuCancelReminder: "リマインダーをキャンセル",
    menuDelete: "リストを削除",
    deleteConfirmTitle: "リストを削除",
    deleteConfirmMessage: "「{{name}}」を削除しますか？",
    limitReachedTitle: "リスト上限に達しました",
    limitReachedMessage: "広告を見て2週間1つ追加するか、Proにアップグレード",
    newList: "新しいリスト",
    editList: "リストを編集",
    listNameLabel: "リスト名",
    listNamePlaceholder: "例：買い物、旅行、仕事...",
    listNamePlaceholderCategory: "例：私の{{category}}リスト...",
    categoryLabel: "カテゴリ",
    reminderLeft: "残り{{time}}",
  },

  // ── List Detail Screen ────────────────────────────────────────────────────
  listDetail: {
    noItemsYet: "まだアイテムがありません",
    addItemPlaceholder: "例：パスポート、充電器、鍵...",
    checkedCount: "{{total}}件中{{checked}}件チェック済み",
    allDone: "完了！",
    checkoutButton: "チェックアウト",
    resetAll: "すべてリセット",
    deleteAll: "すべて削除",
    setReminder: "リマインダーを設定",
    cancelReminder: "リマインダーをキャンセル",
    missingItems: "未チェックのアイテム",
    resetConfirmTitle: "すべてリセット",
    resetConfirmMessage: "すべてのチェックを外しますか？",
    deleteConfirmTitle: "すべて削除",
    deleteConfirmMessage: "すべてのアイテムを削除しますか？この操作は元に戻せません。",
    itemNamePlaceholder: "アイテム名...",
    reminderSet: "リマインダーを設定しました！",
    reminderCancelled: "リマインダーをキャンセルしました！",
    listComplete: "リスト完了！リマインダーをキャンセルしました。",
    itemAdded: "アイテムを追加しました！",
    itemUpdated: "アイテムを更新しました！",
    itemDeleted: "アイテムを削除しました！",
    allItemsReset: "すべてリセットしました！",
    allItemsDeleted: "すべて削除しました！",
    noItemsToReset: "リセットするアイテムがありません！",
    noItemsToDelete: "削除するアイテムがありません！",
    permissionDenied: "許可が必要です",
    permissionMessage: "設定で通知を有効にしてください。",
    deleteItemTitle: "アイテムを削除",
    deleteItemMessage: "「{{name}}」を削除しますか？",
    limitReachedTitle: "上限に達しました",
    limitReachedMessage: "広告を見てアイテムを追加できます。",
    reminderNotification: "出発前にリストを確認してください！",
  },

  // ── Success Screen ────────────────────────────────────────────────────────
  success: {
    title: "完了！",
    subtitle: "すべての準備ができました。",
    backToHome: "ホームに戻る",
  },

  // ── Missing Items Screen ──────────────────────────────────────────────────
  missingItems: {
    title: "まだ残っています...",
    subtitle: "これらのアイテムがチェックされていません。",
    goBack: "戻る",
    checkout: "このままチェックアウト",
  },

  // ── Table Screen ──────────────────────────────────────────────────────────
  table: {
    title: "テーブル",
    emptyTitle: "テーブルがありません",
    emptySubtitle: "例：月例会議...",
    newTable: "新しいテーブル",
    editTable: "テーブルを編集",
    deleteConfirmTitle: "テーブルを削除",
    deleteConfirmMessage: "「{{name}}」を削除しますか？",
    noColumnsTitle: "列がありません",
    noColumnsMessage: "テーブルを作成する前に列を追加してください。",
    tableName: "テーブル名",
    tableNamePlaceholder: "例：サッカー、パーティー、旅行...",
    columns: "列",
    columnNamePlaceholder: "列名...",
    addColumn: "列を追加",
    rows: "{{count}}行",
    columnTypes: {
      text: "テキスト",
      number: "数値",
      checkbox: "チェックボックス",
      date: "日付",
    },
  },

  // ── Table Detail Screen ───────────────────────────────────────────────────
  tableDetail: {
    addRow: "行を追加",
    deleteRowTitle: "行を削除",
    deleteRowMessage: "この行を削除しますか？",
    setReminder: "リマインダーを設定",
    cancelReminder: "リマインダーをキャンセル",
    reminderSet: "リマインダーを設定しました！",
    reminderCancelled: "リマインダーをキャンセルしました！",
    permissionDenied: "許可が必要です",
    permissionMessage: "設定で通知を有効にしてください。",
    enterValue: "値を入力...",
    reminderNotification: "テーブルの確認をお忘れなく！",
  },

  // ── Settings Screen ───────────────────────────────────────────────────────
  settings: {
    title: "設定",
    appearance: "外観",
    appColour: "アプリカラー",
    language: "言語",
    languageLabel: "言語",
    about: "アプリについて",
    rateQuikli: "Quikliを評価する",
    enjoyingApp: "アプリを楽しんでいますか？レビューをお願いします！",
    madeWith: "もの忘れする人へ、愛を込めて",
    darkMode: "ダークモード",
  },

  // ── Pro Screen ────────────────────────────────────────────────────────────
  pro: {
    title: "Quikli",
    titlePro: "Pro",
    subtitle: "忘れず、邪魔されず。",
    feature1Title: "リスト・テーブル無制限",
    feature1Subtitle: "5件の上限なし",
    feature2Title: "スマート出発リマインダー",
    feature2Subtitle: "位置・時間ベースの通知",
    feature3Title: "広告なし",
    feature3Subtitle: "バナーもインタースティシャルもなし",
    feature4Title: "カスタムテーマ",
    feature4Subtitle: "好きな色を選べる",
    ctaButton: "無料トライアルを開始 — ¥480/月",
    ctaSubtext: "7日間無料、その後¥480/月。いつでもキャンセル可能。",
    comingSoon: "Proアップグレードは近日公開予定です。",
  },

  // ── Interstitial Ad Screen ────────────────────────────────────────────────
  interstitial: {
    advertisement: "広告",
    skipIn: "{{count}}秒後にスキップ",
    skip: "スキップ",
    adTitle: "ここに広告が表示されます",
    adSubtitle: "全画面インタースティシャル枠",
    learnMore: "詳しく見る",
  },

  // ── Onboarding ────────────────────────────────────────────────────────────
  onboarding: {
    getStarted: "はじめる",
    next: "次へ",
    skip: "スキップ",
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    listReminderTitle: "リストを確認してください！",
    tableReminderTitle: "テーブルのフォローアップをお忘れなく！",
  },
};
