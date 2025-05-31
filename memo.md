
Relatório do Projeto: Preço Real

1. Objetivos do Projeto

Nome do Projeto: Preço Real 

Objetivo Principal: Permitir que usuários encontrem produtos e serviços sendo anunciados por estabelecimentos comerciais próximos à sua localização em tempo real.

Facilitar a descoberta de ofertas locais através de um feed de produtos geolocalizado.

Usar firebase real time database.
Minhas credenciais:
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDfDN7WxXp7aO_GzMKtmHoRtlH47AA9aP4"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="precoreal-1554a.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://precoreal-1554a-default-rtdb.firebaseio.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="precoreal-1554a"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="precoreal-1554a.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="510210246979"
NEXT_PUBLIC_FIREBASE_APP_ID="1:510210246979:web:0baa092b62b422841287f6"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXTGSVMQQE"
GEMINI_API_KEY=AIzaSyByrggmNnonVbCBaqoXCEbB2Jb1JwIEz8M

Permitir que usuários filtrem produtos por categoria.

Apresentar lojas que vendem um produto específico, ordenadas por proximidade. (Concluído - Cálculo de distância implementado. Entrada de localização da loja via campos numéricos. UX da permissão de localização do usuário funcional.)

Permitir que lojistas (outro tipo de cliente do aplicativo) cadastrem seus estabelecimentos e anunciem seus produtos na plataforma. (Concluído - Implementada autenticação para lojistas. Lojas incluem agora latitude e longitude.)

Anúncios de produtos terão um tempo de validade definido entre 1 e 7 dias. (Concluído)

Os dados dos anúncios expirados serão registrados para compor um histórico de preços. (Concluído - Anúncios expirados e não arquivados são movidos para /priceHistory e marcados como `archived: true` em /advertisements.)

Utilizar a localização GPS do usuário (com consentimento) para otimizar a busca por ofertas e lojas. (Concluído - Usuário pode fornecer localização. Distância real calculada e usada para ordenação.)

Oferecer uma interface de usuário intuitiva e responsiva.
    - Em dispositivos móveis, os links de navegação principais (Ofertas, Analisar Imagem, Monitoramento, Para Lojas/Meus Produtos) são apresentados em uma barra de navegação inferior fixa, similar à interface do WhatsApp, para melhor usabilidade. (Ajustado para incluir autenticação e Monitoramento)
    - Rodapé removido do aplicativo. (Concluído)

Funcionalidade Secundária: Permitir que os usuários façam upload de imagens ou tirem fotos com a câmera do dispositivo para análise (identificar objetos). Essa funcionalidade pode ser usada para ajudar o usuário a identificar um item sobre o qual deseja buscar ofertas no feed principal. (Concluído)

Integrar com Firebase Realtime Database para:

Manter um catálogo de produtos canônicos (para referência.) (Iniciando implementação)

Registrar lojas/estabelecimentos, incluindo sua localização geográfica e perfis. (UC3 - Concluído, forma salva em /stores com ownerId vinculado ao usuário autenticado e campos para latitude/longitude.)

Registrar anúncios/ofertas de produtos feitos por lojistas, incluindo preço, validade e localização. (UC4 - Concluído, forma salva em /advertisements, vinculada a um storeId.)

Rastrear o histórico de preços dos produtos, alimentado pelos anúncios expirados. (UC5 - Concluído, dados salvos em /priceHistory, anúncios originais marcados como arquivados.)

Manter perfis de usuário (consumidores) com preferences e dados como localização. (Autenticação de Lojistas implementada, perfis de consumidor ainda não.)

Fornecer uma página de monitoramento para visualizar dados agregados (ex: valor médio de um produto por região/país, tendências de preço). (UC13 - Concluído - Exibe histórico de preços de produtos selecionados com tabela e gráfico de tendência.)

Visão Futura:

Implementar um sistema de Retrieval Augmented Generation (RAG) geospacial para clusterizar/agrupar lojas, anúncios e produtos por proximidade, otimizando o tráfego de dados e garantindo informações atualizadas das lojas mais próximas ao usuário.

Desenvolver "Superagentes" de IA para funcionalidades avançadas (ver seção 8).

Busca ativa por produtos para registrar no catálogo canônico: A identificação de objetos por imagem ou buscas por new products na barra de pesquisa (que não retornam resultados do catálogo) podem servir como gatilhos para sugerir/adicionar novos produtos ao catálogo canônico do Preço Real. Isso pode envolver um fluxo de IA para enriquecer os dados do produto antes de adicioná-lo. (Iniciando implementação - Tipos definidos)

2. Casos de Uso

UC1 (Principal): Descoberta de Ofertas Próximas (Feed Geolocalizado):

O usuário (consumidor) abre o aplicativo Preço Real.
O aplicativo solicita e utiliza a localização GPS do usuário se o usuário não tiver uma localização salva no perfil e permitir. (Concluído - Usuário pode fornecer localização via botão; cálculo de distância agora é real se coordenadas estiverem disponíveis. UX da solicitação de permissão melhorada com AlertDialog.)
O sistema exibe um feed de produtos/ofertas que estão sendo anunciados por lojas próximas ao usuário. (Concluído - Busca dados de /advertisements, filtra expirados e arquivados. Nome real da loja buscado de /stores. Distância real calculada se localizações disponíveis.)
Os anúncios são apresentados com informações como nome do produto, preço, nome da loja e distância.
O usuário pode rolar o feed para ver mais ofertas.

UC2 (Principal): Filtragem e Busca de Produto Específico por Proximidade:

(Continuando do UC1 ou como uma ação separada) O usuário deseja um produto específico (ex: "hot dog").
O usuário utiliza um filtro de categoria (ex: toca no ícone "hot dog") ou uma barra de busca. (Nomes das categorias agora internacionalizados no filtro).
O sistema exibe uma lista de todas as lojas próximas que anunciaram "hot dogs" (ou o produto buscado), ordenadas pela proximidade em relação ao usuário. (Concluído - Ordenação por distância real implementada.)
Cada item da lista mostra o nome da loja, o produto, o preço anunciado e a distância.

UC3 (Lojista): Cadastro e Gerenciamento de Perfil de Loja:

Um proprietário de loja se cadastra no Preço Real como "lojista". (Implementada funcionalidade de cadastro de usuário lojista com email/senha.)
O lojista preenche o perfil da sua loja, incluindo nome, endereço, tipo de estabelecimento e, crucialmente, define sua localização geográfica (latitude e longitude). (Concluído - Formulário de cadastro implementado, salvando em Firebase RTDB em `/stores/{storeId}` com `ownerId` vinculado ao UID do lojista e campos para lat/lon. UX dos campos de coordenadas melhorada com dicas.)
A página de cadastro de loja agora requer que o usuário esteja autenticado.

UC4 (Lojista): Publicação de Anúncios/Ofertas:

O lojista autenticado acessa a interface para criar um novo anúncio. 
Ele informa o nome do produto, preço, categoria, opcionalmente uma descrição e imagem. (Concluído - Formulário de listagem de produto implementado, salvando em Firebase RTDB em `/advertisements/{advertisementId}`.)
A página de listagem de produtos agora requer que o usuário esteja autenticado e possua uma loja cadastrada. O `storeId` do anúncio é o ID da loja do usuário.

O anúncio publicado aparece no feed de usuários próximos que se encaixam na categoria do produto.

UC5 (Sistema): Gerenciamento de Anúncios e Histórico de Preços:

Anúncios publicados têm um tempo de vida limitado de entre 1 a 7 dias. (Implementado no formulário de listagem, `validUntil` é calculado. Filtragem de expirados implementada no feed UC1)
Após a expiração, o anúncio desaparece do feed ativo dos usuários. (Implementado - anúncios expirados e não arquivados são processados)
Os dados do anúncio expirado (produto, preço, loja, data) são registrados no sistema de histórico de preços em `/priceHistory`. O anúncio original em `/advertisements` é marcado com `archived: true`. (Concluído)

UC6: Análise de Imagem (Upload ou Câmera) para Busca de Ofertas:

Um usuário (consumidor), como o de Formosa, Goiás, está com fome e quer um "hot dog".
Ele abre o app Preço Real, que atualiza o feed de ofertas locais.
O usuário pode opcionalmente tocar no ícone da câmera, tirar uma foto de um hot dog (ou selecionar uma imagem do seu dispositivo). 
O sistema identifica "hot dog" na imagem. (Fluxo Genkit `analyzeImageOffers` implementado para identificação do produto. Upload de imagem funcional. Funcionalidade de câmera (UC15) implementada.)
O sistema então busca e exibe uma lista de todas as lojas que vendem "hot dogs", ordenadas por proximidade. A busca é feita no feed principal de `/advertisements` usando o nome do produto identificado como termo de busca. (Concluído - Análise de imagem redireciona para o feed com termo de busca).
    - *Próximo passo: Verificar se produto identificado existe em `/canonicalProducts` e, se não, sugerir adição.*

UC7 (Apoio à busca via imagem): Descoberta de Produtos Relacionados (IA):

Após a identificação de objetos (UC6), se o usuário desejar, o sistema (via IA) pode sugerir produtos comercialmente disponíveis que são relevantes (usando nomes em inglês/idioma base). 

UC8 (Apoio à informação via imagem): Extração de Propriedades de Produtos (IA):

Para produtos identificados (UC6) ou encontrados (UC7), o sistema (via IA) pode extrair e apresentar características importantes (ex: cor, material, marca), se aplicável e útil para o contexto de "Preço Real". 

UC9 (Para análise de imagem): Feedback Visual do Processamento:

O usuário visualiza o progresso da análise da imagem em etapas. 
O usuário recebe notificações (toasts) sobre o status e erros. (Implementado no ImageAnalysisTool)

UC10: Consulta de Produtos no Banco de Dados (Catálogo - via análise de imagem):

O usuário (ou o sistema através da análise de imagem) pode pesquisar produtos existentes no catálogo de produtos canônicos do Preço Real.
O sistema exibe informações do produto, incluindo dados multilíngues e, potencialmente, um resumo do histórico de preços. Esta busca é atualmente feita pelo findStoresTool com base em um canonicalName.
    - *Próximo passo: Integrar busca em `/canonicalProducts` na `HomePage` e `ImageAnalysisTool`.*

UC11: Gerenciamento de Dados de Produtos e Perfis de Consumidor (com Autenticação):

Implementada autenticação para lojistas (cadastro, login, logout). As lojas são vinculadas aos UIDs dos lojistas.
Administradores do Preço Real (se houver) poderão gerenciar o catálogo de produtos canônicos, categorias, etc. (Ainda não implementado - Estrutura para `suggestedNewProducts` definida)

UC12: Definição de Idioma da Interface: (Implementado)
O sistema pode tentar detectar o idioma preferido do usuário através das configurações do navegador.
O sistema permite ao usuário alternar o idioma da interface (ex: Português, Inglês, Espanhol) através de um seletor.
As rotas incluirão o código do idioma (ex: /pt/ofertas, /en/offers).

UC13: Monitoramento de Dados Agregados:

O usuário (administrador ou analista do Preço Real) acessa uma página de monitoramento. 
O usuário seleciona um produto.
O sistema exibe o valor médio desse produto/categoria em diferentes regiões/países onde há anúncios registrados, com base nos dados de anúncios expirados e perfis de lojas. (Concluído - Página de monitoramento exibe histórico de preços de produtos de `/priceHistory` com tabela e gráfico.)

UC14 (Administrador): Interação com Superagente de Análise via Chat:

O administrador acessa uma página de chat dedicada (ex: /admin/super-agent-chat).
O administrador interage com o "Superagente de Análise e Relatórios" para obter insights sobre o projeto, uso do banco de dados, atividade de usuários, possíveis falhas ou pontos de atenção. 

UC15 (Variação de UC6): Uso da Câmera para Identificação e Busca Rápida: (Concluído)

Um usuário abre o Preço Real.
O aplicativo exibe o feed de ofertas locais.
O usuário toca no ícone da câmera (na aba "Identificar").
O aplicativo solicita permissão para usar a câmera.
O usuário tira uma foto de um item (ex: um hot dog).
A imagem capturada é usada para identificar o objeto ("hot dog").
O sistema busca e exibe uma lista de lojas que anunciam "hot dogs", ordenadas por proximidade. (Concluído via UC6)

3. Plano para versão atual 
- Configurar Firebase e integrar formulários de cadastro de loja e listagem de produtos. (Concluído, com autenticação de lojista)
- Atualizar feed de ofertas para buscar dados do Firebase. (Concluído - Busca de /advertisements e /stores implementada, filtragem de expirados e arquivados feita. Nome real da loja é exibido. Distância real calculada se coordenadas disponíveis.)
- Implementar funcionalidade de câmera para análise de imagem. (Concluído)
- Paleta de cores atualizada para Azul Médio Primário, Laranja Brilhante Secundário, Fundo Branco, Texto Azul Escuro e Acento Laranja Claro/Dourado. (Concluído - Usuário definiu nova paleta: Primária: #026296 (Azul Médio), Secundária: #F27F00 (Laranja Brilhante), Fundo: #FFFFFF (Branco), Foreground: #01304A (Azul Escuro/Marinho), Acento: #FBB849 (Laranja Claro/Dourado)).
- Conectar análise de imagem (UC6) à busca de ofertas no feed principal. (Concluído - Análise de imagem redireciona para o feed com o produto identificado como termo de busca).
- Implementar autenticação para lojistas (Email/Senha) e proteger as rotas de cadastro de loja e listagem de produtos. (Concluído)
- Implementar cálculo de distância real ou permitir que o usuário salve uma localização (GPS). (Concluído - Lojistas podem adicionar lat/lon. Usuários podem fornecer localização para cálculo de distância. UX da permissão melhorada.)
- Implementar sistema de histórico de preços (UC5). (Concluído - Anúncios expirados são arquivados e movidos para `/priceHistory`).
- Criar página de monitoramento de preços (UC13). (Concluído - Exibe histórico de preços e gráfico de tendência).
- Melhorar UX do cadastro de localização da loja e da solicitação de permissão de localização do usuário. (Concluído - Adicionadas dicas e AlertDialog para permissão).
- Implementar catálogo de produtos canônicos e a funcionalidade de registro proativo. (Em andamento - Tipos `CanonicalProduct` e `SuggestedNewProduct` definidos).

4. Estado Atual
- Estrutura básica do Next.js com internacionalização (i18n) configurada (incluindo ru, zh-CN, es-CL, es-MX como placeholders). Nomes das categorias no filtro internacionalizados.
- Layout responsivo com navegação superior para desktop e inferior para mobile. Rodapé removido. (Concluído)
- Página de feed de ofertas (UC1) buscando dados do Firebase Realtime Database (`/advertisements` e `/stores`). Nomes reais das lojas são exibidos. Distância real calculada e utilizada para ordenação se o usuário permitir acesso à localização (com diálogo de confirmação) e as lojas tiverem coordenadas. Anúncios expirados e arquivados são filtrados.
- Página de análise de imagem (UC6) com upload de arquivo, funcionalidade de câmera (UC15) e integração com Genkit para identificação do produto. Após identificação, redireciona para o feed de ofertas com o produto como termo de busca.
- Formulários de cadastro de loja (UC3) e listagem de produtos (UC4) salvando no Firebase RTDB e protegidos por autenticação. Lojas são vinculadas ao `ownerId` e podem ter `latitude`/`longitude` (com dicas de UX melhoradas). Produtos são listados sob o `storeId` da loja do usuário.
- Paleta de cores atualizada conforme solicitação do usuário (Primária: Azul Médio `#026296`, Secundária: Laranja Brilhante `#F27F00`, Fundo: Branco `#FFFFFF`, Foreground: Azul Escuro `#01304A`, Acento: Laranja Claro `#FBB849`).
- `QueryClientProvider` e `AuthProvider` configurados.
- Autenticação de lojistas (Email/Senha) implementada com páginas de cadastro, login e funcionalidade de logout.
- Sistema de histórico de preços (UC5) implementado: anúncios expirados e não arquivados são movidos para `/priceHistory` e marcados como `archived: true` em `/advertisements`.
- Página de monitoramento de preços (UC13) implementada, exibindo histórico de preços com tabela e gráfico de tendência.
- Melhorias de UX na solicitação de permissão de localização do usuário (AlertDialog) e dicas nos campos de coordenadas do cadastro de loja. (Concluído)
- Tipos `CanonicalProduct` e `SuggestedNewProduct` definidos em `src/types/index.ts` como parte da funcionalidade de catálogo de produtos. (Concluído)

5. Planejamento para próximas versões
- Melhorar UX do cadastro de localização da loja (ex: usar um mapa interativo).
- Permitir que o usuário salve sua preferência de localização (ou uma localização manual como "casa" ou "trabalho") no perfil do usuário.
- **PRÓXIMO PASSO:** Continuar implementação do catálogo de produtos canônicos:
    - Integrar verificação do catálogo e registro de sugestões na Análise de Imagem (UC6, UC10).
    - Integrar verificação do catálogo e registro de sugestões na Busca da HomePage (UC10).
- Considerar fluxo para lojista editar informações da loja e produtos.
- Permitir que lojistas tenham múltiplas lojas (se necessário).
- Implementar interface de administração para gerenciar `/canonicalProducts` e `/suggestedNewProducts` (UC11).
- Integrar fluxos de IA para enriquecimento e adição automática de produtos ao catálogo.

6. Rotinas de manutenção 

Sempre que receber um prompt que contenha ponto final “.” Revise o arquivo memo.md.

Sempre que receber um prompt que contenha dois pontos finais “..” Revise o arquivo memo.md. e continue implementando.

7. Definição de Cores Atual (Conforme solicitado pelo usuário)
- Primary Color: `#026296` (Medium Blue)
- Secondary Color: `#F27F00` (Bright Orange)
- Background: `#FFFFFF` (White)
- Foreground: `#01304A` (Dark Blue/Navy)
- Accent: `#FBB849` (Light Orange/Gold)
(Estas cores estão implementadas em `src/app/globals.css`)
