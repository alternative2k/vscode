import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { CloudConfig } from './cloudUpload';
import {
  saveCloudConfig,
  getCloudConfig,
  clearCloudConfig,
} from './cloudUpload';

describe('cloudUpload', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('saves and retrieves cloud config', () => {
    const config: CloudConfig = {
      accountId: 'test-account',
      bucketName: 'test-bucket',
    };

    saveCloudConfig(config);
    const retrieved = getCloudConfig();

    expect(retrieved).toEqual(config);
  });

  it('returns null when no config exists', () => {
    const config = getCloudConfig();
    expect(config).toBeNull();
  });

  it('clears saved config', () => {
    const config: CloudConfig = {
      accountId: 'test-account',
      bucketName: 'test-bucket',
    };

    saveCloudConfig(config);
    clearCloudConfig();

    const retrieved = getCloudConfig();
    expect(retrieved).toBeNull();
  });

  it('handles malformed config gracefully', () => {
    localStorage.setItem('formcheck-cloud-config', 'invalid-json');
    const config = getCloudConfig();
    expect(config).toBeNull();
  });
});