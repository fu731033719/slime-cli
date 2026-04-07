import * as fs from 'fs';
import matter from 'gray-matter';
import { Skill, SkillMetadata } from '../types/skill';

/**
 * Skill 瑙ｆ瀽鍣?
 */
export class SkillParser {
  /**
   * 瑙ｆ瀽 SKILL.md 鏂囦欢锛堟敮鎸佸绉嶆牸寮忥級
   * @param filePath - SKILL.md 鏂囦欢璺緞
   * @returns Skill 瀵硅薄
   */
  static parse(filePath: string): Skill {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      // 妫€娴嬫牸寮忕被鍨嬪苟瑙ｆ瀽
      if (this.isClaudeCodeFormat(data)) {
        return this.parseClaudeCodeFormat(filePath, data, content);
      }

      // 默认使用 Slime 格式
      return this.parseSlimeFormat(filePath, data, content);
    } catch (error: any) {
      throw new Error(`Failed to parse skill file ${filePath}: ${error.message}`);
    }
  }

  /**
   * 妫€娴嬫槸鍚︿负 Claude Code 鏍煎紡
   */
  private static isClaudeCodeFormat(data: any): boolean {
    return !!(data.invocable || data.autoInvocable !== undefined);
  }

  /**
   * 瑙ｆ瀽 Claude Code 鏍煎紡
   */
  private static parseClaudeCodeFormat(filePath: string, data: any, content: string): Skill {
    if (!data.name || !data.description) {
      throw new Error(`Invalid skill file: ${filePath}. Missing required fields (name or description).`);
    }

    const metadata: SkillMetadata = {
      name: data.name,
      description: data.description,
      argumentHint: data['argument-hint'] || data.argumentHint,
      userInvocable: data.invocable === 'user' || data.invocable === 'both',
      autoInvocable: data.autoInvocable !== false && data.invocable !== 'user',
      maxTurns: data['max-turns'] ? Number(data['max-turns']) : undefined,
    };

    if (!this.validate(metadata)) {
      throw new Error(`Invalid skill metadata in file: ${filePath}`);
    }

    return {
      metadata,
      content: content.trim(),
      filePath,
    };
  }

  /**
   * 解析 Slime 格式
   */
  private static parseSlimeFormat(filePath: string, data: any, content: string): Skill {
    if (!data.name || !data.description) {
      throw new Error(`Invalid skill file: ${filePath}. Missing required fields (name or description).`);
    }

    const metadata: SkillMetadata = {
      name: data.name,
      description: data.description,
      argumentHint: data['argument-hint'],
      userInvocable: data['user-invocable'] !== false,
      autoInvocable: data['auto-invocable'] !== false,
      maxTurns: data['max-turns'] ? Number(data['max-turns']) : undefined,
    };

    if (!this.validate(metadata)) {
      throw new Error(`Invalid skill metadata in file: ${filePath}`);
    }

    return {
      metadata,
      content: content.trim(),
      filePath,
    };
  }

  /**
   * 楠岃瘉 Skill 鍏冩暟鎹?
   */
  static validate(metadata: SkillMetadata): boolean {
    return !!(metadata.name && metadata.description);
  }
}

