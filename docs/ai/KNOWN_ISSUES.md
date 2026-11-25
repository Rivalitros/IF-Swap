# Problemas conhecidos

| Prioridade | Estado | Como reproduzir e comportamento | Arquivos e resolução |
|---|---|---|---|
| Média | Em aberto | Usar em dois dispositivos físicos. A regressão verifica WebSocket e REST pelo proxy Vite no mesmo computador. | Executar IF-10 sob regras da rede. [Roteiro LAN](../como-rodar-localmente.md#teste-em-dois-dispositivos). |
| Alta | Ambiente local | A instância PostgreSQL na porta 5432 escutava em todas as interfaces IPv4 e IPv6 e exigiu senha. A configuração do firewall e o acesso externo ainda precisam ser verificados. | Configurar `PGPASSWORD` localmente para o setup. Conferir o isolamento da porta antes do teste em dois dispositivos. |
| Baixa | Limitação prevista | Abrir Esqueci minha senha. A tela informa que o ambiente demonstrativo não envia e-mail. | `frontend/src/pages/Auth.jsx`. Recuperação real prevista com revisão da infraestrutura. |
| Média | Limitação prevista | Abrir a aplicação com uma conta nova. O vínculo escolar é autodeclarado. | `backend/src/routes/accounts.js`. Validação institucional depende de autorização e política acadêmica. |
| Média | Resolvido | Um perfil com Programação e Violão não cruzava dados antigos do seed. Esperado era encontrar Bruno. | `backend/database/migrations/002_normalize_demo_skills.sql` e `seed.js`. Verificado com teste de migração e onboarding no Edge. |
| Média | Resolvido | Login dividido e onboarding numerado divergiam do PDF. | `frontend/src/pages/` e `styles.css`. Ajustados e comparados no desktop e mobile. |
