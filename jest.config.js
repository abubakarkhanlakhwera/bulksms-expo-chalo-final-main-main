module.exports = {
  testEnvironment: "node",
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  moduleNameMapper: {
    "^react-native$": "<rootDir>/__mocks__/react-native.js",
    "^expo-file-system$": "<rootDir>/__mocks__/expo-file-system.js",
    "^expo-sharing$": "<rootDir>/__mocks__/expo-sharing.js",
    "^expo-clipboard$": "<rootDir>/__mocks__/expo-clipboard.js",
    "^expo-router$": "<rootDir>/__mocks__/expo-router.js",
    "^xlsx$": "<rootDir>/__mocks__/xlsx.js"
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/?(*.)+(test|spec).[jt]sx"],
};
