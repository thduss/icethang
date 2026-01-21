module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // 혹시 필요한 다른 플러그인은 여기에 추가
      "react-native-reanimated/plugin", // ⚠️ 이 친구는 항상 맨 마지막에!
    ],
  };
};