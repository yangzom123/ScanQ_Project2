// Makes the Firebase JS SDK resolve correctly in Expo / React Native.
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
module.exports = config;
