# Problemas conhecidos

| Prioridade | Estado | Como reproduzir e comportamento | Arquivos e resolução |
|---|---|---|---|
| Média | Resolvido na rede testada | Acesso ao IF Swap em dois dispositivos físicos. | IF-10 concluída conforme validação do usuário. [Resultado](../testes.md#validação-da-rede-local). |
| Alta | Configuração por ambiente | A instância PostgreSQL na porta 5432 foi observada escutando em todas as interfaces IPv4 e IPv6. A verificação de acesso pelo outro dispositivo faz parte do roteiro validado da IF-10. | Confira o isolamento da porta ao configurar outro ambiente. [Acesso na rede local](../../README.md#acesso-na-rede-local). |
| Baixa | Limitação prevista | Abrir Esqueci minha senha. A tela informa que o ambiente demonstrativo não envia e-mail. | `frontend/src/pages/Auth.jsx`. Recuperação real prevista com revisão da infraestrutura. |
| Média | Limitação prevista | Abrir a aplicação com uma conta nova. O vínculo escolar é autodeclarado. | `backend/src/routes/accounts.js`. Validação institucional depende de autorização e política acadêmica. |
| Média | Resolvido | Um perfil com Programação e Violão não cruzava dados antigos do seed. Esperado era encontrar Bruno. | `backend/database/migrations/002_normalize_demo_skills.sql` e `seed.js`. Verificado com teste de migração e onboarding no Edge. |
| Média | Resolvido | Login dividido e onboarding numerado divergiam do PDF. | `frontend/src/pages/` e `styles.css`. Ajustados e comparados no desktop e mobile. |
