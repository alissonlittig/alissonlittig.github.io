"""Gera 3 PDFs FICTÍCIOS em docs/ (reportlab) para a demo: empresa e regras inventadas. Títulos de seção em negrito, parágrafos em texto corrido, página nova a cada bloco grande."""
import pathlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer
OUT = pathlib.Path(__file__).parent / "docs"
DOCS = {
    "politica_reembolso.pdf": ("Política de Reembolso de Despesas (Alfa Serviços, documento fictício)", [
        [("1. Quem pode pedir", "Todo colaborador com contrato ativo pode pedir reembolso de despesas feitas a trabalho. Estagiários pedem pelo gestor da área. Despesas pessoais nunca são reembolsadas."),
         ("2. Prazo para pedir", "O pedido de reembolso deve ser feito em até 30 dias corridos após a data da despesa. Depois desse prazo o pedido é recusado, salvo aprovação por escrito da diretoria financeira.")],
        [("3. Limites por refeição", "Em viagem a trabalho, o limite é de R$ 80 para almoço e R$ 120 para jantar. Bebida alcoólica não é reembolsada em nenhuma hipótese. Valores acima do limite ficam por conta do colaborador."),
         ("4. Comprovantes", "Todo pedido precisa de nota fiscal ou recibo legível com CNPJ, data e valor. Foto de cupom amassado ou ilegível é devolvida para correção. O pagamento sai em até 10 dias úteis depois da aprovação.")]]),
    "manual_atendimento.pdf": ("Manual de Atendimento ao Cliente (Alfa Serviços, documento fictício)", [
        [("1. Horário de atendimento", "O atendimento por telefone e chat funciona de segunda a sexta, das 8h às 18h. Aos sábados o chat atende das 9h às 13h. Não há atendimento em domingos e feriados nacionais."),
         ("2. Prazo de resposta", "Todo chamado recebe a primeira resposta em até 4 horas úteis. Chamados marcados como urgentes, como sistema fora do ar, recebem resposta em até 1 hora.")],
        [("3. Cancelamento de contrato", "O cliente pode cancelar o contrato a qualquer momento, com aviso de 30 dias. Não há multa para contratos com mais de 12 meses. Em contratos mais novos a multa é de 20% das mensalidades restantes."),
         ("4. Escalonamento", "Quando o atendente não resolve em 2 dias úteis, o chamado sobe para o coordenador do turno. Reclamações sobre cobrança vão direto para o time financeiro.")]]),
    "guia_acesso_ti.pdf": ("Guia de Acesso e Segurança de TI (Alfa Serviços, documento fictício)", [
        [("1. Redefinir a senha", "Para redefinir a senha, abra o portal de acesso e use a opção esqueci minha senha. O link de redefinição vale por 15 minutos. A nova senha precisa ter pelo menos 12 caracteres, com letras e números."),
         ("2. Bloqueio de conta", "A conta é bloqueada depois de 5 tentativas erradas seguidas. O desbloqueio é automático após 30 minutos ou imediato se o suporte de TI confirmar a identidade.")],
        [("3. Acesso por VPN", "O acesso remoto à rede interna exige VPN e verificação em duas etapas pelo aplicativo autenticador. A VPN desconecta sozinha depois de 8 horas e precisa ser conectada de novo."),
         ("4. Equipamento perdido", "Notebook ou celular perdido deve ser comunicado ao suporte de TI no mesmo dia. O acesso do aparelho é revogado em até 1 hora depois do aviso.")]]),
}
if __name__ == "__main__":
    OUT.mkdir(exist_ok=True); ss = getSampleStyleSheet(); h = ParagraphStyle("h", parent=ss["Heading2"], fontName="Helvetica-Bold", fontSize=13, spaceBefore=10); b = ParagraphStyle("b", parent=ss["BodyText"], fontName="Helvetica", fontSize=11, leading=16)
    for name, (title, pages) in DOCS.items():
        st = [Paragraph(title, ss["Title"]), Spacer(1, 12)]
        for i, pg in enumerate(pages):
            if i: st.append(PageBreak())
            for hd, tx in pg: st += [Paragraph(hd, h), Paragraph(tx, b)]
        SimpleDocTemplate(str(OUT / name), pagesize=A4, title=title).build(st)
    print("ok", sorted(p.name for p in OUT.iterdir()))
