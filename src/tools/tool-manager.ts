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
 * Tool name aliases.
 * Maps Claude-style tool names to Slime's internal registrations.
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
 * Tool registry and execution entry point.
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
    // Core file tools.
    this.registerTool(new ReadTool());
    this.registerTool(new WriteTool());
    this.registerTool(new EditTool());
    this.registerTool(new GlobTool());
    this.registerTool(new GrepTool());
    this.registerTool(new ShellTool());

    // Outbound communication tools.
    this.registerTool(new SendTextTool());
    this.registerTool(new SendFileTool());

    // Meta tools.
    this.registerTool(new SpawnSubagentTool());

    // Sub-agent management tools.
    this.registerTool(new CheckSubagentTool());
    this.registerTool(new StopSubagentTool());
    this.registerTool(new ResumeSubagentTool());

    // Skill invocation tools.
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
   * Return all tool definitions without filtering.
   */
  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => tool.definition);
  }

  /**
   * Execute one tool call.
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
          content: `Error: tool "${toolName}" was not found`,
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
          content: `Tool argument parsing failed: ${error.message}`,
          ok: false,
          errorCode: 'INVALID_TOOL_ARGUMENTS',
          retryable: false,
        };
      }

      const output = await tool.execute(args, context);

      // Handle special return formats such as image reads with extra follow-up messages.
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
        content: `Tool execution failed: ${error.message}`,
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

