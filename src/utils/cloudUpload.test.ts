import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { CloudConfig } from '../types/cloud';
import {
  saveCloudConfig,
  getCloudConfig,
  clearCloudConfig,
} from './cloudUpload';

describe('cloudUpload', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('saves and retrieves cloud config', () => {
    const config: CloudConfig = {
      enabled: true,
    };

    saveCloudConfig(config);
    const retrieved = getCloudConfig();

    if (!retrieved) {
      throw new Error(`Config should not be null. sessionStorage has: ${sessionStorage.getItem('formcheck-cloud-config')}`);
    }
    expect(retrieved.enabled).toBe(true);
  });

  it('returns null when no config exists', () => {
    const config = getCloudConfig();
    expect(config).toBeNull();
  });

  it('clears saved config', () => {
    const config: CloudConfig = {
      enabled: true,
    };

    saveCloudConfig(config);
    clearCloudConfig();

    const retrieved = getCloudConfig();
    expect(retrieved).toBeNull();
  });

  it('handles malformed config gracefully', () => {
    sessionStorage.setItem('formcheck-cloud-config', 'invalid-json');
    const config = getCloudConfig();
    expect(config).toBeNull();
  });
});