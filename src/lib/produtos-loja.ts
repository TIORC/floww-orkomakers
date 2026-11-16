import { BookOpen, Coffee, Gamepad2, Gift, Headphones, Shirt, type LucideIcon } from "lucide-react";

export type Produto = {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  /** Preço em Floww Coins. */
  preco: number;
  icone: LucideIcon;
};

// Itens de exemplo para a vitrine. Trocar pela fonte real quando o catálogo for importado.
export const PRODUTOS: Produto[] = [
  {
    id: "caneca-floww",
    nome: "Caneca Floww",
    categoria: "Utilidades",
    descricao: "Caneca de cerâmica com o logo da Floww, 350 ml.",
    preco: 120,
    icone: Coffee,
  },
  {
    id: "camiseta-orcoma",
    nome: "Camiseta Orcoma",
    categoria: "Vestuário",
    descricao: "Camiseta de algodão, estampa frente e costas.",
    preco: 250,
    icone: Shirt,
  },
  {
    id: "fone-bluetooth",
    nome: "Fone Bluetooth",
    categoria: "Tecnologia",
    descricao: "Fone sem fio com cancelamento de ruído e 20 h de bateria.",
    preco: 900,
    icone: Headphones,
  },
  {
    id: "vale-presente",
    nome: "Vale-presente",
    categoria: "Benefícios",
    descricao: "Vale-presente para usar em lojas parceiras.",
    preco: 50,
    icone: Gift,
  },
  {
    id: "livro-lideranca",
    nome: "Livro de liderança",
    categoria: "Desenvolvimento",
    descricao: "Leitura recomendada para quem quer evoluir na carreira.",
    preco: 300,
    icone: BookOpen,
  },
  {
    id: "kit-games",
    nome: "Kit games",
    categoria: "Lazer",
    descricao: "Controle sem fio para jogar nos momentos de pausa.",
    preco: 450,
    icone: Gamepad2,
  },
];
