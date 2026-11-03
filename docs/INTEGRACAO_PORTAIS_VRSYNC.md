# Documentação Técnica: Integração com Portais Imobiliários (ZAP Imóveis e Viva Real — Padrão VRSync)

Esta documentação detalha a arquitetura, configuração, operação e procedimentos de homologação da integração da plataforma **Elena Imóveis** com os portais imobiliários do **Grupo OLX** (**ZAP Imóveis** e **Viva Real**), utilizando o padrão oficial **VRSync (XML Feed)**.

---

## 1. Arquitetura da Integração

A integração segue o modelo **XML Feed Pull**, que é a especificação padrão do Grupo OLX:

```
[Elena Imóveis Database]
       │
       ▼
[vrsync.validator.js] ──> Avalia elegibilidade (Preço, Fotos, Bairro, Metragem)
       │
       ▼
[vrsync.mapper.js]    ──> Converte tipos internos para especificação VRSync
       │
       ▼
[vrsync.service.js]   ──> Gera o XML em UTF-8 com CDATA e nós estruturados
       │
       ▼
[Endpoint do Feed]    ──> GET /api/v1/integrations/vrsync.xml?token={FEED_TOKEN}
       ▲
       │  (Consumo periódico a cada poucas horas)
[Robôs / Crawlers do Grupo OLX] ──> Publicam anúncios no ZAP Imóveis e Viva Real
```

### Componentes Principais:
1. **Banco de Dados (PostgreSQL):**
   - `integrations`: Armazena os dados da integração, token de segurança, configurações e data do último sync.
   - `property_publications`: Controla individualmente o estado de publicação de cada imóvel no portal (`disponivel_no_feed`, `erro`, `desativado`, `publicado`).
   - `integration_logs`: Registra acessos ao feed, IPs dos crawlers e histórico de sincronizações.
2. **Serviços Backend:**
   - `backend/src/services/vrsync.mapper.js`: Mapeamento de tipos, categorias, transações e características.
   - `backend/src/services/vrsync.validator.js`: Validador de conformidade e regras do portal.
   - `backend/src/services/vrsync.service.js`: Construtor do XML oficial e rotina de sincronização.
3. **Painel Administrativo:**
   - Tela `http://localhost:3000/admin/integracoes`: Métricas em tempo real, cópia da URL do feed, ativação/pausa de imóveis e diagnóstico de erros.

---

## 2. Configuração e Variáveis de Ambiente

No arquivo `backend/.env`, certifique-se das seguintes variáveis:

```env
# URL do frontend para links dos imóveis gerados no XML
FRONTEND_URL=http://localhost:3000

# Porta da API do backend
PORT=3001
```

O token seguro do feed é gerado e gerenciado na tabela `integrations`. O valor inicial pré-configurado é:
`elena_vrsync_feed_token_secure_2026`

---

## 3. URLs do Feed XML

O feed está disponível através de duas URLs equivalentes:

1. **Rota padrão da API:**
   `http://SEU_DOMINIO:3001/api/v1/integrations/vrsync.xml?token=elena_vrsync_feed_token_secure_2026`

2. **Atalho direto (conforme convenção de integradores):**
   `http://SEU_DOMINIO:3001/integrations/vrsync.xml?token=elena_vrsync_feed_token_secure_2026`

> **Segurança:** O parâmetro `?token=...` é obrigatório. Requisições sem o token ou com token inválido recebem `HTTP 401 Unauthorized`.

---

## 4. Procedimento de Homologação e Cadastro no Grupo OLX

1. Acesse o canal do anunciante do Grupo OLX (ZAP / Viva Real) ou entre em contato com seu gerente de contas imobiliário / suporte de integrações:
   - Portal de Desenvolvedores: [https://developers.grupozap.com/](https://developers.grupozap.com/)
2. Solicite a ativação da **"Integração via Carga XML VRSync"**.
3. Forneça ao Grupo OLX:
   - **URL Completa do Feed XML** (copiada diretamente do painel em `/admin/integracoes`).
   - Nome do Software: **Elena Imóveis**.
   - Frequência recomendada de leitura: **A cada 2 ou 4 horas**.
4. O integrador executará a validação sintática do XML. Uma vez aprovado, a leitura automática será ativada nos portais ZAP Imóveis e Viva Real.

---

## 5. Estados de Publicação (Ciclo de Vida)

Para manter a integridade operacional e respeitar o processo do portal:

| Status | Significado | Visível no Feed? |
| :--- | :--- | :---: |
| **Disponível no Feed** 🟢 | Imóvel validado, ativo e incluído no XML para leitura do portal. | **SIM** |
| **Aguardando Validação** 🟡 | Imóvel novo cadastrado, aguardando rotina de checagem. | **NÃO** |
| **Erro de Validação** 🔴 | Imóvel possui pendências que impedem a aceitação no portal (ex: sem fotos, preço zerado, sem bairro). | **NÃO** |
| **Pausado / Desativado** ⚪ | Corretor ou administrador desmarcou manualmente a publicação deste imóvel no portal. | **NÃO** |
| **Publicado** 🔵 | Confirmação explícita de publicação recebida do portal (após processamento do crawler). | **SIM** |

---

## 6. Solução de Erros Comuns

### 1. Imóvel aparece com status "Erro de Validação"
* **Causa:** O imóvel não cumpre algum dos requisitos mínimos do VRSync.
* **Solução:** No painel em `/admin/integracoes`, clique no botão vermelho **"Erro de Validação 🔍"** para abrir o modal com as pendências exatas (ex: "O imóvel deve ter pelo menos 1 fotografia com URL pública válida"). Corrija o imóvel no painel e clique em **"Sincronizar e Revalidar Agora"**.

### 2. O portal acusa "XML Inválido" ou "Erro de Acesso"
* **Causa:** Token incorreto ou porta do backend não exposta publicamente.
* **Solução:** Teste abrindo a URL no navegador ou via curl:
  ```bash
  curl -i "http://localhost:3001/integrations/vrsync.xml?token=elena_vrsync_feed_token_secure_2026"
  ```
  O cabeçalho deve retornar `HTTP/1.1 200 OK` e `Content-Type: application/xml; charset=utf-8`.

### 3. Alterei o preço ou adicionei fotos, mas não refletiu no portal imediatamente
* **Causa:** O feed XML é atualizado em tempo real na Elena Imóveis, mas os robôs do Grupo OLX realizam a leitura em janelas periódicas (ex: a cada 2 a 4 horas).
* **Solução:** Você pode forçar a geração imediata no painel administrativo clicando em **"Sincronizar e Revalidar Agora"**. No portal, as alterações aparecerão no próximo ciclo de coleta do robô.

---

## 7. Como Executar a Bateria de Testes Automatizados

No terminal, dentro da pasta `backend`:
```bash
npm run test:vrsync
```
Este comando valida o mapeador de dados, as regras de negócio de validação e a integridade do XML gerado contra a base de dados.
