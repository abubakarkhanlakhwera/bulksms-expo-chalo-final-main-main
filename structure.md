bulksms-expo/
├── app.json
├── babel.config.js
├── eslint.config.js
├── expo-env.d.ts
├── global.css
├── metro.config.js
├── nativewind-env.d.ts
├── package.json
├── README.md
├── tailwind.config.js
├── tsconfig.json

├── app/
│   ├── _layout.jsx
│   ├── index.jsx
│   ├── import.jsx
│   ├── preview.jsx
│   ├── queue.jsx
│   ├── report.jsx
│   └── settings.jsx

├── components/
│   ├── FilePickerCard.jsx
│   ├── ColumnMapper.jsx
│   ├── ValidationSummary.jsx
│   ├── RecipientList.jsx
│   ├── QueueControls.jsx
│   ├── ProgressBar.jsx
│   ├── StatCard.jsx
│   ├── Toolbar.jsx
│   └── EmptyState.jsx

├── modules/
│   ├── parsing/
│   │   ├── csv.js
│   │   └── xlsx.js
│   ├── validation/
│   │   ├── phone.js
│   │   └── rules.js
│   ├── queue/
│   │   ├── scheduler.js
│   │   └── state.js
│   ├── export/
│   │   └── csv-export.js
│   └── analytics/
│       └── metrics.js

├── services/
│   ├── sms-bridge.js
│   ├── storage.js
│   └── permissions.js

├── store/
│   ├── fileStore.js
│   ├── validationStore.js
│   ├── queueStore.js
│   └── settingsStore.js

├── constants/
│   ├── app.js
│   └── messages.js

├── hooks/
│   ├── useImportFlow.js
│   ├── useQueueRunner.js
│   └── useMetrics.js

├── utils/
│   ├── format.js
│   └── platform.js

├── assets/
│   ├── fonts/
│   │   └── SpaceMono-Regular.ttf
│   └── images/
│       ├── adaptive-icon.png
│       ├── favicon.png
│       ├── icon.png
│       ├── partial-react-logo.png
│       ├── react-logo.png
│       ├── react-logo@2x.png
│       ├── react-logo@3x.png
│       └── splash-icon.png

├── docs/
│   ├── DESIGN.txt
│   ├── DATA_FORMAT.txt
│   └── NATIVE_INTEGRATION.txt

├── __mocks__/
│   ├── react-native.js
│   ├── expo-file-system.js
│   ├── expo-sharing.js
│   ├── expo-clipboard.js
│   └── expo-router.js

└── tests/
    ├── parsing.spec.js
    ├── validation.spec.js
    └── queue.spec.js