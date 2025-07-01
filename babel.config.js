module.exports = function(api) {
  api.cache(true);
  
  const isTest = api.env('test');
  
  return {
    presets: [
      'module:@react-native/babel-preset',
      ...(isTest ? [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'commonjs'
        }]
      ] : []),
      ...(!isTest ? ['nativewind/babel'] : []),
    ],
    plugins: [
      ...(!isTest ? ['react-native-reanimated/plugin'] : []),
    ],
  };
};