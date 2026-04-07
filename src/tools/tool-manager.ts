import { Tool, ToolDefinition, ToolCall, ToolResult, ToolExecutionContext, ToolExecutor } from '../types/tool';
import { Logger } from '../utils/logger';
import { ReadTool } from './read-tool';
import { WriteTool } from './write-tool';
import { ShellTool } from './bash-tool';
import { EditTool } from './edit-tool';
import { GlobTool } from './glob-tool';
import { GrepTool } from './grep-tool';
import { SkillTool } from './skill-tool';
import { SendFileTool } from './send-file-tool';
import { SendTextTool } from './send-text-tool';
import { SpawnSubagentTool } from './spawn-subagent-tool';
import { CheckSubagentTool } from './check-subagent-tool';
import { StopSubagentTool } from './stop-subagent-tool';
import { ResumeSubagentTool } from './resume-subagent-tool';

/**
 * 宸ュ叿鍚嶅埆鍚嶆槧灏勶紙Claude Code 宸ュ叿鍚?鈫?Slime 鍐呴儴娉ㄥ唽鍚嶏級
 */
const TOOL_NAME_ALIASES: Record<string, string> = {
  Bash: 'execute_shell',
  bash: 'execute_shell',
  Shell: 'execute_shell',
  execute_bash: 'execute_shell',
  Read: 'read_file',
  Write: 'write_file',
  Edit: 'edit_file',
};

function resolveToolName(name: string): string {
  return TOOL_NAME_ALIASES[name] ?? name;
}

/**
 * 宸ュ叿绠＄悊鍣?- 绠＄悊鎵€鏈夊彲鐢ㄧ殑宸ュ叿
 */
export class ToolManager implements ToolExecutor {
  private tools: Map<string, Tool> = new Map();
  private workingDirectory: string;
  private contextDefaults: Partial<ToolExecutionContext>;

  constructor(
    workingDirectory: string = process.cwd(),
    contextDefaults: Partial<ToolExecutionContext> = {},
  ) {
    this.workingDirectory = workingDirectory;
    this.contextDefaults = contextDefaults;
    this.registerDefaultTools();
  }

  private registerDefaultTools(): void {
    // 鍩虹鏂囦欢宸ュ叿 (6)
    this.registerTool(new ReadTool());
    this.registerTool(new WriteTool());
    this.registerTool(new EditTool());
    this.registerTool(new GlobTool());
    this.registerTool(new GrepTool());
    this.registerTool(new ShellTool());

    // 閫氫俊宸ュ叿 (2)
    this.registerTool(new SendTextTool());
    this.registerTool(new SendFileTool());

    // 鍏冨伐鍏?
    this.registerTool(new SpawnSubagentTool());

    // Sub-Agent 绠＄悊 (2)
    this.registerTool(new CheckSubagentTool());
    this.registerTool(new StopSubagentTool());
    this.registerTool(new ResumeSubagentTool());

    // Skill 璋冪敤 (1)
    this.registerTool(new SkillTool());
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.definition.name, tool);
  }

  setContextDefaults(contextDefaults: Partial<ToolExecutionContext>): void {
    this.contextDefaults = {
      ...this.contextDefaults,
      ...contextDefaults,
    };
  }

  /**
   * 鑾峰彇鎵€鏈夊伐鍏峰畾涔夛紙鐩存帴杩斿洖鍏ㄩ儴锛屼笉鍐嶈繃婊わ級
   */
  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => tool.definition);
  }

  /**
   * 鎵ц宸ュ叿璋冪敤
   */
  async executeTool(
    toolCall: ToolCall,
    conversationHistory?: any[],
    contextOverrides?: Partial<ToolExecutionContext>,
  ): Promise<ToolResult> {
    const toolName = resolveToolName(toolCall.function.name);
    const tool = this.tools.get(toolName);

    if (!tool) {
      return {
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolName,
        content: `閿欒锛氭湭鎵惧埌宸ュ叿 "${toolName}"`,
        ok: false,
        errorCode: 'TOOL_NOT_FOUND',
        retryable: false,
      };
    }

    try {
      const context: ToolExecutionContext = {
        workingDirectory: this.workingDirectory,
        conversationHistory: conversationHistory || [],
        ...this.contextDefaults,
        ...contextOverrides,
      };

      let args: unknown;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch (error: any) {
        return {
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: `宸ュ叿鍙傛暟瑙ｆ瀽閿欒: ${error.message}`,
          ok: false,
          errorCode: 'INVALID_TOOL_ARGUMENTS',
          retryable: false,
        };
      }

      const output = await tool.execute(args, context);

      // 澶勭悊鐗规畩杩斿洖鏍煎紡锛堝鍥剧墖闇€瑕侀澶栨秷鎭級
      if (output && typeof output === 'object' && 'toolContent' in output && 'newMessages' in output) {
        const specialOutput = output as { toolContent: string; newMessages: any[] };
        return {
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: specialOutput.toolContent,
          ok: true,
          controlSignal: tool.definition.controlMode,
          newMessages: specialOutput.newMessages,
        };
      }

      return {
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: output,
        ok: true,
        controlSignal: tool.definition.controlMode,
      };
    } catch (error: any) {
      return {
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: `宸ュ叿鎵ц閿欒: ${error.message}`,
        ok: false,
        errorCode: 'TOOL_EXECUTION_ERROR',
        retryable: false,
      };
    }
  }

  getToolCount(): number {
    return this.tools.size;
  }

  getTool<T extends Tool = Tool>(name: string): T | undefined {
    return this.tools.get(name) as T | undefined;
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

