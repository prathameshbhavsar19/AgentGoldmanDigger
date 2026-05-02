export interface FollowUpScenario {
  question: string
  updatedModules: Array<{
    type: string
    priority: number
    moduleId: string
    props: Record<string, unknown>
  }>
}

export const followUpScenarios: Record<string, FollowUpScenario> = {
  moreConservative: {
    question: 'Make this more conservative',
    updatedModules: [
      {
        type: 'strategy_options',
        priority: 5,
        moduleId: 'strategy_options-5',
        props: {
          recommended: 'option-a',
          options: [
            {
              id: 'option-a',
              title: 'Safety First Foundation',
              summary: 'Build emergency savings before taking major market risk.',
              riskLevel: 'Low',
              goalFit: 'Strong (Conservative)',
              allocation: [
                { label: 'Emergency savings', pct: 50, color: '#64748B' },
                { label: 'Short-term bonds',  pct: 30, color: '#B89D5E' },
                { label: 'Broad index fund',  pct: 20, color: '#1F3A8A' },
              ],
              pros: ['Maximum capital protection', 'Very low volatility'],
              tradeoffs: ['Significantly slower wealth growth'],
              nextAction: 'Start with bonds and index funds in a 30/70 split',
            },
          ],
        },
      },
      {
        type: 'risk_assessment',
        priority: 4,
        moduleId: 'risk_assessment-4',
        props: {
          portfolioRisk: 'Low',
          behaviouralRisk: 'Moderate',
          mismatch: false,
          mismatchNote: 'Conservative adjustment applied per your request.',
          drawdownScenario: {
            label: 'If markets drop 20%',
            impact: '~$100 temporary loss on a $1,500 portfolio (conservative mix)',
            advice: 'A conservative portfolio absorbs market shocks more smoothly.',
          },
        },
      },
    ],
  },
}
