import { describe, it, expect } from 'vitest';
import { ManifestParserImpl } from './impl.js';
import type { Manifest } from './types.js';

describe('ManifestParserImpl', () => {
  describe('convertManifestToString', () => {
    it('should convert manifest to JSON string', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test Extension',
        version: '1.0.0',
      };
      const result = ManifestParserImpl.convertManifestToString(manifest, false);
      expect(JSON.parse(result)).toEqual(manifest);
    });

    it('should pretty-print with 2-space indentation', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
      };
      const result = ManifestParserImpl.convertManifestToString(manifest, false);
      expect(result).toContain('\n');
      expect(result).toMatch(/ {2}"manifest_version"/);
    });

    it('should not modify manifest for Chrome', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
        background: {
          service_worker: 'background.js',
        },
        permissions: ['storage', 'sidePanel'],
      };
      const result = ManifestParserImpl.convertManifestToString(manifest, false);
      const parsed = JSON.parse(result);
      expect(parsed.background.service_worker).toBe('background.js');
      expect(parsed.permissions).toContain('sidePanel');
    });

    it('should convert to Firefox format when isFirefox is true', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
        permissions: ['storage'],
        background: {
          service_worker: 'background.js',
        },
      };
      const result = ManifestParserImpl.convertManifestToString(manifest, true);
      const parsed = JSON.parse(result);
      expect(parsed.background.scripts).toEqual(['background.js']);
      expect(parsed.background.type).toBe('module');
    });
  });
});

describe('convertToFirefoxCompatibleManifest', () => {
  // Helper to convert and parse
  const convertForFirefox = (manifest: Manifest) => {
    const result = ManifestParserImpl.convertManifestToString(manifest, true);
    return JSON.parse(result);
  };

  describe('background script conversion', () => {
    it('should convert service_worker to scripts array', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
        permissions: ['storage'],
        background: {
          service_worker: 'background.js',
        },
      };
      const result = convertForFirefox(manifest);
      expect(result.background.scripts).toEqual(['background.js']);
    });

    it('should set type to module', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
        permissions: ['storage'],
        background: {
          service_worker: 'background.js',
        },
      };
      const result = convertForFirefox(manifest);
      expect(result.background.type).toBe('module');
    });

    it('should not modify if no background.service_worker', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
        permissions: ['storage'],
      };
      const result = convertForFirefox(manifest);
      expect(result.background).toBeUndefined();
    });
  });

  describe('options_page conversion', () => {
    it('should convert options_page to options_ui', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
        permissions: ['storage'],
        options_page: 'options.html',
      };
      const result = convertForFirefox(manifest);
      expect(result.options_ui).toBeDefined();
      expect(result.options_ui.page).toBe('options.html');
    });

    it('should set browser_style to false', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
        permissions: ['storage'],
        options_page: 'options.html',
      };
      const result = convertForFirefox(manifest);
      expect(result.options_ui.browser_style).toBe(false);
    });

    it('should delete options_page after conversion', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
        permissions: ['storage'],
        options_page: 'options.html',
      };
      const result = convertForFirefox(manifest);
      expect(result.options_page).toBeUndefined();
    });
  });

  describe('content_security_policy', () => {
    it('should set extension_pages CSP', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
        permissions: ['storage'],
      };
      const result = convertForFirefox(manifest);
      expect(result.content_security_policy).toBeDefined();
      expect(result.content_security_policy.extension_pages).toBe("script-src 'self'; object-src 'self'");
    });
  });

  describe('permissions filtering', () => {
    it('should remove sidePanel from permissions', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
        permissions: ['storage', 'sidePanel', 'tabs'],
      };
      const result = convertForFirefox(manifest);
      expect(result.permissions).not.toContain('sidePanel');
    });

    it('should keep other permissions', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
        permissions: ['storage', 'sidePanel', 'tabs'],
      };
      const result = convertForFirefox(manifest);
      expect(result.permissions).toContain('storage');
      expect(result.permissions).toContain('tabs');
    });
  });

  describe('unsupported properties', () => {
    it('should delete side_panel property', () => {
      const manifest: Manifest = {
        manifest_version: 3,
        name: 'Test',
        version: '1.0.0',
        permissions: ['storage'],
        side_panel: {
          default_path: 'sidepanel.html',
        },
      };
      const result = convertForFirefox(manifest);
      expect(result.side_panel).toBeUndefined();
    });
  });
});
