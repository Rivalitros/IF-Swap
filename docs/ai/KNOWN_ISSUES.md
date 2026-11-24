# Problemas conhecidos

| Prioridade | Estado | Como reproduzir e comportamento | Arquivos e resolução |
|---|---|---|---|
| Média | Em aberto | Usar em dois dispositivos físicos. O esperado é WebSocket e REST pelo mesmo IP local. O teste executado usou dois contextos no mesmo computador. | `frontend/vite.config.js`, `backend/src/realtime.js`. Executar IF-10 sob regras da rede. |
| Baixa | Limitação prevista | Abrir Esqueci minha senha. A tela informa que o ambiente demonstrativo não envia e-mail. | `frontend/src/pages/Auth.jsx`. Recuperação real prevista com revisão da infraestrutura. |
| Média | Limitação prevista | Abrir a aplicação com uma conta nova. O vínculo escolar é autodeclarado. | `backend/src/routes/accounts.js`. Validação institucional depende de autorização e política acadêmica. |
| Média | Resolvido | Um perfil com Programação e Violão não cruzava dados antigos do seed. Esperado era encontrar Bruno. | `backend/database/migrations/002_normalize_demo_skills.sql` e `seed.js`. Verificado com teste de migração e onboarding no Edge. |
| Média | Resolvido | Login dividido e onboarding numerado divergiam do PDF. | `frontend/src/pages/` e `styles.css`. Ajustados e comparados no desktop e mobile. |
