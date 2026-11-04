export type ClaudeModel = 'claude-haiku-5-5' | 'claude-sonnet-5-5'

export type Effort = 'low' | 'medium' | 'high'

export interface ModelCall {
  model: ClaudeModel
  maxTokens: number
  effort: Effort
  thinking: 'off' | 'adaptive'
}
