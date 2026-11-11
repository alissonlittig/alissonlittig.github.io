# Raízes na Maré

Protótipo funcional (mobile-first) do produto informacional proposto no trabalho final de **Design da Informação (SIN248)**, UFPR, Gestão da Informação, Grupo 5.

> Protótipo acadêmico. **Não é um produto oficial** do Instituto Raiz Caiçara. Os textos das trilhas são exemplos e precisam ser validados por mestres da cultura caiçara.

## O que faz

- **Início:** maré de hoje (estimativa ilustrativa, não serve para navegar), atalhos para as trilhas e "continue de onde parou".
- **Trilhas:** Fandango, Canoa de voga, Pesca e Sabores. Cada uma tem 4 cards curtos e dá um selo no final.
- **Missões:** 6 selos de raiz. Selo Mutirão: compartilhar uma trilha. Selo Oficina: código dado numa oficina (para teste: `RAIZ2026`).
- **Participe:** formulário (nome, WhatsApp com máscara, oficina) com validação e confirmação. Também tem pré-visualização de foto ou áudio da "Manda tua história".
- Tudo fica **só no aparelho** (localStorage). Nada é enviado a servidor. Há botão para apagar os dados.
- Funciona sem internet depois da primeira visita (PWA) e pode ser adicionada à tela inicial.

## Acessibilidade medida

Contraste mínimo 4,5:1, fonte mínima 12 px, alvos de toque de 44 px ou mais, rótulos em todos os campos, texto alternativo no gráfico da maré, foco visível, respeita "reduzir movimento". Auditoria com axe-core (WCAG 2.2 AA): 0 violações nas telas testadas.

## Como rodar

Abra `index.html` por um servidor estático, por exemplo `python3 -m http.server` e acesse `http://localhost:8000`.
Para publicar no GitHub Pages: envie estes arquivos para um repositório e ative Pages (branch `main`, pasta raiz). Os caminhos são relativos.

Fonte: Inter (licença OFL), embutida.
