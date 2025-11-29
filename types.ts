
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export type PaymentStatus = 'PAID' | 'PENDING';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  subcategory: string;
  date: string; // Data de competência/lançamento
  dueDate: string; // Data de vencimento
  status: PaymentStatus;
  commissionPaid?: boolean; // Flag to check if commission was already calculated for this sale
}

export interface CommissionReceiver {
  id: string;
  name: string;
  role: string; // Vendedor, Gestor, Lider
  defaultRate: number; // %
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  pendingIncome: number;
  pendingExpense: number;
}

export type ViewState = 'dashboard' | 'transactions' | 'reports' | 'commissions';

// Configuração específica para Dica de Tattoo (Escola Online)
export const CATEGORIES_CONFIG: Record<string, string[]> = {
  'Receitas': [
    'Venda de Cursos', 
    'Matrículas', 
    'Mentorias', 
    'Outros'
  ],
  'Marketing & Tráfego': [
    'Facebook/Instagram Ads',
    'Google/YouTube Ads',
    'TikTok Ads',
    'Influenciadores',
    'Ferramentas de Marketing'
  ],
  'Equipe Criativa & Suporte': [
    'Gestor de Tráfego',
    'Social Media',
    'Designer Gráfico',
    'Editor de Vídeo',
    'Suporte ao Aluno'
  ],
  'Comercial': [
    'Comissão de Vendedores',
    'Salário Vendedores',
    'Ferramentas de CRM'
  ],
  'Infraestrutura Digital': [
    'Plataforma de Curso (Area de Membros)',
    'Hospedagem de Vídeo',
    'Servidores/Site',
    'Automação/E-mail Mkt'
  ],
  'Administrativo': [
    'Impostos',
    'Taxas Bancárias/Gateway',
    'Contabilidade',
    'Prolabore',
    'Outros'
  ]
};

export const MAIN_CATEGORIES = Object.keys(CATEGORIES_CONFIG);
