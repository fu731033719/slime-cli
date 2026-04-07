import inquirer from 'inquirer';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';
import { styles } from '../theme/colors';

export async function configCommand(): Promise<void> {
  Logger.title('Slime 閰嶇疆');

  const currentConfig = ConfigManager.getConfig();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiUrl',
      message: styles.text('API鍦板潃:'),
      default: currentConfig.apiUrl,
      prefix: styles.highlight('?'),
    },
    {
      type: 'input',
      name: 'apiKey',
      message: styles.text('API瀵嗛挜:'),
      default: currentConfig.apiKey || '',
      prefix: styles.highlight('?'),
    },
    {
      type: 'input',
      name: 'model',
      message: styles.text('妯″瀷鍚嶇О:'),
      default: currentConfig.model,
      prefix: styles.highlight('?'),
    },
    {
      type: 'number',
      name: 'temperature',
      message: styles.text('娓╁害鍙傛暟 (0-2):'),
      default: currentConfig.temperature,
      prefix: styles.highlight('?'),
    },
  ]);

  const finalConfig = {
    apiUrl: answers.apiUrl,
    apiKey: answers.apiKey,
    model: answers.model,
    temperature: answers.temperature,
  };

  ConfigManager.saveConfig(finalConfig);
  Logger.success('閰嶇疆宸蹭繚瀛橈紒');
}

