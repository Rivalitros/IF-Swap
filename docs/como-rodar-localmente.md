# Como rodar o IF Swap localmente no Windows

O IF Swap roda no seu computador. O PostgreSQL guarda os dados, o Node.js executa a API e o Vite abre a aplicação no navegador. Ao final, você vai acessar a tela de login em `http://127.0.0.1:5173`.

## 1. Instale os programas

1. Instale o **Node.js LTS**, versão 22.12 ou superior, com npm. [Instalador oficial do Node.js](https://nodejs.org/en/download)
2. Instale o **PostgreSQL para Windows**. Inclua o servidor e, se quiser administrar o banco pela interface gráfica, o pgAdmin. Durante a instalação, defina a senha do usuário `postgres` e anote a porta escolhida. A porta padrão é `5432`. [Instalador oficial do PostgreSQL](https://www.postgresql.org/download/windows/)
3. Instale o **Git para Windows** se precisar baixar o projeto do GitHub. [Instalador oficial do Git](https://git-scm.com/install/windows)
4. Abra ou reabra o VS Code. Em **Terminal → Novo Terminal**, confira a instalação:

   ```powershell
   node --version
   npm.cmd --version
   git --version
   ```

Os comandos deste guia usam `npm.cmd`, que funciona no PowerShell mesmo quando a execução de scripts `.ps1` está bloqueada.

## 2. Abra a pasta do projeto

Se já tiver a pasta `IF-Swap`, abra-a em **Arquivo → Abrir Pasta** no VS Code. Para baixar o projeto pela primeira vez, abra o terminal na pasta onde quer salvá-lo e execute:

```powershell
git clone https://github.com/Rivalitros/IF-Swap.git
cd IF-Swap
```

Se o GitHub pedir login, use uma conta com acesso ao repositório. Execute os próximos comandos na pasta que contém `package.json` e `.env.example`:

```powershell
npm.cmd ci
```

## 3. Inicie e configure o PostgreSQL

1. Pressione **Win + R**, digite `services.msc` e pressione **Enter**. Procure o serviço **PostgreSQL**. Se estiver parado, clique com o botão direito e escolha **Iniciar**.
2. Crie `.env` a partir do modelo. Se o arquivo já existir, abra-o e ajuste os valores.

   ```powershell
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   ```

3. Abra `.env` no VS Code. Use a senha do usuário **PostgreSQL** que você definiu na instalação. Se você escolheu outra porta ou usa outro usuário do banco, ajuste `PGPORT` ou `PGUSER`.

   ```dotenv
   HOST=127.0.0.1
   PORT=3001
   WEB_HOST=127.0.0.1
   WEB_PORT=5173
   PGHOST=127.0.0.1
   PGPORT=5432
   PGDATABASE=if_swap
   PGUSER=postgres
   PGPASSWORD="SUBSTITUA_PELA_SENHA_DO_POSTGRESQL"
   ```

   Salve a senha real apenas no seu `.env` local. O Git ignora esse arquivo.

## 4. Prepare o banco

```powershell
npm.cmd run setup
```

Quando aparecer `Banco if_swap preparado.`, o banco e as tabelas estão disponíveis. Se o usuário do banco não tiver permissão de criação, peça para um administrador criar o banco indicado em `PGDATABASE` e atribuir a propriedade ao usuário indicado em `PGUSER`. Depois rode o setup novamente.

Para carregar contas e exemplos fictícios, use:

```powershell
npm.cmd run seed
```

## 5. Abra o IF Swap

```powershell
npm.cmd run dev
```

Deixe esse terminal aberto e visite [http://127.0.0.1:5173](http://127.0.0.1:5173). Se usou o seed, entre com `ana@demo.invalid` ou `bruno@demo.invalid`. Ambas as contas demonstrativas usam a senha `TrocaLocal123!`. Você também pode usar **Criar conta**.

Para confirmar que a API alcança o banco, abra [http://127.0.0.1:5173/api/health](http://127.0.0.1:5173/api/health). A resposta esperada é `{"status":"ok","database":"online"}`. Se você alterou `WEB_PORT`, use a porta configurada nos dois endereços.

## Nos próximos usos

Confira se o serviço PostgreSQL está iniciado, abra a pasta do projeto e execute `npm.cmd run dev`. Para encerrar a aplicação, pressione **Ctrl + C** no terminal onde ela está rodando. As contas e outros registros continuam no banco local.

## Teste em dois dispositivos

1. Use uma rede autorizada e contas fictícias. Confira no computador servidor os endereços de escuta da API e do PostgreSQL. A API deve usar `HOST=127.0.0.1`. O PostgreSQL deve escutar em loopback ou ter a porta do banco bloqueada para os outros dispositivos pelo firewall. `PGHOST` no `.env` só controla a conexão de saída da API.
2. Use `ipconfig` para identificar o IPv4 da interface da rede de teste. Coloque esse endereço em `WEB_HOST` no `.env` e reinicie `npm.cmd run dev`. Permita no firewall apenas `WEB_PORT` (5173 por padrão) para os clientes da rede de teste.
3. Abra `http://IP-DO-SERVIDOR:5173` nos dois dispositivos e confirme que `/api/health` responde com 200. Do segundo dispositivo, confirme que as portas diretas da API e do PostgreSQL (3001 e 5432 por padrão) não aceitam conexões. Em outro Windows, use `Test-NetConnection IP-DO-SERVIDOR -Port 5432` e repita com a porta da API. O resultado esperado é `TcpTestSucceeded : False` nas duas.
4. Entre como Ana em um dispositivo e Bruno no outro. Envie uma mensagem e confira o recebimento e a leitura. Desconecte o segundo dispositivo da rede, envie outra mensagem e confira o histórico quando ele voltar. Proponha um encontro na agenda, aceite no outro dispositivo e confira a confirmação nos dois calendários.
5. Registre o resultado em [testes](testes.md) e volte `WEB_HOST` para `127.0.0.1` ao terminar.

## Se algo der errado

| Mensagem ou situação | O que conferir |
|---|---|
| `node` ou `npm.cmd` não reconhecido | Reabra o VS Code após instalar o Node.js e repita o passo 1. |
| `ENOENT` ou erro ao encontrar `package.json` | Confira se o terminal está na pasta `IF-Swap`. |
| `ECONNREFUSED` ou banco indisponível | Inicie o serviço PostgreSQL e confira `PGHOST` e `PGPORT` no `.env`. |
| `password authentication failed` | Confira `PGUSER` e `PGPASSWORD` no `.env`. |
| Porta 3001 ou 5173 em uso | Encerre a execução anterior do projeto ou escolha outra porta livre em `PORT` (API) ou `WEB_PORT` (aplicação). Depois execute `npm.cmd run dev` novamente. |
