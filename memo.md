
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

Apresentar lojas que vendem um produto específico, ordenadas por proximidade. (Parcialmente concluído - Cálculo de distância implementado, falta entrada de localização da loja via mapa e melhorias na UX da permissão de localização do usuário.)

Permitir que lojistas (outro tipo de cliente do aplicativo) cadastrem seus estabelecimentos e anunciem seus produtos na plataforma. (Concluído - Implementada autenticação para lojistas. Lojas incluem agora latitude e longitude.)

Anúncios de produtos terão um tempo de validade definido entre 1 e 7 dias.

Os dados dos anúncios expirados serão registrados para compor um histórico de preços.

Utilizar a localização GPS do usuário (com consentimento) para otimizar a busca por ofertas e lojas. (Parcialmente Concluído - Usuário pode fornecer localização. Distância real calculada.)

Oferecer uma interface de usuário intuitiva e responsiva.
    - Em dispositivos móveis, os links de navegação principais (Ofertas, Analisar Imagem, Para Lojas) são apresentados em uma barra de navegação inferior fixa, similar à interface do WhatsApp, para melhor usabilidade. (Ajustado para incluir autenticação)

Funcionalidade Secundária: Permitir que os usuários façam upload de imagens ou tirem fotos com a câmera do dispositivo para análise (identificar objetos). Essa funcionalidade pode ser usada para ajudar o usuário a identificar um item sobre o qual deseja buscar ofertas no feed principal.

Integrar com Firebase Realtime Database para:

Manter um catálogo de produtos canônicos (para referência.)

Registrar lojas/estabelecimentos, incluindo sua localização geográfica e perfis. (UC3 - Concluído, forma salva em /stores com ownerId vinculado ao usuário autenticado e campos para latitude/longitude.)

Registrar anúncios/ofertas de produtos feitos por lojistas, incluindo preço, validade e localização. (UC4 - Concluído, forma salva em /advertisements, vinculada a um storeId.)

Rastrear o histórico de preços dos produtos, alimentado pelos anúncios expirados.

Manter perfis de usuário (consumidores) com preferences e dados como localização. (Autenticação de Lojistas implementada, perfis de consumidor ainda não.)

Fornecer uma página de monitoramento para visualizar dados agregados (ex: valor médio de um produto por região/país, tendências de preço).

Visão Futura:

Implementar um sistema de Retrieval Augmented Generation (RAG) geospacial para clusterizar/agrupar lojas, anúncios e produtos por proximidade, otimizando o tráfego de dados e garantindo informações atualizadas das lojas mais próximas ao usuário.

Desenvolver "Superagentes" de IA para funcionalidades avançadas (ver seção 8).

Busca ativa por produtos para registrar no catálogo canônico: A identificação de objetos por imagem ou buscas por novos produtos na barra de pesquisa (que não retornam resultados do catálogo) podem servir como gatilhos para sugerir/adicionar novos produtos ao catálogo canônico do Preço Real. Isso pode envolver um fluxo de IA para enriquecer os dados do produto antes de adicioná-lo.

2. Casos de Uso

UC1 (Principal): Descoberta de Ofertas Próximas (Feed Geolocalizado):

O usuário (consumidor) abre o aplicativo Preço Real.
O aplicativo solicita e utiliza a localização GPS do usuário se o usuário não tiver uma localização salva no perfil e permitir. (Concluído - Usuário pode fornecer localização via botão; cálculo de distância agora é real se coordenadas estiverem disponíveis.)
O sistema exibe um feed de produtos/ofertas que estão sendo anunciados por lojas próximas ao usuário. (Concluído - Busca dados de /advertisements, filtra expirados. Nome real da loja buscado de /stores. Distância real calculada se localizações disponíveis.)
Os anúncios são apresentados com informações como nome do produto, preço, nome da loja e distância.
O usuário pode rolar o feed para ver mais ofertas.

UC2 (Principal): Filtragem e Busca de Produto Específico por Proximidade:

(Continuando do UC1 ou como uma ação separada) O usuário deseja um produto específico (ex: "hot dog").
O usuário utiliza um filtro de categoria (ex: toca no ícone "hot dog") ou uma barra de busca.
O sistema exibe uma lista de todas as lojas próximas que anunciaram "hot dogs" (ou o produto buscado), ordenadas pela proximidade em relação ao usuário. (Concluído - Ordenação por distância real implementada.)
Cada item da lista mostra o nome da loja, o produto, o preço anunciado e a distância.

UC3 (Lojista): Cadastro e Gerenciamento de Perfil de Loja:

Um proprietário de loja se cadastra no Preço Real como "lojista". (Implementada funcionalidade de cadastro de usuário lojista com email/senha.)
O lojista preenche o perfil da sua loja, incluindo nome, endereço, tipo de estabelecimento e, crucialmente, define sua localização geográfica (latitude e longitude). (Concluído - Formulário de cadastro implementado, salvando em Firebase RTDB em `/stores/{storeId}` com `ownerId` vinculado ao UID do lojista e campos para lat/lon.)
A página de cadastro de loja agora requer que o usuário esteja autenticado.

UC4 (Lojista): Publicação de Anúncios/Ofertas:

O lojista autenticado acessa a interface para criar um novo anúncio. 
Ele informa o nome do produto, preço, categoria, opcionalmente uma descrição e imagem. (Concluído - Formulário de listagem de produto implementado, salvando em Firebase RTDB em `/advertisements/{advertisementId}`.)
A página de listagem de produtos agora requer que o usuário esteja autenticado e possua uma loja cadastrada. O `storeId` do anúncio é o ID da loja do usuário.

O anúncio publicado aparece no feed de usuários próximos que se encaixam na categoria do produto.

UC5 (Sistema): Gerenciamento de Anúncios e Histórico de Preços:

Anúncios publicados têm um tempo de vida limitado de entre 1 a 7 dias. (Implementado no formulário de listagem, `validUntil` é calculado. Filtragem de expirados implementada no feed UC1)
Após a expiração, o anúncio desaparece do feed ativo dos usuários. 
Os dados do anúncio expirado (produto, preço, loja, data) são registrados no sistema de histórico de preços associado ao produto (se for um produto catalogado) e/ou à loja. (Coleta de dados expirados para histórico pendente)

UC6: Análise de Imagem (Upload ou Câmera) para Busca de Ofertas:

Um usuário (consumidor), como o de Formosa, Goiás, está com fome e quer um "hot dog".
Ele abre o app Preço Real, que atualiza o feed de ofertas locais.
O usuário pode opcionalmente tocar no ícone da câmera, tirar uma foto de um hot dog (ou selecionar uma imagem do seu dispositivo). 
O sistema identifica "hot dog" na imagem. (Fluxo Genkit `analyzeImageOffers` implementado para identificação do produto. Upload de imagem funcional. Funcionalidade de câmera (UC15) implementada.)
O sistema então busca e exibe uma lista de todas as lojas que vendem "hot dogs", ordenadas por proximidade. A busca é feita no feed principal de `/advertisements` usando o nome do produto identificado como termo de busca. (Concluído - Análise de imagem redireciona para o feed com termo de busca).

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

UC11: Gerenciamento de Dados de Produtos e Perfis de Consumidor (com Autenticação):

Implementada autenticação para lojistas (cadastro, login, logout). As lojas são vinculadas aos UIDs dos lojistas.
Administradores do Preço Real (se houver) poderão gerenciar o catálogo de produtos canônicos, categorias, etc. (Ainda não implementado)

UC12: Definição de Idioma da Interface: (Implementado)
O sistema pode tentar detectar o idioma preferido do usuário através das configurações do navegador.
O sistema permite ao usuário alternar o idioma da interface (ex: Português, Inglês, Espanhol) através de um seletor.
As rotas incluirão o código do idioma (ex: /pt/ofertas, /en/offers).

UC13: Monitoramento de Dados Agregados:

O usuário (administrador ou analista do Preço Real) acessa uma página de monitoramento. 
O usuário seleciona um produto ou categoria.
O sistema exibe o valor médio desse produto/categoria em diferentes regiões/países onde há anúncios registrados, com base nos dados de anúncios expirados e perfis de lojas. (PÁGINA DE MONITORAMENTO USA productAvailability, PRECISA ADAPTAR PARA /advertisements E HISTÓRICO)

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
- Atualizar feed de ofertas para buscar dados do Firebase. (Concluído - Busca de /advertisements e /stores implementada, filtragem de expirados feita. Nome real da loja é exibido. Distância real calculada se coordenadas disponíveis.)
- Implementar funcionalidade de câmera para análise de imagem. (Concluído)
- Paleta de cores atualizada para Azul Médio Primário, Laranja Brilhante Secundário, Fundo Branco, Texto Azul Escuro e Acento Laranja Claro/Dourado. (Concluído)
- Conectar análise de imagem (UC6) à busca de ofertas no feed principal. (Concluído - Análise de imagem redireciona para o feed com o produto identificado como termo de busca).
- Implementar autenticação para lojistas (Email/Senha) e proteger as rotas de cadastro de loja e listagem de produtos. (Concluído)
- Implementar cálculo de distância real ou permitir que o usuário salve uma localização (GPS). (Concluído - Lojistas podem adicionar lat/lon. Usuários podem fornecer localização para cálculo de distância.)

4. Estado Atual
- Estrutura básica do Next.js com internacionalização (i18n) configurada.
- Layout responsivo com navegação superior para desktop e inferior para mobile.
- Página de feed de ofertas (UC1) buscando dados do Firebase Realtime Database (`/advertisements` e `/stores`). Nomes reais das lojas são exibidos. Distância real calculada e utilizada para ordenação se o usuário permitir acesso à localização e as lojas tiverem coordenadas.
- Página de análise de imagem (UC6) com upload de arquivo, funcionalidade de câmera (UC15) e integração com Genkit para identificação do produto. Após identificação, redireciona para o feed de ofertas com o produto como termo de busca.
- Formulários de cadastro de loja (UC3) e listagem de produtos (UC4) salvando no Firebase RTDB e protegidos por autenticação. Lojas são vinculadas ao `ownerId` e podem ter `latitude`/`longitude`. Produtos são listados sob o `storeId` da loja do usuário.
- Paleta de cores atualizada conforme solicitação do usuário.
- `QueryClientProvider` e `AuthProvider` configurados.
- Autenticação de lojistas (Email/Senha) implementada com páginas de cadastro, login e funcionalidade de logout.

5. Planejamento para próximas versões
- Melhorar UX do cadastro de localização da loja (ex: usar um mapa interativo).
- Melhorar UX da solicitação de permissão de localização do usuário (ex: explicar o motivo, permitir salvar preferência).
- Desenvolver histórico de preços (UC5 - parte de salvar dados expirados).
- Criar página de monitoramento (UC13).
- Implementar catálogo de produtos canônicos e a funcionalidade de registro proativo (conforme nova proposta).
- Considerar fluxo para lojista editar informações da loja e produtos.
- Permitir que lojistas tenham múltiplas lojas (se necessário).

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
