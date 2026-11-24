# Handoff

## Migrações e seed PostgreSQL

O schema e o seed ficam em `backend/database/`. A API usa o pool em `backend/src/db.js`.

Verificação: Dois setups e dois seeds com PostgreSQL local na porta 55432. Checkpoint da estrutura 8562101 enviado a origin/main.

Próximo passo: IF-03a · Alta · Implementar sessão, onboarding e habilidades sobre o schema inicial.

## Estrutura React, Express e npm workspaces

O frontend em `frontend/` usa o proxy Vite para a API em `backend/`. O arquivo `.env.example` documenta a configuração inicial.

Verificação: Instalação npm e build Vite concluídos. Checkpoint inicial 4d4bd79 enviado a origin/main.

Próximo passo: IF-02 · Alta · Implementar e validar schema e setup PostgreSQL.

O IF Swap é uma plataforma escolar de troca de habilidades para execução local. O objetivo da fase 1 inclui cadastro, perfis, matching, conversas em tempo real, agenda, reputação e mural.

Checkpoint inicial em `main`. A raiz contém o prompt mestre entregue localmente, porém falta o diretório `README/`; DER, modelo lógico, formulários e protótipos associados não puderam ser analisados. O remoto preexistente é `origin`. Consulte `git log -1 --oneline` e `git branch -vv` para verificar hashes e upstream.

Continue pelo roteiro em [NEXT_STEPS.md](NEXT_STEPS.md) e consulte as [decisões](DECISIONS.md) antes de alterar o modelo.
