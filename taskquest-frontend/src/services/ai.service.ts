import { UserGoals } from './settings.service';

export interface YearlyPlan {
  vision: string;
  quarterlyGoals: QuarterlyGoal[];
  monthlyMilestones: MonthlyMilestone[];
}

export interface QuarterlyGoal {
  quarter: number;
  theme: string;
  objectives: string[];
  keyResults: string[];
}

export interface MonthlyMilestone {
  month: number;
  focus: string;
  milestones: string[];
}

export interface DailyTask {
  id: string;
  text: string;
  description: string;
  xp: number;
  type: 'ai_suggestion';
  reason: string;
  relatedGoal: string;
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
}

class AIService {
  async generateYearlyPlan(userGoals: UserGoals): Promise<YearlyPlan> {
    // Simular processamento de IA
    await new Promise(resolve => setTimeout(resolve, 1000));

    const vision = this.generateVision(userGoals);
    const quarterlyGoals = this.generateQuarterlyGoals(userGoals);
    const monthlyMilestones = this.generateMonthlyMilestones(quarterlyGoals);

    return {
      vision,
      quarterlyGoals,
      monthlyMilestones
    };
  }

  async generateDailyTasks(userGoals: UserGoals, currentProgress?: any): Promise<DailyTask[]> {
    // Simular processamento de IA
    await new Promise(resolve => setTimeout(resolve, 800));

    const currentMonth = new Date().getMonth() + 1;
    const monthlyFocus = this.getMonthlyFocus(currentMonth, userGoals);
    
    return [
      {
        id: '1',
        text: this.generateTaskText(userGoals, 'skill'),
        description: 'Desenvolver habilidades alinhadas com seus objetivos profissionais',
        xp: 100,
        type: 'ai_suggestion',
        reason: `Essa tarefa te aproxima do objetivo: ${userGoals.longTermGoals[0] || 'crescimento profissional'}`,
        relatedGoal: userGoals.longTermGoals[0] || 'Desenvolvimento Profissional',
        estimatedTime: 45,
        priority: 'high'
      },
      {
        id: '2',
        text: this.generateTaskText(userGoals, 'health'),
        description: 'Cuidar da saúde física e mental para manter produtividade',
        xp: 100,
        type: 'ai_suggestion',
        reason: 'Saúde é fundamental para alcançar objetivos de longo prazo',
        relatedGoal: 'Saúde e Bem-estar',
        estimatedTime: 30,
        priority: 'medium'
      },
      {
        id: '3',
        text: this.generateTaskText(userGoals, 'planning'),
        description: 'Planejar próximos passos e ajustar estratégia',
        xp: 100,
        type: 'ai_suggestion',
        reason: 'Planejamento constante garante progresso consistente',
        relatedGoal: 'Organização e Planejamento',
        estimatedTime: 20,
        priority: 'high'
      }
    ];
  }

  private generateVision(userGoals: UserGoals): string {
    const focus = userGoals.currentFocus;
    const incomeGoal = userGoals.desiredAnnualIncome ? `atingir R$ ${userGoals.desiredAnnualIncome.toLocaleString()} anuais` : 'crescimento profissional';
    
    const visions = {
      career: `Em 1 ano, você será um profissional destacado na sua área, com habilidades sólidas e ${incomeGoal}.`,
      health: `Em 1 ano, você terá estabelecido hábitos saudáveis sustentáveis e alcançado bem-estar físico e mental.`,
      financial: `Em 1 ano, você terá estabilidade financeira, ${incomeGoal} e um plano de investimentos sólido.`,
      education: `Em 1 ano, você terá adquirido conhecimento especializado e certificações que impulsionarão sua carreira.`,
      business: `Em 1 ano, você terá estabelecido ou escalado seu negócio, com processos sólidos e clientes fiéis.`,
      relationships: `Em 1 ano, você terá fortalecido relações importantes e construído uma rede de apoio sólida.`
    };

    return visions[focus as keyof typeof visions] || 
           `Em 1 ano, você terá feito progresso significativo em seus objetivos principais e estará mais próximo da vida que deseja.`;
  }

  private generateQuarterlyGoals(userGoals: UserGoals): QuarterlyGoal[] {
    const quarters = [];
    
    for (let i = 1; i <= 4; i++) {
      quarters.push({
        quarter: i,
        theme: this.getQuarterTheme(i, userGoals),
        objectives: this.generateQuarterlyObjectives(i, userGoals),
        keyResults: this.generateKeyResults(i, userGoals)
      });
    }
    
    return quarters;
  }

  private generateMonthlyMilestones(quarterlyGoals: QuarterlyGoal[]): MonthlyMilestone[] {
    const milestones = [];
    
    for (let month = 1; month <= 12; month++) {
      const quarter = Math.ceil(month / 3);
      const quarterGoal = quarterlyGoals.find(q => q.quarter === quarter);
      
      milestones.push({
        month,
        focus: `Mês ${month}: ${this.getMonthlyFocusText(month, quarterGoal)}`,
        milestones: this.generateMonthlyTasks(month, quarterGoal)
      });
    }
    
    return milestones;
  }

  private generateQuarterlyObjectives(quarter: number, userGoals: UserGoals): string[] {
    const baseObjectives = [
      'Desenvolver habilidades técnicas fundamentais',
      'Estabelecer rotina produtiva consistente',
      'Expandir network profissional',
      'Melhorar saúde e bem-estar'
    ];

    return baseObjectives.slice(0, 3).map(obj => 
      `${obj} ${this.getQuarterSuffix(quarter)}`
    );
  }

  private generateKeyResults(quarter: number, userGoals: UserGoals): string[] {
    return [
      `Completar ${quarter * 3} cursos/certificações`,
      `Atingir ${quarter * 25}% da meta de renda`,
      `Estabelecer ${quarter * 2} novos hábitos saudáveis`,
      `Conectar com ${quarter * 5} profissionais da área`
    ];
  }

  private generateTaskText(userGoals: UserGoals, type: string): string {
    const tasks = {
      skill: [
        'Estudar nova tecnologia por 45min',
        'Pratique resolução de problemas complexos',
        'Revise e refatore código antigo',
        'Aprenda um novo framework'
      ],
      health: [
        'Faça 30min de exercício físico',
        'Pratique mindfulness por 15min',
        'Prepare refeições saudáveis',
        'Estabeleça rotina de sono'
      ],
      planning: [
        'Revise metas da semana',
        'Planeje próximos passos',
        'Avalie progresso do mês',
        'Ajuste estratégia baseado em resultados'
      ]
    };

    const availableTasks = tasks[type as keyof typeof tasks] || tasks.skill;
    return availableTasks[Math.floor(Math.random() * availableTasks.length)];
  }

  private getQuarterTheme(quarter: number, userGoals: UserGoals): string {
    const themes = {
      1: 'Fundação e Aprendizado',
      2: 'Crescimento e Aplicação', 
      3: 'Expansão e Networking',
      4: 'Consolidação e Resultados'
    };
    return themes[quarter as keyof typeof themes];
  }

  private getMonthlyFocus(month: number, userGoals: UserGoals): string {
    const focuses = [
      'Estabelecimento de Base', 'Desenvolvimento Técnico', 'Aplicação Prática',
      'Otimização', 'Expansão', 'Networking', 'Consolidação', 'Inovação',
      'Escalabilidade', 'Liderança', 'Mentoria', 'Legado'
    ];
    return focuses[month - 1] || 'Desenvolvimento Contínuo';
  }

  private getMonthlyFocusText(month: number, quarterGoal?: QuarterlyGoal): string {
    return `Foco em ${this.getMonthlyFocus(month, {} as UserGoals)} para ${quarterGoal?.theme.toLowerCase()}`;
  }

  private generateMonthlyTasks(month: number, quarterGoal?: QuarterlyGoal): string[] {
    return [
      `Completar ${month} projeto(s) prático(s)`,
      `Atingir ${month * 8}% das metas do trimestre`,
      `Estabelecer ${Math.ceil(month / 2)} novos hábitos`,
      `Conectar com ${month + 2} profissionais`
    ];
  }

  private getQuarterSuffix(quarter: number): string {
    const suffixes = {
      1: 'básicas',
      2: 'intermediárias', 
      3: 'avançadas',
      4: 'de especialização'
    };
    return suffixes[quarter as keyof typeof suffixes] || '';
  }
}

export const aiService = new AIService();