# Mistério na Praça — Mystery in the Square

[English](README.md) · [Jogar em português](index.html#pt-BR) · [Play in English](index.html#en)

Um jogo investigativo procedural ambientado na Praça Coronel Pedro Osório, em Pelotas, Rio Grande do Sul, Brasil. Investigue um crime em uma praça que perde a iluminação progressivamente. Interrogue testemunhas, compare depoimentos, recolha pistas físicas e decida quem acusar antes do apagão completo.

O jogo utiliza uma interface inspirada em terminais de fósforo verde, mapa com emojis e controles táteis para celulares em orientação retrato. Cláudio, Christopher, Lu, Seu Bento, Fiscal, Dona Tereza, Guri do Mate e Leitor preservam suas identidades e o cenário original nas duas línguas.

Os diálogos em português brasileiro empregam intencionalmente gírias e expressões regionais de Pelotas e do sul do Brasil, como *bah*, *guri* e o uso coloquial de *tu*. A edição em inglês adapta os diálogos, preservando os personagens e a ambientação brasileira.

## Cenário e personagens ficcionalizados

Embora o jogo se passe na cidade real de Pelotas, no Brasil, e incorpore pontos de referência locais, elementos culturais e aspectos inspirados na vida cotidiana, seus personagens são ficcionalizados. Todos os crimes, investigações, motivos, acusações e desfechos são fictícios e não devem ser interpretados como afirmações sobre pessoas ou acontecimentos reais.

## Como jogar

Abra `index.html` em um navegador moderno ou sirva o repositório por HTTP. Escolha português ou inglês na tela inicial. Também é possível selecionar a língua com `#pt-BR` ou `#en` no endereço. O português é o padrão. Alterar o idioma durante uma partida inicia outra após confirmação.

- Escolha o modo Normal ou Avançado, ou um caso da biblioteca de mistérios.
- Use o joystick circular para andar; examine locais e converse com os personagens próximos.
- Use Christopher para investigar odores e consulte Lu sobre suas anotações.
- Administre tempo, energia e sanidade. Compare depoimentos e evidências físicas no diário ou faça uma acusação direta.
- As seis histórias originais e a geração determinística funcionam sem um serviço de IA.

## Inferência opcional com IA

O OpenRouter pode ser usado para diálogos livres, interação social, conversas entre NPCs, geração de casos e epílogos. Abra a configuração de IA, informe sua própria chave de API e escolha o modelo. O identificador padrão é `openrouter/free`; sua disponibilidade e seus limites dependem do provedor. A investigação convencional e as respostas locais funcionam sem chave.

A verdade do caso, o culpado, as pistas e os depoimentos canônicos são definidos pelo motor do jogo, não pelo modelo de linguagem. As propostas do modelo são verificadas antes de serem usadas. Filtros lexicais não garantem a ausência de insinuações enganosas.

As requisições vão diretamente do navegador ao OpenRouter. A chave fica no localStorage do navegador, não embutida no jogo. Use uma chave temporária e limitada; nunca publique credenciais. Quando a inferência estiver ativa, perguntas livres e contexto relevante do jogo, incluindo memória recente de conversas, são enviados ao provedor. Não informe dados pessoais ou confidenciais. O uso de modelos está sujeito aos termos e preços do provedor.

Casos gerados são armazenados localmente por idioma e podem ser exportados em backup. São criados na língua selecionada, sem tradução automática para a outra língua. Backups podem conter spoilers.

## Desenvolvimento

Node.js 20 ou superior, sem dependências npm. O HTML gerado pode ser jogado sem Node.js.

```sh
npm test
npm run build
python3 -m http.server 8000
```

Abra `http://localhost:8000/#pt-BR` ou `http://localhost:8000/#en`.

```text
src/
  engine.js          Mundo procedural, evidências e solvers
  game.js            Mecânicas, sistemas sociais e estratégicos
  ui.js              Interface, persistência e integração com IA
  localization.js    Carregamento e formatação de idiomas
  layout.html        Estrutura da interface
  style.css          Identidade visual
locales/
  en.json            Textos e regras linguísticas em inglês
  pt-BR.json         Textos e regras linguísticas em português
scripts/build.js     Gerador do HTML autocontido
tests/               Testes de regressão e localização
index.html           Versão jogável autocontida gerada
```

Use inglês nos identificadores, comentários e protocolos internos. Mantenha os textos destinados ao jogador e as regras específicas de idioma nos catálogos. Nomes próprios e IDs legados estáveis são preservados. Ao adicionar mensagens ou modificar parâmetros de interpolação, atualize ambos os catálogos. Não edite `index.html` diretamente: regenere-o e inclua-o no commit junto com o código-fonte.

Os testes verificam 120 snapshots originais do teste 15, equivalência entre idiomas dos mundos gerados e rotas verificadas, as seis histórias originais, exemplos de casos gerados, diálogos locais e validadores de respostas do modelo. São testes automatizados offline, não uma garantia de qualidade da inferência ou de funcionamento em todos os dispositivos. Consulte as [notas de desenvolvimento](docs/DEVELOPMENT.md).

## GitHub Pages

Inclua os arquivos do repositório, inclusive `index.html`, na branch `main`. No GitHub, abra **Settings → Pages → Build and deployment**, selecione **Deploy from a branch**, escolha `main` e `/(root)`. Após a publicação, acrescente `#pt-BR` ou `#en` à URL. O workflow de CI executa os testes e verifica a correspondência entre o HTML gerado e os fontes.

## Estado e licença

A versão 0.16.0 é uma base bilíngue de desenvolvimento derivada do protótipo teste 15, já avaliado por jogadores. As mecânicas e a geração procedural foram preservadas intencionalmente, em vez de redesenhadas. O projeto está licenciado sob a licença MIT; consulte o arquivo [LICENSE](LICENSE).
