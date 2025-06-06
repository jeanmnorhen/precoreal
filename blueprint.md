# App Blueprint: PREÇO REAL

Este documento descreve as principais funcionalidades, casos de uso e diretrizes de estilo para o aplicativo Preço Real.

## Visão Geral

O Preço Real visa conectar consumidores a ofertas locais em tempo real, permitindo a descoberta geolocalizada de produtos e serviços. Lojistas podem cadastrar seus estabelecimentos e anunciar produtos. O aplicativo utiliza IA para análise de imagens e planeja futuras integrações para enriquecer a experiência do usuário e fornecer insights administrativos.

## Funcionalidades Principais (Core Features):

- **Feed de Ofertas Geolocalizado:** Exibe ofertas próximas com base na localização do usuário.
- **Filtragem e Ordenação de Produtos:** Permite filtrar por categoria e ordenar por proximidade ou preço.
- **Análise de Imagem para Ofertas (IA):** Permite que usuários identifiquem produtos via imagem (upload/câmera) para buscar ofertas.
- **Cadastro e Gerenciamento de Lojas:** Interface para lojistas registrarem e gerenciarem suas lojas e produtos.
- **Catálogo Canônico de Produtos:** Mantém um catálogo centralizado de produtos, com gerenciamento administrativo e sugestões proativas.
- **Histórico de Preços:** Rastreia dados de anúncios expirados para análise de tendências.
- **Perfis de Usuário:** Permite que consumidores salvem preferências (ex: localização).
- **Interface Administrativa:** Para gerenciamento de sugestões de produtos, catálogo canônico e visualização de dados de monitoramento.
- **Internacionalização:** Suporte a múltiplos idiomas.
- **Design Responsivo:** Otimizado para dispositivos móveis com navegação dedicada.

## Diretrizes de Estilo (Style Guidelines):

- **Fonte:** 'Inter' (sans-serif) para corpo e títulos.
- **Ícones:** Claros e reconhecíveis para categorias e filtros.
- **Layout:** Baseado em cards para listagens de produtos.
- **Experiência do Usuário:** Transições suaves e animações de carregamento.
- **Navegação Mobile:** Barra de navegação inferior fixa para links principais.

## Casos de Uso (User Cases - UC):

**Consumidor:**

- **UC1: Descoberta de Ofertas Próximas (Feed Geolocalizado):**
  - Usuário abre o app e vê um feed de ofertas de lojas próximas (GPS ou localização salva).
  - Anúncios mostram nome do produto, preço, loja e distância.
- **UC2: Filtragem e Busca de Produto Específico por Proximidade:**
  - Usuário filtra por categoria ou busca por um produto.
  - Sistema exibe lojas próximas com o produto, ordenadas por proximidade.
- **UC6/UC15: Análise de Imagem para Busca de Ofertas (Upload/Câmera):**
  - Usuário tira foto ou faz upload de imagem de um item.
  - Sistema identifica o item (via Genkit) e busca ofertas correspondentes.
  - Se o produto não estiver no catálogo canônico, sugere sua adição.
- **UC7: Descoberta de Produtos Relacionados (IA):** (Em Desenvolvimento)
  - Após identificação de objetos (UC6), sistema pode sugerir produtos comercialmente relevantes.
- **UC8: Extração de Propriedades de Produtos (IA):** (Não Implementado)
  - Para produtos identificados, sistema pode extrair características (cor, marca, material).
- **UC9: Feedback Visual do Processamento (Análise de Imagem):**
  - Usuário visualiza progresso e recebe notificações (toasts) sobre status/erros da análise.
- **UC10: Consulta de Produtos no Catálogo:**
  - Pesquisa no catálogo canônico.
  - Se busca na HomePage não encontrar ofertas, mas produto existir no catálogo, informa o usuário.
  - Se não existir nem em anúncios nem no catálogo, sugere novo produto.
- **UC12: Definição de Idioma da Interface:**
  - Detecção automática ou seleção manual do idioma. Rotas incluem código do idioma.

**Lojista:**

- **UC3: Cadastro e Gerenciamento de Perfil de Loja:**
  - Lojista se cadastra e preenche perfil da loja (nome, endereço, localização geográfica - lat/lon).
  - Lojista pode editar as informações da sua loja.
- **UC4: Publicação e Edição de Anúncios/Ofertas:**
  - Lojista autenticado cria e edita anúncios (produto, preço, categoria, descrição, imagem, validade).
  - Anúncios aparecem no feed de usuários próximos.

**Sistema/Administrador:**

- **UC5: Gerenciamento de Anúncios e Histórico de Preços:**
  - Anúncios têm validade definida.
  - Anúncios expirados são movidos para `/priceHistory` e marcados como `archived: true`.
- **UC11: Gerenciamento de Dados e Perfis (Autenticação):**
  - Autenticação para lojistas.
  - Interface de Admin para gerenciar catálogo canônico e sugestões de novos produtos.
  - Usuários consumidores podem salvar localização preferida no perfil.
- **UC13: Monitoramento de Dados Agregados:**
  - Página para administradores visualizarem valor médio de produtos e tendências de preço.
- **UC14: Interação com Superagente de Análise via Chat (Admin):** (Não Implementado)
  - Administrador interage com IA para obter insights sobre o projeto.
