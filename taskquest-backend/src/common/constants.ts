export const TASKQUEST_CONSTANTS = {
  LEVELS: {
    BASE_XP: 1000,
    XP_INCREMENT: 100,
  },
  REWARDS: {
    5: "📚 Acesso à biblioteca premium",
    10: "🎵 Playlist de foco exclusiva", 
    15: "☕ Desconto em cafeterias",
    20: "📖 E-book de produtividade",
    25: "🎯 Sessão de planejamento",
    30: "🚀 Curso avançado",
    50: "🏆 Mentorização pessoal"
  },
  DAILY_LIMITS: {
    MAX_XP: 350,
    MAX_TASKS: 15
  },
  TASK_TYPES: {
    FINANCE: { xp: 100, label: "IMPACTO FINANCEIRO" },
    HEALTH: { xp: 50, label: "IMPACTO SAÚDE" },
    STEP: { xp: 10, label: "PEQUENO PASSO" }
  }
};