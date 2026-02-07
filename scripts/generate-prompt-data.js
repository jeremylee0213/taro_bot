const fs = require('fs');
const path = require('path');

const ROOT = '/Users/JeremyLee/Downloads/taro_bot';

const files = {
  SYSTEM_PROMPT: 'prompts/system_prompt.md',
  CONTEXT_TEMPLATE: 'prompts/context_template.md',
  GOLDEN_EXAMPLES: 'prompts/golden_examples.md',
  OUTPUT_SCHEMA: 'prompts/output_schema.json',
  PERSONA_POOL: 'config/persona_pool.md',
  TAROT_DECK: 'config/tarot_deck.md',
  EMOJI_DESIGN_SYSTEM: 'config/emoji_design_system.md',
};

let output = '// Auto-generated from prompts/ and config/ files.\n// Do not edit manually. Run: node scripts/generate-prompt-data.js\n\n';

for (const [name, filePath] of Object.entries(files)) {
  const content = fs.readFileSync(path.join(ROOT, filePath), 'utf-8');
  // Escape backticks and ${} in template literals
  const escaped = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  output += `export const ${name} = \`${escaped}\`;\n\n`;
}

const outPath = path.join(ROOT, 'src/lib/prompt-data.ts');
fs.writeFileSync(outPath, output, 'utf-8');
console.log('Generated:', outPath);
console.log('Size:', (output.length / 1024).toFixed(1), 'KB');
