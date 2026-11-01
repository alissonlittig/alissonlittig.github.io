/* Configuração da loja online. É o ÚNICO arquivo que o Alisson edita para abrir a loja.
   Sem os dados da empresa preenchidos, o botão de pagar fica bloqueado (exigência do Decreto 7.962/2013). */
window.AE_CONFIG = {
  // Endereço do Worker (nuvem). Vazio = vitrine sem compra. Ex.: 'https://portao-alta-estima.SEU-USUARIO.workers.dev'
  api: '',
  // true = mostra a faixa "Modo de teste". Trocar para false só quando o Mercado Pago real estiver ligado.
  modoTeste: true,
  // true depois que contador/advogado revisarem Termos, Trocas, Entrega e Privacidade (some o aviso de rascunho).
  textosRevisados: false,
  // Loja que atende as entregas (igual a FILIAL_ENTREGA do Worker).
  filialEntrega: 'israel',
  // Dados da empresa. Valor vazio ou entre colchetes = pendente.
  empresa: {
    razao: 'ALTA ESTIMA COSMETICOS LTDA',  // razão social (Receita/BrasilAPI, 01/11/2026)
    cnpj: '35.866.008/0001-10',
    email: 'altaestimagv@hotmail.com',     // e-mail oficial de atendimento
    telefone: '(33) 3221-5888',            // fixo; o WhatsApp (33) 98813-7703 fica nos links de WhatsApp
    responsavel: '',    // quem responde o cliente em até 5 dias
    encarregado: '',    // encarregado de dados (LGPD)
    retencao: '',       // por quanto tempo guarda os dados do pedido
    prazoRetirada: ''   // por quantos dias a loja guarda o pedido pronto
  }
};
