module.exports = function (api) {
  const isTest = api.env('test');

  api.cache(() => !isTest); // ✅ Safe and dynamic cache config

  return {
    presets: [
      'module:@react-native/babel-preset',
      ...(isTest
        ? [
            [
              '@babel/preset-env',
              {
                targets: { node: 'current' },
                modules: 'commonjs',
              },
            ],
          ]
        : ['nativewind/babel']),
    ],
    plugins: [
      ...(!isTest ? ['react-native-reanimated/plugin'] : []),
    ],
  };
};
