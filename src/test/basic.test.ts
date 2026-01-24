import { describe, it, expect } from 'vitest';

describe('Environment', () => {
  it('has correct global test setup', () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
  });

  it('has jest-dom matchers available', () => {
    const div = document.createElement('div');
    div.innerHTML = '<p>Test</p>';
    expect(div).toContainHTML('<p>Test</p>');
  });
});