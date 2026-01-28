
export interface Product {
  anuncio: string;
  loja: string;
  valorDolar: number;
  precoCusto: number;
  precoVenda: number;
}

export interface ApiResponse {
  atualizadoEm: string;
  cotacaoDolar: number;
  totalProdutos: number;
  produtos: Product[];
}

export interface GroupedProducts {
  [loja: string]: Product[];
}
