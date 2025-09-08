import { readFileSync } from 'fs';
  import { join } from 'path';

  export function loadTemplateData<T>(filename: string, environment: string): T[] {
    try {
      const dataPath = join(__dirname,'..', 'data', filename);
      const rawData = readFileSync(dataPath, 'utf8');
      const data = JSON.parse(rawData);

      return data[environment] || [];
    } catch (error: any) {
      console.warn(`Could not load ${filename} for ${environment}:`, error.message);
      return [];
    }
  }

  export function logSeedingProgress(entity: string, count: number) {
    console.log(`Created ${count} ${entity}${count !== 1 ? 's' : ''}`);
  }
