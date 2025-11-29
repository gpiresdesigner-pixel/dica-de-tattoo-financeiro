import { GoogleGenAI } from "@google/genai";
import { Transaction, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) {
    return "Adicione transações para receber uma análise financeira da sua Escola de Tattoo.";
  }

  // Resumo agrupado por Categoria > Subcategoria
  const summaryObj: Record<string, number> = {};
  
  transactions.forEach(t => {
    const key = `${t.type} - ${t.category} (${t.subcategory})`;
    if (!summaryObj[key]) summaryObj[key] = 0;
    summaryObj[key] += t.amount;
  });

  const summaryString = Object.entries(summaryObj)
    .map(([key, value]) => `- ${key}: R$ ${value.toFixed(2)}`)
    .join('\n');

  const prompt = `
    Atue como o CFO (Diretor Financeiro) da empresa "Dica de Tattoo", uma Escola de Tatuagem Online.
    
    Contexto da empresa:
    - Negócio 100% digital (infoproduto/cursos).
    - Custos principais envolvem: Tráfego Pago (Ads), Equipe (Social Media, Designer, Editor, Vendedores) e Ferramentas.
    - Não há estoque físico.
    
    Analise os dados financeiros abaixo:
    ${summaryString}

    Forneça um relatório executivo em Markdown contendo:
    1. **Saúde do Fluxo de Caixa**: Análise da relação entre CAC (custos de marketing/vendas) e Receita.
    2. **Análise de Custos de Equipe/Criativos**: Estamos gastando muito com edição/design em relação ao faturamento?
    3. **Sugestões de Otimização**: Onde podemos cortar custos sem perder qualidade de venda? (Ex: ferramentas, otimização de tráfego).
    4. **Alertas**: Alguma categoria está consumindo mais de 30% da receita?

    Mantenha um tom profissional, direto e focado em alta performance de infoprodutos.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Você é um especialista em finanças para lançamentos digitais e escolas online.",
        temperature: 0.7,
      }
    });

    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    return "Ocorreu um erro ao tentar conectar com o consultor IA. Verifique sua conexão ou tente novamente mais tarde.";
  }
};