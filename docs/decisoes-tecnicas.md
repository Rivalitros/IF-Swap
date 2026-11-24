# Decisões técnicas

A [revisão acadêmica](revisao-academica.md) registra a comparação com os sete originais. O [modelo lógico](../README/mudanca_mod_logico.txt) e a [documentação do banco](banco-de-dados.md) descrevem o mapeamento.

O DER admite até duas avaliações por encontro e os formulários preveem feedback mútuo. A migração mantém uma avaliação por encontro e autor. O agendamento referencia o match conforme o DER e a API exigirá interesse mútuo, mesmo quando a sugestão unidirecional já tiver uma conversa. O campo Lida equivale à presença de `read_at`. A view de participantes sempre retorna dois usuários por par ordenado.

A execução é local e usa PostgreSQL, React/Vite, Express, Socket.IO, sessão persistida e scrypt. A proposta de administração e moderação está registrada na fase 4 do [roadmap](roadmap.md).
