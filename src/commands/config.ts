import inquirer from 'inquirer';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';
import { styles } from '../theme/colors';

export async function configCommand(): Promise<void> {
  Logger.title('Slime Configuration');

  const currentConfig = ConfigManager.getConfig();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: styles.text('Provider:'),
      choices: [
        { name: 'OpenAI', value: 'openai' },
        { name: 'Anthropic', value: 'anthropic' },
        { name: 'DeepSeek', value: 'deepseek' },
        { name: 'MiniMax', value: 'minimax' },
      ],
      default: currentConfig.provider || 'openai',
      prefix: styles.highlight('?'),
    },
    {
      type: 'input',
      name: 'apiUrl',
      message: styles.text('API URL:'),
      default: currentConfig.apiUrl,
      prefix: styles.highlight('?'),
    },
    {
      type: 'input',
      name: 'apiKey',
      message: styles.text('API Key:'),
      default: currentConfig.apiKey || '',
      prefix: styles.highlight('?'),
    },
    {
      type: 'input',
      name: 'model',
      message: styles.text('Model name:'),
      default: currentConfig.model,
      prefix: styles.highlight('?'),
    },
    {
      type: 'number',
      name: 'temperature',
      message: styles.text('Temperature (0-2):'),
      default: currentConfig.temperature,
      prefix: styles.highlight('?'),
    },
  ]);

  const finalConfig = {
    provider: answers.provider,
    apiUrl: answers.apiUrl,
    apiKey: answers.apiKey,
    model: answers.model,
    temperature: answers.temperature,
  };

  ConfigManager.saveConfig(finalConfig);
  Logger.success('Configuration saved.');
}

