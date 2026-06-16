const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf-8');

      const tag = '# @with-modular-headers';
      if (!contents.includes(tag)) {
        const insertion = `${tag}\n  pod 'GoogleUtilities', :modular_headers => true\n  pod 'RecaptchaInterop', :modular_headers => true\n`;
        contents = contents.replace(
          /^(target '[^']+' do)/m,
          `$1\n  ${insertion}`
        );
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);
};
