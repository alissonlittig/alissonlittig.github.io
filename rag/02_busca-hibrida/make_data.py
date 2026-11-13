"""Gera data/passages.json e data/questions.json (base fictícia de uma wiki de TI/RH). Rode uma vez; os JSONs são a fonte da verdade depois."""
import json, pathlib

P = [
    ("Backup dos servidores", "O backup completo dos servidores roda toda noite às 2h e fica guardado por 30 dias. Cópias semanais são mantidas por um ano em um local externo."),
    ("Restaurar um arquivo apagado", "Para recuperar um arquivo excluído por engano, abra um chamado informando o caminho e a data aproximada. A restauração a partir do backup leva até quatro horas úteis."),
    ("Acesso por VPN", "A VPN é obrigatória para acessar sistemas internos fora do escritório. Instale o cliente pelo portal de TI e entre com seu usuário e o código do aplicativo autenticador."),
    ("Problemas de conexão da VPN", "Se a VPN não conectar, confira se o horário do computador está correto e se a rede não bloqueia a porta 443. Persistindo o erro, reinstale o cliente e reinicie a máquina."),
    ("Política de senhas", "As senhas devem ter no mínimo 12 caracteres, misturando letras, números e símbolos. A troca é exigida a cada 180 dias e as últimas cinco senhas não podem ser reutilizadas."),
    ("Esqueci minha senha", "Para redefinir a senha, use o link Esqueci minha senha na tela de login. Um código chega ao seu celular cadastrado e vale por dez minutos."),
    ("Autenticação em dois fatores", "A autenticação em dois fatores é obrigatória em todos os sistemas corporativos. Cadastre o aplicativo autenticador no primeiro acesso e guarde os códigos de recuperação em local seguro."),
    ("Criar caixa de e-mail", "A caixa de e-mail de um novo colaborador é criada pelo RH no primeiro dia. O endereço segue o padrão nome ponto sobrenome arroba da empresa."),
    ("Limite de anexos no e-mail", "Cada mensagem aceita anexos de até 25 megabytes. Arquivos maiores devem ser enviados por link da nuvem corporativa, nunca por serviços pessoais de compartilhamento."),
    ("Impressoras e scanners", "As impressoras do segundo andar ficam em rede e são instaladas pelo portal de TI. Para digitalizar documentos, use o scanner multifuncional e escolha a pasta de destino no painel."),
    ("Pedir um notebook novo", "Notebooks são renovados a cada quatro anos. Para solicitar equipamento antes disso, o gestor abre um chamado com a justificativa e aguarda a aprovação do financeiro."),
    ("Notebook perdido ou roubado", "Em caso de perda ou roubo do notebook, avise o time de segurança imediatamente. O equipamento será bloqueado remotamente e os dados serão apagados à distância."),
    ("Licenças de software", "Programas pagos são instalados somente pela TI, que controla as licenças. Pedidos de novo software passam por análise de custo e segurança e levam até cinco dias úteis."),
    ("Wi-Fi do escritório", "A rede Wi-Fi corporativa usa autenticação individual, com o mesmo usuário e senha do e-mail. Visitantes se conectam na rede de convidados, que muda de senha toda segunda-feira."),
    ("Horário do suporte de TI", "O suporte de TI atende de segunda a sexta, das 8h às 18h, pelo portal de chamados ou pelo ramal 4000. Urgências fora do horário são tratadas pelo plantão."),
    ("Plantão de sobreaviso", "O plantão de sobreaviso cobre noites e fins de semana, com revezamento semanal entre os engenheiros. Quem está de plantão recebe adicional e deve responder alertas em até 15 minutos."),
    ("Prioridade dos chamados", "Chamados têm três níveis de prioridade. Críticos, com sistema parado, são atendidos em uma hora. Altos, em quatro horas. Normais, em até dois dias úteis."),
    ("Resposta a incidentes", "Ao detectar um incidente de segurança, isole a máquina da rede e avise o time de segurança. Não apague arquivos nem reinicie o equipamento, para preservar as evidências."),
    ("Phishing e e-mails suspeitos", "Mensagens que pedem senha ou pagamento urgente devem ser encaminhadas ao endereço de segurança e depois excluídas. Nunca clique em links de remetentes desconhecidos."),
    ("Processo de deploy", "Todo deploy em produção passa por revisão de código e testes automáticos. As publicações acontecem de terça a quinta, e nunca às sextas-feiras, para evitar problemas no fim de semana."),
    ("Reverter uma publicação", "Se uma publicação causar erro, execute o rollback pelo pipeline para voltar à versão anterior. Depois, registre o ocorrido no relatório de incidentes em até 24 horas."),
    ("Ambiente de homologação", "O ambiente de homologação é uma cópia da produção com dados fictícios. Toda funcionalidade nova deve ser validada lá pelo time de qualidade antes de ir ao ar."),
    ("Monitoramento e alertas", "Os painéis de monitoramento mostram uso de processador, memória e tempo de resposta. Alertas são enviados ao canal de plantão quando a latência passa de dois segundos."),
    ("Banco de dados e acessos", "O acesso direto ao banco de produção é restrito a administradores. Consultas de análise devem usar a réplica de leitura, que tem atraso de poucos segundos."),
    ("Migrações de banco", "Alterações na estrutura do banco são feitas por scripts versionados. Cada migração precisa de um plano de volta e deve rodar primeiro na homologação."),
    ("Solicitação de férias", "As férias são pedidas pelo portal do colaborador com no mínimo 30 dias de antecedência. O gestor aprova ou sugere nova data em até cinco dias úteis."),
    ("Registro de ponto", "O ponto é registrado pelo aplicativo no celular ou no computador. Esquecimentos devem ser justificados ao gestor até o último dia do mês."),
    ("Banco de horas", "Horas extras são compensadas em folgas dentro de seis meses. O saldo aparece no holerite e no portal, e o gestor precisa aprovar a compensação previamente."),
    ("Reembolso de despesas", "Despesas de viagem e alimentação são reembolsadas mediante comprovantes enviados pelo portal em até 15 dias. O pagamento sai junto com a folha seguinte."),
    ("Limite de diárias em viagens", "Em viagens a trabalho, a empresa cobre hospedagem de até R$ 350 por noite e alimentação de até R$ 120 por dia. Valores acima exigem aprovação prévia da diretoria."),
    ("Compras e fornecedores", "Compras acima de R$ 5.000 exigem três cotações e aprovação do financeiro. Só podem ser contratados fornecedores previamente cadastrados e com certidões em dia."),
    ("Emissão de nota fiscal", "Notas fiscais de serviço são emitidas pelo financeiro até o quinto dia útil do mês seguinte. Pedidos de segunda via são atendidos pelo portal em um dia útil."),
    ("Integração de novos colaboradores", "No primeiro dia, o novo colaborador recebe equipamento, acessos e um tutor. A integração dura duas semanas e inclui treinamentos de segurança e das ferramentas internas."),
    ("Plano de saúde", "O plano de saúde é oferecido após o período de experiência e inclui dependentes mediante mensalidade. A empresa arca com 70 por cento do valor do titular."),
    ("Treinamentos e cursos", "Cada colaborador tem um orçamento anual de R$ 2.000 para cursos e certificações ligados à função. O pedido é feito pelo portal com aprovação do gestor."),
    ("Canal de denúncias", "Condutas inadequadas podem ser relatadas de forma anônima pelo canal de ética, disponível no portal. Todas as denúncias são analisadas por um comitê independente."),
    ("Descarte de equipamentos", "Equipamentos antigos são entregues à TI, que apaga os dados com ferramenta certificada e envia o material para reciclagem. Nenhum equipamento deve ser descartado como lixo comum."),
]
# tipo: L = mesmas palavras do trecho; P = paráfrase/morfologia; H = vocabulário diferente (difícil)
Q = [
    ("quanto tempo os backups ficam guardados", [0], "L"), ("como recuperar arquivo excluído sem querer", [1], "P"), ("preciso de VPN para acessar sistemas de casa", [2], "L"),
    ("a VPN não conecta o que fazer", [3], "L"), ("quantos caracteres a senha precisa ter", [4], "L"), ("como redefinir senha esquecida", [5], "P"),
    ("tenho que usar autenticador no login", [6], "P"), ("tamanho máximo de anexo no e-mail", [8], "P"), ("como digitalizar um documento", [9], "P"),
    ("quando posso trocar de computador", [10], "H"), ("perdi o notebook e agora", [11], "P"), ("quem instala programas pagos", [12], "P"),
    ("qual rede wi-fi os visitantes usam", [13], "P"), ("até que horas o suporte funciona", [14], "P"), ("quem atende fora do expediente de madrugada", [15], "H"),
    ("em quanto tempo um chamado crítico é atendido", [16], "L"), ("recebi um e-mail suspeito pedindo senha", [18], "P"), ("pode publicar em produção na sexta", [19], "P"),
    ("como voltar para a versão anterior depois de um erro", [20], "H"), ("onde testar funcionalidade antes de lançar", [21], "H"), ("alerta quando o sistema fica lento", [22], "H"),
    ("posso consultar o banco de produção", [23], "P"), ("como pedir férias", [25], "L"), ("esqueci de bater o ponto", [26], "H"),
    ("como compensar horas extras", [27], "P"), ("limite de hospedagem em viagem a trabalho", [29], "P"), ("compra de cinco mil reais precisa de cotação", [30], "P"),
    ("quem emite nota fiscal e quando", [31], "L"), ("quanto a empresa paga do plano de saúde", [33], "L"), ("verba para cursos e certificações", [34], "H"),
    ("jogar computador velho no lixo", [36], "H"), ("denunciar assédio sem me identificar", [35], "H"), ("como funciona o primeiro dia de um funcionário novo", [32], "H"),
    ("reembolso de comprovantes de viagem", [28], "P"),
]
if __name__ == "__main__":
    d = pathlib.Path(__file__).parent / "data"
    (d / "passages.json").write_text(json.dumps([{"id": i, "title": t, "text": x} for i, (t, x) in enumerate(P)], ensure_ascii=False, indent=1), "utf-8")
    (d / "questions.json").write_text(json.dumps([{"q": q, "rel": r, "type": t} for q, r, t in Q], ensure_ascii=False, indent=1), "utf-8")
    print(len(P), "trechos,", len(Q), "perguntas")
