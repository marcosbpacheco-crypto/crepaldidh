export interface TemporaryAccess {
  id: string; companyId: string; companyName: string; token: string; createdAt: string; expiresAt: string
  lastAccess?: string; active: boolean; createdBy: string
}
export interface TempUser {
  id: string; companyId: string; companyName: string; name: string; email: string; password: string
  active: boolean; createdAt: string; createdBy: string; lastAccess?: string
}
export type QuestionType = 'text' | 'textarea' | 'select' | 'radio' | 'date' | 'number' | 'email' | 'phone' | 'cnpj'
export interface QuestionOption { id: string; label: string }
export interface Question {
  id: string; text: string; type: QuestionType; required: boolean; options?: QuestionOption[]; placeholder?: string
}
export interface Questionnaire {
  id: string; title: string; description?: string; instructions?: string; questions: Question[]; createdAt: string; createdBy: string; active: boolean
}
export interface Answer { questionId: string; value: string | string[] }
export interface QuestionnaireResponse {
  id: string; questionnaireId: string; questionnaireTitle: string; companyId: string; companyName: string
  userId: string; userName: string; answers: Answer[]; submittedAt: string; status: 'draft' | 'submitted'
}
