export type AiAssistantType = 'chat' | 'reports' | 'commercial' | 'nr01' | 'training' | 'mentoring' | 'financial'
export interface AiMessage { id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: string; metadata?: Record<string, unknown> }
export interface AiConversation {
  id: string; title: string; assistantType: AiAssistantType; messages: AiMessage[]; module?: string
  companyId?: string; projectId?: string; favorite: boolean; createdAt: string; updatedAt: string
}
export interface AiPrompt { id: string; title: string; prompt: string; category: string; tags: string[]; usageCount: number }
export interface AiConfig { tone: 'professional' | 'friendly' | 'technical' | 'executive'; responseSize: 'concise' | 'balanced' | 'detailed'; maxHistory: number }
