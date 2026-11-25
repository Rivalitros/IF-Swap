# IF Swap

O IF Swap é a plataforma de troca de habilidades do grupo 3 do Projeto Integrador do curso Técnico em Informática Integrado ao Ensino Médio do IFSP Campus Barretos. A comunidade escolar reúne pessoas que sabem ensinar e querem aprender, mas precisam de um espaço para descobrir interesses em comum e combinar encontros gratuitos.

O projeto atende estudantes, docentes e funcionários. Seus objetivos são facilitar a descoberta de habilidades, conectar perfis complementares, organizar encontros presenciais ou online, construir reputação por avaliação mútua e permitir pedidos de ajuda com prazo.

## O que você pode fazer

- Criar uma conta, configurar o perfil em três etapas e escolher até cinco habilidades que ensina e cinco que quer aprender.
- Buscar perfis compatíveis, identificar as duas direções da troca, consultar avaliações e iniciar uma conversa.
- Conversar em tempo real com histórico, presença, digitação e estados de entrega e leitura.
- Propor um encontro entre perfis com interesse mútuo, apresentar contraproposta e consultar os compromissos no calendário.
- Avaliar o par após o fim de um encontro concluído e consultar a reputação no perfil.
- Publicar desafios, responder, replicar respostas e acompanhar o prazo.

As telas de entrada, configuração e sugestões usam a referência Figma do grupo. A navegação fica na lateral em desktop e no rodapé em telas pequenas. Consulte o [guia do usuário](docs/guia-do-usuario.md).

## Arquitetura e diretórios

React com Vite e React Router renderiza as telas. O navegador usa Fetch e Socket.IO Client. O Vite encaminha chamadas ao Node.js com Express e Socket.IO, e somente o backend acessa o PostgreSQL por `pg`. O servidor guarda fotos na pasta local de uploads e usa sessões persistidas. O projeto utiliza JavaScript, CSS3, HTML5 e Plus Jakarta Sans fornecida por dependência local.

| Caminho | Conteúdo |
|---|---|
| `frontend/` | Aplicação React e configuração do Vite |
| `backend/src/` | API REST, Socket.IO, sessão, serviços e repositórios |
| `backend/database/` | Migrações SQL, setup e seed de demonstração |
| `backend/test/` | Testes unitários e de integração |
| `README/` | Referências acadêmicas locais e modelo lógico |
| `docs/` | [Arquitetura](docs/arquitetura.md), [API](docs/api.md), [banco](docs/banco-de-dados.md), [casos de uso](docs/casos-de-uso.md), [revisão](docs/revisao-academica.md) e continuidade em `docs/ai/` |
| `AGENTS.md` | Regras de manutenção, documentação e versionamento |

## Instalação no VS Code

Para a primeira instalação no Windows, siga o [passo a passo para rodar o IF Swap localmente](docs/como-rodar-localmente.md).

Se o IF Swap já roda em um computador e você quer acessá-lo de outro dispositivo, siga a seção [Acesso na rede local](#acesso-na-rede-local).

1. Instale uma versão LTS do Node.js a partir da 22.12, com npm. Reabra o terminal e confira com `node --version` e `npm --version`. [Download oficial do Node.js](https://nodejs.org/en/download)
2. Instale e inicie o serviço PostgreSQL no próprio computador. Tenha em mãos a porta, o usuário PostgreSQL e sua senha. No Windows, o instalador disponibiliza o servidor e o pgAdmin. [Instalação oficial do PostgreSQL no Windows](https://www.postgresql.org/download/windows/)
3. Abra a raiz do repositório no VS Code. Para continuar em outro computador, clone o repositório e abra a pasta clonada.

```powershell
git clone https://github.com/Rivalitros/IF-Swap.git
cd IF-Swap
npm.cmd ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Se já tiver o projeto, abra a pasta do repositório e comece em `npm.cmd ci`. Em Linux ou macOS, execute `npm` e, ao criar o arquivo pela primeira vez, use `cp .env.example .env`. No `.env`, mantenha `PGHOST=127.0.0.1`, ajuste `PGPORT`, `PGUSER` e `PGPASSWORD` para a instância local e escolha `PGDATABASE`, cujo padrão é `if_swap`. Guarde a senha apenas no `.env` local.

```powershell
npm.cmd run setup
npm.cmd run dev
```

Acesse **http://127.0.0.1:5173**. A API ouve em `127.0.0.1:3001` por padrão. Para rodar em terminais separados, use `npm run dev:api` e `npm run dev:web`. `npm run build` gera os arquivos estáticos em `frontend/dist/`; o fluxo documentado para usar a aplicação completa localmente é `npm run dev`.

O setup cria o banco se o usuário PostgreSQL tiver permissão. Quando não tiver, crie o banco informado em `PGDATABASE` pelo pgAdmin ou peça sua criação ao administrador, atribuindo a propriedade ao usuário configurado. Depois execute o setup novamente. O backend verifica a conexão na inicialização e aplica migrações pendentes em um banco já criado.

### Demonstração fictícia

```powershell
npm.cmd run seed
```

| Conta | Ensina | Quer aprender |
|---|---|---|
| `ana@demo.invalid` | Programação | Violão |
| `bruno@demo.invalid` | Violão | Programação |
| `clara@demo.invalid` | Matemática | Inglês |
| `diego@demo.invalid` | Inglês | Matemática |

A senha fictícia das quatro contas é `TrocaLocal123!`. Ana e Bruno já têm conversa, encontro concluído e avaliação de exemplo. Há também um desafio com resposta. O seed fica separado das migrações e pode ser repetido sem duplicar esses registros.

### Acesso na rede local

Escolha o **PC servidor** para rodar o IF Swap e o PostgreSQL. O outro PC ou celular precisa apenas de um navegador e acesso à mesma rede local autorizada. Use contas fictícias no teste em rede.

| Porta TCP padrão | Serviço | Acesso |
|---|---|---|
| `5173` | Vite, definido por `WEB_PORT` | Libere para os dispositivos da rede de teste. O Vite encaminha REST e Socket.IO pelo mesmo endereço. |
| `3001` | API Express, definida por `PORT` | Mantenha em `HOST=127.0.0.1`. |
| `5432` | PostgreSQL, acessado pela API via `PGPORT` | Restrinja à própria máquina. |

#### Configure o PC servidor

1. Execute `ipconfig` e localize o **Endereço IPv4** do adaptador **Wi-Fi** ou **Ethernet** conectado à rede de teste. Use esse endereço no lugar de `192.168.1.10` nos exemplos.
2. Edite as entradas existentes no `.env` da raiz do projeto, com uma linha por variável. Use a porta da sua instância PostgreSQL em `PGPORT`.

   ```dotenv
   WEB_HOST=192.168.1.10
   WEB_PORT=5173
   HOST=127.0.0.1
   PORT=3001
   PGHOST=127.0.0.1
   PGPORT=5432
   ```

3. Restrinja o PostgreSQL à própria máquina. `PGHOST` define para onde a API se conecta. Para conferir onde o servidor PostgreSQL escuta, execute `SHOW listen_addresses;` no pgAdmin. Se a instância for dedicada ao uso local, localize o arquivo com `SHOW config_file;`, defina `listen_addresses = 'localhost'` no `postgresql.conf` e reinicie o serviço PostgreSQL no Windows. Em uma instância compartilhada, peça ao administrador para restringir o acesso à porta do banco para os dispositivos da rede de teste. [Parâmetros de conexão do PostgreSQL](https://www.postgresql.org/docs/current/runtime-config-connection.html).
4. Se o banco estiver sendo preparado pela primeira vez, execute `npm.cmd run setup`. Depois, inicie ou reinicie `npm.cmd run dev` e mantenha o terminal aberto. No PC servidor, teste `http://192.168.1.10:5173/api/health`. A resposta esperada é `{"status":"ok","database":"online"}`.

#### Libere a porta no firewall ativo

No PC servidor, execute `netsh advfirewall show global categories` e confira qual produto aparece em `FirewallRuleCategory`. Configure a entrada TCP somente para a porta `WEB_PORT` e para os endereços dos clientes ou da sub-rede de teste.

**Firewall do Windows.** Abra o PowerShell como administrador. Execute `Get-NetConnectionProfile` para conferir o nome do adaptador e o perfil, e ajuste os valores do comando. O exemplo usa `Wi-Fi` no perfil `Private`, IPv4 `192.168.1.10` e sub-rede `192.168.1.0/24`, correspondente à máscara `255.255.255.0`. Se preferir liberar um único cliente, use o IPv4 dele em `-RemoteAddress`. [Referência do comando](https://learn.microsoft.com/pt-br/powershell/module/netsecurity/new-netfirewallrule).

```powershell
New-NetFirewallRule -Name 'IFSwap-LAN' -DisplayName 'IF Swap na LAN' `
  -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173 `
  -InterfaceAlias 'Wi-Fi' -Profile Private `
  -LocalAddress '192.168.1.10' -RemoteAddress '192.168.1.0/24'
```

**Avast Antivirus.** Abra **Proteção → Firewall → Configurações → Exibir regras do Firewall → Regras de rede → Mais → Adicionar nova regra**. Use **Permitir**, **Entrada** e **TCP**. Selecione o perfil usado nessa rede, informe `5173` em **Porta local** e o IPv4 do cliente ou o intervalo da rede em **Endereço**, como `192.168.1.1-192.168.1.254`. Deixe **Porta remota** em branco ou use `1-65535` se a interface exigir, pois o navegador escolhe a porta de origem. Ative a regra e verifique sua prioridade se houver uma regra de bloqueio aplicável. [Guia oficial do Avast](https://support.avast.com/pt-br/article/28/).

#### Teste no outro PC ou celular

1. Conecte o dispositivo à mesma rede e abra `http://192.168.1.10:5173` no navegador. Use o IPv4 do **servidor** e a porta `WEB_PORT`.
2. Abra `/api/health` no mesmo endereço para conferir a API e o banco. Em outro Windows, use os comandos abaixo. `TcpTestSucceeded` deve ser **True** na porta da aplicação e **False** nas duas portas internas. Ajuste os números se sua configuração usar portas diferentes.

   ```powershell
   Test-NetConnection 192.168.1.10 -Port 5173
   Test-NetConnection 192.168.1.10 -Port 3001
   Test-NetConnection 192.168.1.10 -Port 5432
   ```

3. Com as contas demonstrativas, entre como Ana em um dispositivo e Bruno no outro. Envie uma mensagem e confirme o recebimento. Para verificar também reconexão e agenda, siga o roteiro de dois dispositivos. [Roteiro de verificação](docs/como-rodar-localmente.md#teste-em-dois-dispositivos).

#### Resolva erros de acesso em rede

| Sintoma | O que verificar |
|---|---|
| `ERR_CONNECTION_TIMED_OUT` em todos os clientes | Teste primeiro `/api/health` no servidor pelo IPv4 da LAN. Confira se o IPv4 ainda é o mesmo, se o firewall ativo permite a porta e se a rede Wi-Fi permite comunicação entre os dispositivos. Redes de convidados podem isolar os clientes. |
| Abre no celular, mas um notebook falha | No notebook, execute `curl.exe --noproxy "*" --connect-timeout 5 http://192.168.1.10:5173/api/health`. Se funcionar, confira o uso de `http://` e as configurações do navegador ou proxy. Se der timeout, confira a interface escolhida por `Test-NetConnection`, o IP do notebook e os registros do firewall ativo. |
| `EADDRINUSE` ou porta em uso | Encerre a execução anterior ou ajuste `WEB_PORT` para uma porta livre, por exemplo `5174`. Atualize a regra do firewall e a URL. Se a colisão for na API, ajuste `PORT`, mantendo `HOST=127.0.0.1`. Reinicie `npm.cmd run dev`. |
| `EADDRNOTAVAIL` ou IPv4 mudou | Consulte novamente `ipconfig`, atualize `WEB_HOST`, a regra do firewall e a URL, e reinicie a aplicação. |
| `/api/health` retorna 503 | No servidor, confira se o PostgreSQL está iniciado e se `PGHOST`, `PGPORT`, `PGUSER` e `PGPASSWORD` correspondem à instância. Execute `npm.cmd run setup`. |

Ao terminar, pare o servidor com **Ctrl + C**, restaure `WEB_HOST=127.0.0.1` para o uso só no PC e desative a regra de teste no firewall ativo. No Firewall do Windows, use `Disable-NetFirewallRule -Name 'IFSwap-LAN'` no PowerShell como administrador. Para repetir o teste com os mesmos endereços, reative com `Enable-NetFirewallRule -Name 'IFSwap-LAN'`.

## Testes

```powershell
npm test
npm run test:integration
npm run build
```

Antes dos testes integrados, crie um banco local com nome terminado em `_test` e defina `TEST_DATABASE_URL` no `.env`. As instruções e os resultados ficam em [testes](docs/testes.md).

## Solução de problemas

- **Erro ao iniciar o banco.** Inicie o serviço PostgreSQL, revise as variáveis `PG*` e execute `npm run setup`. A API tenta usar novamente o PostgreSQL quando o serviço retorna.
- **Porta ocupada.** Ajuste `PORT` ou `WEB_PORT` no `.env` e reinicie `npm run dev`. O Vite lê a mesma porta da API.
- **Sem sugestões.** Complete as três etapas e adicione habilidades. Os perfis elegíveis vêm do banco. A demonstração oferece dois pares recíprocos.
- **Agenda rejeitada.** Verifique se os dois perfis ainda têm interesse mútuo, se o horário é futuro e se a janela está livre para ambos.
- **Ambiente em outro computador.** O clone reconstrói o schema e os dados fictícios com setup e seed. Para dados reais, use o procedimento privado de backup e restauração descrito na [documentação do banco](docs/banco-de-dados.md).

## Limites e continuidade

A recuperação de senha é demonstrativa. O cadastro permite declarar o vínculo escolar, e a autenticação institucional está fora da fase local. A operação entre dois dispositivos físicos depende da rede e do firewall. O painel administrativo, as notificações externas e a preparação para operação online são etapas futuras. Consulte o [roadmap](docs/roadmap.md) e o [handoff](docs/ai/HANDOFF.md).

Créditos ao grupo 3 do Projeto Integrador, responsáveis pelo projeto acadêmico e pelos protótipos. A identificação completa consta nos originais acadêmicos preservados em `README/`.
