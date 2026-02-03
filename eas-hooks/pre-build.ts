import * as fs from 'fs';
import * as path from 'path';

/**
 * EAS Build Pre-Build Hook
 * Creates google-services.json from environment variable
 */
export const preBuild = async () => {
  const googleServicesJson = process.env.GOOGLE_SERVICES_JSON;

  if (!googleServicesJson) {
    console.log('⚠️  GOOGLE_SERVICES_JSON not set, skipping google-services.json generation');
    return;
  }

  try {
    console.log('📝 Generating google-services.json from environment variable...');
    
    // Decode base64
    const decoded = Buffer.from(googleServicesJson, 'base64').toString('utf-8');

    // Validate JSON
    JSON.parse(decoded);

    // Write to file
    const filePath = path.join(process.cwd(), 'android', 'app', 'google-services.json');
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, decoded, 'utf-8');
    console.log('✅ google-services.json created successfully');
    console.log(`📍 Location: ${filePath}`);
  } catch (error) {
    console.error('❌ Error creating google-services.json:', error);
    throw error;
  }
};
