export type Produto = {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  /** Preço em Floww Coins. */
  preco: number;
};

/** Quantidade de produtos exibida na vitrine do painel. O restante aparece só em /catalogo. */
export const QUANTIDADE_VITRINE = 12;

/** Caminho da imagem do produto, servida de /public/produtos/<id>.svg. */
export function imagemProduto(produto: Produto): string {
  return `/produtos/${produto.id}.svg`;
}

// Itens de exemplo para a vitrine. Trocar pela fonte real quando o catálogo for importado.
export const PRODUTOS: Produto[] = [
  {
    id: "caneca-floww",
    nome: "Caneca Floww",
    categoria: "Utilidades",
    descricao: "Caneca de cerâmica com o logo da Floww, 350 ml.",
    preco: 120,
  },
  {
    id: "camiseta-orcoma",
    nome: "Camiseta Orcoma",
    categoria: "Vestuário",
    descricao: "Camiseta de algodão, estampa frente e costas.",
    preco: 250,
  },
  {
    id: "fone-bluetooth",
    nome: "Fone Bluetooth",
    categoria: "Tecnologia",
    descricao: "Fone sem fio com cancelamento de ruído e 20 h de bateria.",
    preco: 900,
  },
  {
    id: "vale-presente",
    nome: "Vale-presente",
    categoria: "Benefícios",
    descricao: "Vale-presente para usar em lojas parceiras.",
    preco: 50,
  },
  {
    id: "livro-lideranca",
    nome: "Livro de liderança",
    categoria: "Desenvolvimento",
    descricao: "Leitura recomendada para quem quer evoluir na carreira.",
    preco: 300,
  },
  {
    id: "kit-games",
    nome: "Kit games",
    categoria: "Lazer",
    descricao: "Controle sem fio para jogar nos momentos de pausa.",
    preco: 450,
  },
  {
    id: "mochila-orcoma",
    nome: "Mochila Orcoma",
    categoria: "Utilidades",
    descricao: "Mochila com compartimento para notebook de até 15,6 polegadas.",
    preco: 380,
  },
  {
    id: "caderno-orcoma",
    nome: "Caderno Orcoma",
    categoria: "Utilidades",
    descricao: "Caderno de capa dura com 96 folhas pautadas.",
    preco: 90,
  },
  {
    id: "caneta-premium",
    nome: "Caneta premium",
    categoria: "Utilidades",
    descricao: "Caneta esferográfica metálica com gravação do logo.",
    preco: 60,
  },
  {
    id: "luminaria-mesa",
    nome: "Luminária de mesa",
    categoria: "Utilidades",
    descricao: "Luminária de mesa com três níveis de brilho.",
    preco: 260,
  },
  {
    id: "guarda-chuva-orcoma",
    nome: "Guarda-chuva Orcoma",
    categoria: "Utilidades",
    descricao: "Guarda-chuva automático, resistente ao vento.",
    preco: 180,
  },
  {
    id: "adesivos-floww",
    nome: "Adesivos Floww",
    categoria: "Utilidades",
    descricao: "Kit com 10 adesivos oficiais da Floww.",
    preco: 40,
  },
  {
    id: "mouse-sem-fio",
    nome: "Mouse sem fio",
    categoria: "Tecnologia",
    descricao: "Mouse silencioso com bateria de longa duração.",
    preco: 350,
  },
  {
    id: "teclado-mecanico",
    nome: "Teclado mecânico",
    categoria: "Tecnologia",
    descricao: "Teclado mecânico com iluminação RGB.",
    preco: 700,
  },
  {
    id: "smartwatch",
    nome: "Smartwatch",
    categoria: "Tecnologia",
    descricao: "Relógio inteligente com monitor de atividades e notificações.",
    preco: 1200,
  },
  {
    id: "caixa-de-som",
    nome: "Caixa de som",
    categoria: "Tecnologia",
    descricao: "Caixa de som portátil Bluetooth, à prova de respingos.",
    preco: 600,
  },
  {
    id: "camera-instantanea",
    nome: "Câmera instantânea",
    categoria: "Tecnologia",
    descricao: "Câmera que imprime fotos na hora para registrar o time.",
    preco: 800,
  },
  {
    id: "vale-viagem",
    nome: "Vale-viagem",
    categoria: "Benefícios",
    descricao: "Vale-viagem para usar em companhias parceiras.",
    preco: 1500,
  },
  {
    id: "ingresso-cinema",
    nome: "Ingresso de cinema",
    categoria: "Lazer",
    descricao: "Ingresso duplo para qualquer sessão em cinemas parceiros.",
    preco: 80,
  },
  {
    id: "jogo-tabuleiro",
    nome: "Jogo de tabuleiro",
    categoria: "Lazer",
    descricao: "Jogo de tabuleiro para o time se divertir junto.",
    preco: 220,
  },
  {
    id: "trofeu-destaque",
    nome: "Troféu destaque",
    categoria: "Reconhecimento",
    descricao: "Troféu para homenagear o destaque do mês.",
    preco: 500,
  },
];
