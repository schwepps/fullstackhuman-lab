/**
 * WebMCP (Web Model Context Protocol) type declarations.
 *
 * Chrome 146+ early preview API. Enables websites to register structured
 * tools for AI agents via navigator.modelContext.
 *
 * @see https://webmcp.link/
 * @experimental API surface is unstable — method names and parameters may change.
 */

interface WebMcpToolInputSchema {
  type: 'object'
  properties: Record<
    string,
    {
      type: string
      description?: string
      enum?: string[]
    }
  >
  required?: string[]
}

interface WebMcpToolRegistration {
  name: string
  description: string
  inputSchema: WebMcpToolInputSchema
  handler: (input: Record<string, unknown>) => Promise<unknown> | unknown
}

interface ModelContext {
  registerTool(tool: WebMcpToolRegistration): void
}

declare global {
  interface Navigator {
    modelContext?: ModelContext
  }
}

export {}
