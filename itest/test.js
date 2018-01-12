'use strict';

const proc = require('child_process');

describe('close', () => {
  it('should allow the app to exit', () => {
    proc.execSync('node itest/app/close.js', {
      timeout: 1800
    });
  });
});