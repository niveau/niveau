'use strict';

const proc = require('child_process');

describe('close', function() {
  this.timeout(5000);
  
  it('should allow the app to exit', () => {
    proc.execSync('node itest/app/close.js', {
      timeout: 2000
    });
  });
});
