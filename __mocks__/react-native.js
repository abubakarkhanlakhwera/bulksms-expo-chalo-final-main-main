module.exports = {
  Platform: { OS: "ios", select: (o) => o.ios || o.default },
  NativeModules: {},
  NativeEventEmitter: function () { return { addListener: () => ({ remove: () => {} }) }; },
};
