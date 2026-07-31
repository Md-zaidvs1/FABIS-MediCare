// FABIS MediCare - Print Designer Template Manager Engine

import {
  PrintTemplateConfig,
  TemplateType,
  getStoredTemplates,
  saveStoredTemplates,
  getActiveTemplate,
  setActiveTemplate,
  restoreDefaultTemplate,
} from './TemplateStorage';

export class TemplateManager {
  /**
   * Retrieves active template config for the specified document type.
   */
  static getActive(type: TemplateType): PrintTemplateConfig {
    return getActiveTemplate(type);
  }

  /**
   * Saves or updates a template config in persistent storage.
   */
  static saveTemplate(config: PrintTemplateConfig): PrintTemplateConfig {
    const templates = getStoredTemplates();
    const existingIndex = templates.findIndex((t) => t.id === config.id);
    const updatedConfig = { ...config, updatedAt: new Date().toISOString() };

    if (existingIndex >= 0) {
      templates[existingIndex] = updatedConfig;
    } else {
      templates.push(updatedConfig);
    }

    saveStoredTemplates(templates);
    // Ensure it is set as active
    setActiveTemplate(updatedConfig.id, updatedConfig.type);
    return updatedConfig;
  }

  /**
   * Restores default template for a given document type.
   */
  static restoreDefault(type: TemplateType): PrintTemplateConfig {
    return restoreDefaultTemplate(type);
  }

  /**
   * Duplicates an existing template with a new ID and custom name.
   */
  static duplicateTemplate(config: PrintTemplateConfig): PrintTemplateConfig {
    const duplicated: PrintTemplateConfig = {
      ...config,
      id: `${config.type}_copy_${Date.now()}`,
      name: `${config.name} (Copy)`,
      isDefault: false,
      updatedAt: new Date().toISOString(),
    };

    const templates = getStoredTemplates();
    templates.push(duplicated);
    saveStoredTemplates(templates);
    setActiveTemplate(duplicated.id, duplicated.type);
    return duplicated;
  }

  /**
   * Exports a template as a downloadable JSON file.
   */
  static exportTemplate(config: PrintTemplateConfig): void {
    const jsonStr = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fabis_template_${config.type}_${config.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Imports a template config from JSON string with validation.
   */
  static importTemplateJSON(jsonContent: string, targetType: TemplateType): PrintTemplateConfig {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed || typeof parsed !== 'object' || !parsed.name || !parsed.type) {
        throw new Error('Invalid template schema');
      }

      const imported: PrintTemplateConfig = {
        ...parsed,
        id: `${targetType}_imp_${Date.now()}`,
        type: targetType,
        isDefault: false,
        updatedAt: new Date().toISOString(),
      };

      return this.saveTemplate(imported);
    } catch (err: any) {
      throw new Error(`Failed to import template: ${err.message || 'Invalid JSON file'}`);
    }
  }

  /**
   * Returns all available templates for a specific document type.
   */
  static getTemplatesByType(type: TemplateType): PrintTemplateConfig[] {
    return getStoredTemplates().filter((t) => t.type === type);
  }
}
