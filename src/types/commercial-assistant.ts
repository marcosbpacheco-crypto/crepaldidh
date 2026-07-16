export interface LeadScoreResult {
  score: number
  confidence: number
  estimatedCloseDays: number
  forecastedRevenue: number
  positiveFactors: string[]
  negativeFactors: string[]
  risks: RiskAlert[]
  nextActions: NextAction[]
}

export interface RiskAlert {
  type: 'urgent' | 'warning' | 'info'
  title: string
  description: string
}

export interface NextAction {
  priority: 'high' | 'medium' | 'low'
  action: string
  reason: string
}

export interface TimelineEvent {
  date: string
  type: string
  title: string
  description: string
  author?: string
}

export interface SimulateResult {
  originalScore: number
  simulatedScore: number
  originalRevenue: number
  simulatedRevenue: number
  estimatedDaysGain: number
  changes: { field: string; oldValue: string; newValue: string }[]
}

export interface ExecutiveDossier {
  companyId: string
  companyName: string
  tradeName: string
  segment: string
  city: string
  state: string
  employees: number
  summary: string
  strengths: string[]
  risks: string[]
  nextStep: string
  contacts: { name: string; role: string; influence: string }[]
  activeDeals: { title: string; value: number; stage: string }[]
  recentActivities: { type: string; title: string; date: string }[]
  totalRevenue: number
  contractStatus: string
  lastContactDays: number
}

export interface DashboardData {
  totalDeals: number
  totalPipelineValue: number
  avgScore: number
  wonDeals: number
  wonRevenue: number
  lostDeals: number
  conversionRate: number
  dealsByStage: { stage: string; count: number; value: number }[]
  topRisks: RiskAlert[]
  topActions: NextAction[]
  performanceTrend: { label: string; score: number }[]
}
