import { useState, memo, useCallback } from "react";

const STEPS = [
  { id: "identidade", label: "Identidade", icon: "🤖" },
  { id: "personalidade", label: "Personalidade", icon: "🎭" },
  { id: "regras", label: "Regras", icon: "📋" },
  { id: "conhecimento", label: "Conhecimento", icon: "📚" },
  { id: "fluxo", label: "Fluxo", icon: "🔄" },
  { id: "transferencia", label: "Transferência", icon: "🔀" },
  { id: "entrada", label: "Capacidades da IA", icon: "📥" },
  { id: "revisao", label: "Revisão", icon: "🔍" },
  { id: "concluido", label: "Concluído", icon: "✅" },
];

const SETORES_PADRAO = ["Comercial", "Pós-venda", "Vendas", "Suporte"];

const DEFAULT_PROIBICOES = [
  "Inventar informações que não estão na base de conhecimento",
  "Fornecer diagnósticos médicos, jurídicos ou financeiros",
  "Compartilhar dados sensíveis de outros clientes",
  "Usar linguagem ofensiva ou discriminatória",
  "Fazer promessas que a empresa não pode cumprir",
];

const DEFAULT_COMPORTAMENTOS = [
  "Ser empático e acolhedor em todas as interações",
  "Confirmar o entendimento antes de responder",
  "Oferecer alternativas quando não puder atender diretamente",
  "Manter o foco no objetivo da conversa",
];

/*
  ┌──────────────────────────────────────────────────────┐
  │  WEBHOOK — Cole aqui a URL do seu Webhook do N8N     │
  │  O N8N recebe os dados e envia pro Slack formatado   │
  └──────────────────────────────────────────────────────┘
*/
const N8N_WEBHOOK_URL = "https://n8n-matheus.riochat.com.br/webhook/prompt";

// ─── COLORS ───
const C = {
  bg: "#FFFFFF", card: "#F7F8FC", border: "#E2E5F1",
  accent: "#4F46E5", accentLt: "#EEF2FF", accentDk: "#4338CA",
  txt: "#1E1E2E", txtSec: "#64748B",
  inBg: "#FFF", inBor: "#D1D5E8",
  chipBg: "#EEF2FF", chipTxt: "#4F46E5",
  danger: "#EF4444", dangerLt: "#FEF2F2",
  success: "#10B981", successLt: "#ECFDF5",
};

const inputSx = {
  width: "100%", padding: "10px 14px", background: C.inBg,
  border: `1.5px solid ${C.inBor}`, borderRadius: 10, color: C.txt,
  fontSize: "0.88rem", outline: "none", boxSizing: "border-box",
  transition: "border-color .2s, box-shadow .2s",
};

const focusStyle = (e, on) => {
  e.target.style.borderColor = on ? C.accent : C.inBor;
  e.target.style.boxShadow = on ? `0 0 0 3px ${C.accentLt}` : "none";
};

// ─── REUSABLE COMPONENTS (defined outside to avoid re-creation) ───
const Label = memo(({ children, sub }) => (
  <label style={{ display: "block", marginBottom: 6 }}>
    <span style={{ color: C.txt, fontWeight: 600, fontSize: "0.88rem" }}>{children}</span>
    {sub && <span style={{ color: C.txtSec, fontSize: "0.78rem", display: "block", marginTop: 2 }}>{sub}</span>}
  </label>
));

const Input = memo(({ value, onChange, placeholder, ...props }) => (
  <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    style={inputSx} onFocus={(e) => focusStyle(e, true)} onBlur={(e) => focusStyle(e, false)} {...props} />
));

const TextArea = memo(({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ ...inputSx, resize: "vertical", fontFamily: "inherit" }}
    onFocus={(e) => focusStyle(e, true)} onBlur={(e) => focusStyle(e, false)} />
));

const Select = memo(({ value, onChange, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} style={inputSx}>
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
));

const Chip = memo(({ children, onRemove }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: C.chipBg, borderRadius: 20, fontSize: "0.82rem", color: C.chipTxt, margin: 3, fontWeight: 500 }}>
    {children}
    {onRemove && <button onClick={onRemove} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", padding: 0, lineHeight: 1 }}>×</button>}
  </span>
));

const AddRow = memo(({ value, onChange, onAdd, placeholder }) => (
  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
    <Input value={value} onChange={onChange} placeholder={placeholder} onKeyDown={(e) => e.key === "Enter" && onAdd()} />
    <button onClick={onAdd} style={{ padding: "10px 18px", background: C.accent, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", fontSize: "0.85rem" }}>+ Adicionar</button>
  </div>
));

const Card = memo(({ title, children }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, marginBottom: 20 }}>
    {title && <h3 style={{ color: C.accent, fontSize: "0.95rem", fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`, marginTop: 0 }}>{title}</h3>}
    {children}
  </div>
));

const FG = ({ children }) => <div style={{ marginBottom: 16 }}>{children}</div>;

const ReviewRow = memo(({ label, value, empty }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
    <span style={{ color: C.txtSec, fontSize: "0.84rem", fontWeight: 500, minWidth: 160 }}>{label}</span>
    <span style={{ color: empty ? C.danger : C.txt, fontSize: "0.84rem", textAlign: "right", flex: 1, marginLeft: 16 }}>
      {empty ? "⚠️ Não preenchido" : value}
    </span>
  </div>
));

export default function PromptGenerator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // IDENTIDADE
  const [nomeCliente, setNomeCliente] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [nomeIA, setNomeIA] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [funcaoIA, setFuncaoIA] = useState("");
  const [tomVoz, setTomVoz] = useState("profissional");
  const [idioma, setIdioma] = useState("Português Brasileiro");
  const [descricaoEmpresa, setDescricaoEmpresa] = useState("");

  // PERSONALIDADE
  const [estiloResposta, setEstiloResposta] = useState("consultivo");
  const [nivelFormalidade, setNivelFormalidade] = useState("semi-formal");
  const [usaEmojis, setUsaEmojis] = useState("moderado");
  const [cumprimentoInicial, setCumprimentoInicial] = useState("");
  const [mensagemEncerramento, setMensagemEncerramento] = useState("");

  // REGRAS
  const [proibicoes, setProibicoes] = useState([...DEFAULT_PROIBICOES]);
  const [novaProibicao, setNovaProibicao] = useState("");
  const [comportamentos, setComportamentos] = useState([...DEFAULT_COMPORTAMENTOS]);
  const [novoComportamento, setNovoComportamento] = useState("");

  // CONHECIMENTO
  const [glossario, setGlossario] = useState([{ termo: "", definicao: "" }]);
  const [baseConhecimento, setBaseConhecimento] = useState("");
  const [temPDF, setTemPDF] = useState(false);
  const [instrucoesPDF, setInstrucoesPDF] = useState("");
  const [faq, setFaq] = useState([{ pergunta: "", resposta: "" }]);

  // FLUXO
  const [etapasFluxo, setEtapasFluxo] = useState([
    { nome: "Saudação e Identificação", descricao: "Cumprimentar o cliente e coletar nome" },
    { nome: "Entender a Necessidade", descricao: "Descobrir o que o cliente precisa" },
    { nome: "Fornecer Solução", descricao: "Responder com base no conhecimento disponível" },
    { nome: "Confirmar Satisfação", descricao: "Verificar se a dúvida foi resolvida" },
    { nome: "Encerramento ou Transferência", descricao: "Finalizar ou transferir para humano" },
  ]);

  // TRANSFERENCIA
  const [habilitaTransferencia, setHabilitaTransferencia] = useState(true);
  const [setoresEscolhidos, setSetoresEscolhidos] = useState([]);
  const [setoresCustom, setSetoresCustom] = useState([]);
  const [novoSetor, setNovoSetor] = useState("");
  const [infosTransferencia, setInfosTransferencia] = useState([
    "Nome do cliente", "Resumo da conversa", "Necessidade identificada",
  ]);
  const [novaInfo, setNovaInfo] = useState("");
  const [mensagemTransferencia, setMensagemTransferencia] = useState("");

  // CAPACIDADES DE ENTRADA
  const [entradas, setEntradas] = useState([]);
  const [instrucaoAudio, setInstrucaoAudio] = useState("");
  const [instrucaoImagem, setInstrucaoImagem] = useState("");
  const [instrucaoDocumento, setInstrucaoDocumento] = useState("");

  // ─── HELPERS ───
  const toggleEntrada = (f) => setEntradas((p) => p.includes(f) ? p.filter((x) => x !== f) : [...p, f]);
  const toggleSetor = (s) => setSetoresEscolhidos((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const addSetorCustom = () => {
    const s = novoSetor.trim();
    if (s && !setoresCustom.includes(s) && !SETORES_PADRAO.includes(s)) {
      setSetoresCustom([...setoresCustom, s]);
      setSetoresEscolhidos([...setoresEscolhidos, s]);
      setNovoSetor("");
    }
  };
  const removeSetorCustom = (s) => {
    setSetoresCustom(setoresCustom.filter((x) => x !== s));
    setSetoresEscolhidos(setoresEscolhidos.filter((x) => x !== s));
  };
  const addItem = (list, setList, value, setValue) => {
    if (value.trim()) { setList([...list, value.trim()]); setValue(""); }
  };

  // ─── GENERATE PROMPT (internal only — never shown to client) ───
  const gerarPrompt = () => {
    let p = `<identidade>
  <nome_ia>${nomeIA || "Assistente Virtual"}</nome_ia>
  <empresa>${nomeEmpresa || "Nome da Empresa"}</empresa>
  <descricao_empresa>${descricaoEmpresa || "Descrição da empresa"}</descricao_empresa>
  <funcao>${funcaoIA || "Assistente de atendimento ao cliente"}</funcao>
  <tom_de_voz>${tomVoz}</tom_de_voz>
  <idioma>${idioma}</idioma>
</identidade>

<personalidade>
  <estilo_resposta>${estiloResposta}</estilo_resposta>
  <nivel_formalidade>${nivelFormalidade}</nivel_formalidade>
  <uso_emojis>${usaEmojis}</uso_emojis>
  <cumprimento_inicial>${cumprimentoInicial || `Olá! Eu sou ${nomeIA || "o assistente virtual"} da ${nomeEmpresa || "empresa"}. Como posso ajudar você hoje?`}</cumprimento_inicial>
  <mensagem_encerramento>${mensagemEncerramento || "Foi um prazer atender você! Se precisar de algo mais, estou por aqui. 😊"}</mensagem_encerramento>
</personalidade>

<regras>
  <proibicoes_absolutas>
${proibicoes.map((x) => `    <proibicao>${x}</proibicao>`).join("\n")}
  </proibicoes_absolutas>

  <comportamento_correto>
${comportamentos.map((x) => `    <comportamento>${x}</comportamento>`).join("\n")}
  </comportamento_correto>

  <deteccao_primeira_interacao>
    <instrucao>Na primeira mensagem do usuário, sempre cumprimente e se apresente. Identifique se o cliente é novo ou recorrente pelo contexto da conversa.</instrucao>
  </deteccao_primeira_interacao>

  <correcao_ortografica>
    <instrucao>Interprete mensagens com erros ortográficos, gírias e abreviações comuns. Nunca corrija o cliente diretamente. Responda sempre com ortografia correta.</instrucao>
  </correcao_ortografica>
</regras>

`;

    const gv = glossario.filter((g) => g.termo && g.definicao);
    if (gv.length > 0) {
      p += `<glossario_transferencia>\n${gv.map((g) => `  <termo>\n    <palavra>${g.termo}</palavra>\n    <significado>${g.definicao}</significado>\n  </termo>`).join("\n")}\n</glossario_transferencia>\n\n`;
    }

    p += `<dados>
  <base_de_conhecimento>
${baseConhecimento || "    [Insira aqui as informações, produtos, serviços e dados da empresa]"}
  </base_de_conhecimento>${temPDF ? `\n  <documentos_anexados>\n    <instrucao>${instrucoesPDF || "Utilize as informações dos documentos PDF anexados como parte da base de conhecimento."}</instrucao>\n  </documentos_anexados>` : ""}
</dados>

`;

    const fv = faq.filter((f) => f.pergunta && f.resposta);
    if (fv.length > 0) {
      p += `<faq>\n${fv.map((f) => `  <item>\n    <pergunta>${f.pergunta}</pergunta>\n    <resposta>${f.resposta}</resposta>\n  </item>`).join("\n")}\n</faq>\n\n`;
    }

    p += `<fluxo_de_atendimento>\n${etapasFluxo.filter((e) => e.nome).map((e, i) => `  <etapa ordem="${i + 1}">\n    <nome>${e.nome}</nome>\n    <descricao>${e.descricao}</descricao>\n  </etapa>`).join("\n")}\n</fluxo_de_atendimento>\n\n`;

    p += `<formato_de_saida>
  <formato>texto</formato>
  <instrucao>Responda sempre em formato de texto. Seja claro, objetivo e organizado. Use parágrafos curtos quando apropriado.</instrucao>
</formato_de_saida>

`;

    if (entradas.length > 0) {
      p += `<capacidades_de_entrada>
  <tipos_aceitos>${entradas.join(", ")}</tipos_aceitos>
${entradas.includes("audio") ? `  <transcricao_audio>\n    <instrucao>${instrucaoAudio || "Quando o cliente enviar um áudio, transcreva e interprete o conteúdo para responder adequadamente."}</instrucao>\n  </transcricao_audio>\n` : ""}${entradas.includes("imagem") ? `  <interpretacao_imagem>\n    <instrucao>${instrucaoImagem || "Quando o cliente enviar uma imagem, analise e interprete o conteúdo visual para auxiliar no atendimento."}</instrucao>\n  </interpretacao_imagem>\n` : ""}${entradas.includes("documento") ? `  <leitura_documento>\n    <instrucao>${instrucaoDocumento || "Quando o cliente enviar um documento (PDF, DOC, etc.), leia e interprete o conteúdo para responder adequadamente."}</instrucao>\n  </leitura_documento>\n` : ""}</capacidades_de_entrada>

`;
    }

    if (habilitaTransferencia && setoresEscolhidos.length > 0) {
      p += `<sistema_transferencia>\n`;
      setoresEscolhidos.forEach((setor) => {
        p += `  <etapa>
    <acao_sistema>
      <instrucao_transferencia>
        Quando o cliente confirmar que deseja falar com o setor ${setor}, você deve:

        1. Enviar a mensagem de transferência:
        "${mensagemTransferencia || `Entendi! Vou transferir você para o nosso time de ${setor}. Um momento, por favor.`}"

        2. TRANSFERIR AS SEGUINTES INFORMAÇÕES para o setor ${setor}:

${infosTransferencia.map((info) => `        - ${info}`).join("\n")}

      </instrucao_transferencia>

      <destino>Execute a Tool "transferência" e use o ID [ID_${setor.toUpperCase().replace(/[^A-Z0-9]/g, "_")}]</destino>
      <contexto>Incluir todo o histórico da conversa junto com o resumo estruturado acima</contexto>
    </acao_sistema>
  </etapa>\n`;
      });
      p += `</sistema_transferencia>`;
    }
    return p;
  };

  // ─── SUBMIT ───
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const prompt = gerarPrompt();
    const payload = {
      cliente: {
        nome: nomeCliente,
        email: emailCliente,
        telefone: telefoneCliente,
      },
      empresa: nomeEmpresa,
      nomeIA,
      descricaoEmpresa,
      funcaoIA,
      tomVoz,
      idioma,
      setoresTransferencia: setoresEscolhidos,
      entradasHabilitadas: entradas,
      promptXML: prompt,
      dataGeracao: new Date().toISOString(),
    };

    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Webhook error:", err);
    }

    setIsSubmitting(false);
    setSubmitted(true);
    setCurrentStep(STEPS.length - 1);
  };

  // ─── STEP RENDERS ───
  const renderIdentidade = () => (
    <>
      <Card title="Seus Dados">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FG><Label>Seu Nome</Label><Input value={nomeCliente} onChange={setNomeCliente} placeholder="Seu nome completo" /></FG>
          <FG><Label>Seu E-mail</Label><Input value={emailCliente} onChange={setEmailCliente} placeholder="email@empresa.com" type="email" /></FG>
        </div>
        <FG><Label sub="Número com DDD para contato">Telefone / WhatsApp</Label>
          <Input value={telefoneCliente} onChange={setTelefoneCliente} placeholder="(11) 99999-9999" /></FG>
      </Card>
      <Card title="Dados da IA">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FG><Label>Nome da IA</Label><Input value={nomeIA} onChange={setNomeIA} placeholder="Ex: Luna, Max, Aria..." /></FG>
          <FG><Label>Nome da Empresa</Label><Input value={nomeEmpresa} onChange={setNomeEmpresa} placeholder="Ex: TechCorp Brasil" /></FG>
        </div>
        <FG><Label sub="Descreva brevemente o que a empresa faz">Descrição da Empresa</Label>
          <TextArea value={descricaoEmpresa} onChange={setDescricaoEmpresa} placeholder="Ex: Empresa de tecnologia especializada em soluções SaaS..." rows={2} /></FG>
        <FG><Label sub="Qual será a principal função dessa IA?">Função da IA</Label>
          <TextArea value={funcaoIA} onChange={setFuncaoIA} placeholder="Ex: Atendimento ao cliente, qualificação de leads..." rows={2} /></FG>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FG><Label>Tom de Voz</Label><Select value={tomVoz} onChange={setTomVoz} options={[
            { value: "profissional", label: "Profissional" }, { value: "amigavel", label: "Amigável" },
            { value: "tecnico", label: "Técnico" }, { value: "casual", label: "Casual" },
            { value: "formal", label: "Formal" }, { value: "empatico", label: "Empático" },
          ]} /></FG>
          <FG><Label>Idioma</Label><Select value={idioma} onChange={setIdioma} options={[
            { value: "Português Brasileiro", label: "Português (BR)" }, { value: "Inglês", label: "Inglês" },
            { value: "Espanhol", label: "Espanhol" }, { value: "Português e Inglês", label: "PT + EN" },
          ]} /></FG>
        </div>
      </Card>
    </>
  );

  const renderPersonalidade = () => (
    <>
      <Card title="Estilo de Comunicação">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <FG><Label>Estilo de Resposta</Label><Select value={estiloResposta} onChange={setEstiloResposta} options={[
            { value: "consultivo", label: "Consultivo" }, { value: "direto", label: "Direto ao ponto" },
            { value: "explicativo", label: "Explicativo/Didático" }, { value: "vendedor", label: "Vendedor" },
          ]} /></FG>
          <FG><Label>Formalidade</Label><Select value={nivelFormalidade} onChange={setNivelFormalidade} options={[
            { value: "formal", label: "Formal" }, { value: "semi-formal", label: "Semi-formal" }, { value: "informal", label: "Informal" },
          ]} /></FG>
          <FG><Label>Uso de Emojis</Label><Select value={usaEmojis} onChange={setUsaEmojis} options={[
            { value: "nenhum", label: "Nenhum" }, { value: "moderado", label: "Moderado" }, { value: "frequente", label: "Frequente" },
          ]} /></FG>
        </div>
      </Card>
      <Card title="Mensagens Padrão">
        <FG><Label sub="Como a IA deve cumprimentar na primeira interação">Cumprimento Inicial</Label>
          <TextArea value={cumprimentoInicial} onChange={setCumprimentoInicial} placeholder={`Ex: Olá! Eu sou ${nomeIA || "o assistente"} da ${nomeEmpresa || "empresa"}. Como posso ajudar?`} rows={2} /></FG>
        <FG><Label sub="Mensagem ao finalizar o atendimento">Mensagem de Encerramento</Label>
          <TextArea value={mensagemEncerramento} onChange={setMensagemEncerramento} placeholder="Ex: Foi um prazer atender você! Se precisar, estou por aqui. 😊" rows={2} /></FG>
      </Card>
    </>
  );

  const renderRegras = () => (
    <>
      <Card title="🚫 Proibições Absolutas">
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
          {proibicoes.map((p, i) => <Chip key={i} onRemove={() => setProibicoes(proibicoes.filter((_, j) => j !== i))}>{p}</Chip>)}
        </div>
        <AddRow value={novaProibicao} onChange={setNovaProibicao} onAdd={() => addItem(proibicoes, setProibicoes, novaProibicao, setNovaProibicao)} placeholder="Adicione uma proibição..." />
      </Card>
      <Card title="✅ Comportamentos Corretos">
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
          {comportamentos.map((c, i) => <Chip key={i} onRemove={() => setComportamentos(comportamentos.filter((_, j) => j !== i))}>{c}</Chip>)}
        </div>
        <AddRow value={novoComportamento} onChange={setNovoComportamento} onAdd={() => addItem(comportamentos, setComportamentos, novoComportamento, setNovoComportamento)} placeholder="Adicione um comportamento..." />
      </Card>
    </>
  );

  const renderConhecimento = () => (
    <>
      <Card title="Base de Conhecimento">
        <FG><Label sub="Cole aqui informações sobre produtos, serviços, preços, políticas">Conteúdo Principal</Label>
          <TextArea value={baseConhecimento} onChange={setBaseConhecimento} placeholder="Cole aqui as informações da empresa..." rows={6} /></FG>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={() => setTemPDF(!temPDF)} style={{
            padding: "8px 16px", background: temPDF ? C.accentLt : C.card,
            border: `1.5px solid ${temPDF ? C.accent : C.inBor}`, borderRadius: 10,
            color: temPDF ? C.accent : C.txtSec, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
          }}>📎 {temPDF ? "PDF Habilitado" : "Habilitar Anexo de PDF"}</button>
        </div>
        {temPDF && <FG><Label sub="Instruções para uso do PDF">Instruções para PDF</Label>
          <TextArea value={instrucoesPDF} onChange={setInstrucoesPDF} placeholder="Ex: Utilize o catálogo em PDF para responder sobre preços." rows={2} /></FG>}
      </Card>
      <Card title="Glossário de Termos">
        {glossario.map((g, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8, marginBottom: 8 }}>
            <Input value={g.termo} onChange={(v) => { const n = [...glossario]; n[i].termo = v; setGlossario(n); }} placeholder="Termo" />
            <Input value={g.definicao} onChange={(v) => { const n = [...glossario]; n[i].definicao = v; setGlossario(n); }} placeholder="Definição" />
            <button onClick={() => setGlossario(glossario.filter((_, j) => j !== i))} style={{ background: C.dangerLt, border: "none", borderRadius: 10, color: C.danger, cursor: "pointer", padding: "8px 12px", fontWeight: 600 }}>✕</button>
          </div>
        ))}
        <button onClick={() => setGlossario([...glossario, { termo: "", definicao: "" }])} style={{ padding: "8px 16px", background: "transparent", border: `1.5px dashed ${C.accent}`, borderRadius: 10, color: C.accent, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>+ Adicionar Termo</button>
      </Card>
      <Card title="FAQ — Perguntas Frequentes">
        {faq.map((f, i) => (
          <div key={i} style={{ marginBottom: 12, padding: 14, background: "#fff", borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: C.accent, fontWeight: 600, fontSize: "0.82rem" }}>FAQ #{i + 1}</span>
              <button onClick={() => setFaq(faq.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer" }}>✕</button>
            </div>
            <FG><Input value={f.pergunta} onChange={(v) => { const n = [...faq]; n[i].pergunta = v; setFaq(n); }} placeholder="Pergunta do cliente" /></FG>
            <TextArea value={f.resposta} onChange={(v) => { const n = [...faq]; n[i].resposta = v; setFaq(n); }} placeholder="Resposta da IA" rows={2} />
          </div>
        ))}
        <button onClick={() => setFaq([...faq, { pergunta: "", resposta: "" }])} style={{ padding: "8px 16px", background: "transparent", border: `1.5px dashed ${C.accent}`, borderRadius: 10, color: C.accent, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>+ Adicionar FAQ</button>
      </Card>
    </>
  );

  const renderFluxo = () => (
    <Card title="Etapas do Fluxo de Atendimento">
      <p style={{ color: C.txtSec, fontSize: "0.8rem", marginBottom: 16 }}>Defina a sequência de etapas que a IA deve seguir</p>
      {etapasFluxo.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12, padding: 14, background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.accent}` }}>
          <div style={{ minWidth: 34, height: 34, borderRadius: "50%", background: C.accentLt, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0, marginTop: 4 }}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <FG><Input value={e.nome} onChange={(v) => { const n = [...etapasFluxo]; n[i].nome = v; setEtapasFluxo(n); }} placeholder="Nome da etapa" /></FG>
            <TextArea value={e.descricao} onChange={(v) => { const n = [...etapasFluxo]; n[i].descricao = v; setEtapasFluxo(n); }} placeholder="O que a IA deve fazer nesta etapa..." rows={2} />
          </div>
          <button onClick={() => setEtapasFluxo(etapasFluxo.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: "1.1rem", padding: 4, marginTop: 4 }}>✕</button>
        </div>
      ))}
      <button onClick={() => setEtapasFluxo([...etapasFluxo, { nome: "", descricao: "" }])} style={{ padding: "12px 20px", background: "transparent", border: `1.5px dashed ${C.accent}`, borderRadius: 10, color: C.accent, cursor: "pointer", fontSize: "0.85rem", width: "100%", fontWeight: 600 }}>+ Adicionar Etapa</button>
    </Card>
  );

  const renderTransferencia = () => (
    <Card title="Sistema de Transferência para Atendente Humano">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => setHabilitaTransferencia(!habilitaTransferencia)} style={{
          padding: "8px 20px", background: habilitaTransferencia ? C.successLt : C.card,
          border: `1.5px solid ${habilitaTransferencia ? C.success : C.inBor}`, borderRadius: 10,
          color: habilitaTransferencia ? C.success : C.txtSec, cursor: "pointer", fontWeight: 700, fontSize: "0.88rem",
        }}>{habilitaTransferencia ? "✓ Habilitado" : "Desabilitado"}</button>
      </div>
      {habilitaTransferencia && (
        <>
          <div style={{ marginBottom: 20 }}>
            <Label sub="Selecione os setores para os quais a IA pode transferir">Setores de Transferência</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
              {SETORES_PADRAO.map((s) => (
                <button key={s} onClick={() => toggleSetor(s)} style={{
                  padding: "10px 20px", background: setoresEscolhidos.includes(s) ? C.accent : "#fff",
                  border: `1.5px solid ${setoresEscolhidos.includes(s) ? C.accent : C.inBor}`, borderRadius: 10,
                  color: setoresEscolhidos.includes(s) ? "#fff" : C.txt, cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", transition: "all .2s",
                }}>{s}</button>
              ))}
            </div>
            {setoresCustom.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                {setoresCustom.map((s) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    <button onClick={() => toggleSetor(s)} style={{
                      padding: "10px 20px", background: setoresEscolhidos.includes(s) ? C.accent : "#fff",
                      border: `1.5px solid ${setoresEscolhidos.includes(s) ? C.accent : C.inBor}`, borderRadius: "10px 0 0 10px",
                      color: setoresEscolhidos.includes(s) ? "#fff" : C.txt, cursor: "pointer", fontWeight: 600, fontSize: "0.88rem",
                    }}>{s}</button>
                    <button onClick={() => removeSetorCustom(s)} style={{
                      padding: "10px 12px", background: C.dangerLt, border: `1.5px solid ${C.danger}33`,
                      borderRadius: "0 10px 10px 0", color: C.danger, cursor: "pointer", fontWeight: 700, fontSize: "0.88rem",
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <Input value={novoSetor} onChange={setNovoSetor} placeholder="Adicionar setor personalizado..." onKeyDown={(e) => e.key === "Enter" && addSetorCustom()} />
              <button onClick={addSetorCustom} style={{ padding: "10px 18px", background: C.accent, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", fontSize: "0.85rem" }}>+ Setor</button>
            </div>
          </div>
          <FG><Label sub="Mensagem que a IA envia ao transferir">Mensagem de Transferência</Label>
            <TextArea value={mensagemTransferencia} onChange={setMensagemTransferencia} placeholder="Ex: Entendi! Vou transferir você para nosso time. Um momento." rows={2} /></FG>
          <FG><Label sub="Informações enviadas junto com a transferência">Informações para Transferência</Label>
            <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
              {infosTransferencia.map((info, i) => <Chip key={i} onRemove={() => setInfosTransferencia(infosTransferencia.filter((_, j) => j !== i))}>{info}</Chip>)}
            </div>
            <AddRow value={novaInfo} onChange={setNovaInfo} onAdd={() => addItem(infosTransferencia, setInfosTransferencia, novaInfo, setNovaInfo)} placeholder="Ex: Número do pedido, telefone..." />
          </FG>
        </>
      )}
    </Card>
  );

  const renderEntrada = () => (
    <Card title="Capacidades de Entrada da IA">
      <div style={{ background: C.accentLt, border: `1px solid ${C.accent}33`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <p style={{ color: C.accent, fontWeight: 600, margin: "0 0 4px", fontSize: "0.88rem" }}>💬 Formato de resposta: Texto</p>
        <p style={{ color: C.txtSec, margin: 0, fontSize: "0.8rem" }}>A IA sempre responderá em formato de texto. Abaixo, escolha quais tipos de entrada ela será capaz de interpretar.</p>
      </div>

      <p style={{ color: C.txtSec, fontSize: "0.84rem", marginBottom: 16 }}>Selecione o que a IA será capaz de receber e interpretar do cliente:</p>

      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        {[
          { key: "audio", icon: "🎙️", label: "Transcrever Áudios", desc: "A IA ouvirá e transcreverá áudios enviados pelo cliente" },
          { key: "imagem", icon: "🖼️", label: "Interpretar Imagens", desc: "A IA analisará imagens e fotos enviadas pelo cliente" },
          { key: "documento", icon: "📄", label: "Ler Documentos", desc: "A IA lerá PDFs e documentos enviados pelo cliente" },
        ].map((f) => (
          <button key={f.key} onClick={() => toggleEntrada(f.key)} style={{
            flex: 1, padding: 20, background: entradas.includes(f.key) ? C.accentLt : "#fff",
            border: `2px solid ${entradas.includes(f.key) ? C.accent : C.inBor}`, borderRadius: 14,
            color: entradas.includes(f.key) ? C.accent : C.txtSec, cursor: "pointer", textAlign: "center", transition: "all .2s",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: "0.72rem", lineHeight: 1.3, opacity: 0.8 }}>{f.desc}</div>
          </button>
        ))}
      </div>

      {entradas.includes("audio") && <FG><Label sub="Instruções específicas para transcrição de áudios">Instruções para Áudios</Label>
        <TextArea value={instrucaoAudio} onChange={setInstrucaoAudio} placeholder="Ex: Transcrever o áudio e responder com base no conteúdo falado pelo cliente..." rows={2} /></FG>}
      {entradas.includes("imagem") && <FG><Label sub="Instruções para interpretação de imagens">Instruções para Imagens</Label>
        <TextArea value={instrucaoImagem} onChange={setInstrucaoImagem} placeholder="Ex: Analisar prints de erro, fotos de produtos, comprovantes..." rows={2} /></FG>}
      {entradas.includes("documento") && <FG><Label sub="Instruções para leitura de documentos">Instruções para Documentos</Label>
        <TextArea value={instrucaoDocumento} onChange={setInstrucaoDocumento} placeholder="Ex: Ler contratos, propostas ou manuais enviados pelo cliente..." rows={2} /></FG>}

      {/* PRICING NOTICE */}
      <div style={{
        background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, padding: 16, marginTop: 20,
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>💰</span>
        <div>
          <p style={{ color: "#92400E", fontWeight: 700, margin: "0 0 6px", fontSize: "0.88rem" }}>Aviso sobre valores</p>
          <p style={{ color: "#A16207", margin: 0, fontSize: "0.8rem", lineHeight: 1.5 }}>
            O valor do serviço pode variar de acordo com as capacidades selecionadas acima. Funcionalidades como transcrição de áudios, interpretação de imagens e leitura de documentos possuem custos adicionais. Você será informado sobre os valores antes da ativação.
          </p>
        </div>
      </div>
    </Card>
  );

  const renderRevisao = () => (
    <>
      <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 14, padding: 18, marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontSize: "1.4rem" }}>⚠️</span>
        <div>
          <p style={{ color: "#92400E", fontWeight: 700, margin: "0 0 4px", fontSize: "0.92rem" }}>Revise todas as informações antes de enviar</p>
          <p style={{ color: "#A16207", margin: 0, fontSize: "0.82rem" }}>Após confirmar, seu prompt será gerado e enviado para nossa equipe configurar na plataforma.</p>
        </div>
      </div>
      <Card title="🤖 Identidade">
        <ReviewRow label="Seu Nome" value={nomeCliente} empty={!nomeCliente} />
        <ReviewRow label="Seu E-mail" value={emailCliente} empty={!emailCliente} />
        <ReviewRow label="Telefone" value={telefoneCliente} empty={!telefoneCliente} />
        <ReviewRow label="Nome da IA" value={nomeIA} empty={!nomeIA} />
        <ReviewRow label="Empresa" value={nomeEmpresa} empty={!nomeEmpresa} />
        <ReviewRow label="Função" value={funcaoIA} empty={!funcaoIA} />
        <ReviewRow label="Tom de Voz" value={tomVoz} />
        <ReviewRow label="Idioma" value={idioma} />
      </Card>
      <Card title="🎭 Personalidade">
        <ReviewRow label="Estilo" value={estiloResposta} />
        <ReviewRow label="Formalidade" value={nivelFormalidade} />
        <ReviewRow label="Emojis" value={usaEmojis} />
      </Card>
      <Card title="📋 Regras">
        <ReviewRow label="Proibições" value={`${proibicoes.length} regra(s)`} />
        <ReviewRow label="Comportamentos" value={`${comportamentos.length} item(s)`} />
      </Card>
      <Card title="📚 Conhecimento">
        <ReviewRow label="Base de Conhecimento" value={baseConhecimento ? `${baseConhecimento.substring(0, 80)}...` : ""} empty={!baseConhecimento} />
        <ReviewRow label="Anexo PDF" value={temPDF ? "Sim" : "Não"} />
        <ReviewRow label="Glossário" value={`${glossario.filter(g => g.termo).length} termo(s)`} />
        <ReviewRow label="FAQ" value={`${faq.filter(f => f.pergunta).length} pergunta(s)`} />
      </Card>
      <Card title="🔄 Fluxo">
        <ReviewRow label="Etapas" value={etapasFluxo.filter(e => e.nome).map(e => e.nome).join(" → ")} />
      </Card>
      <Card title="🔀 Transferência">
        <ReviewRow label="Habilitado" value={habilitaTransferencia ? "Sim" : "Não"} />
        {habilitaTransferencia && <>
          <ReviewRow label="Setores" value={setoresEscolhidos.join(", ") || ""} empty={!setoresEscolhidos.length} />
          <ReviewRow label="Informações" value={infosTransferencia.join(", ")} />
        </>}
      </Card>
      <Card title="📥 Capacidades da IA">
        <ReviewRow label="Formato de Resposta" value="Texto" />
        <ReviewRow label="Entradas Habilitadas" value={entradas.length > 0 ? entradas.map(e => e === "audio" ? "Transcrição de Áudios" : e === "imagem" ? "Interpretação de Imagens" : "Leitura de Documentos").join(", ") : "Somente texto (sem capacidades extras)"} />
      </Card>
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button onClick={handleSubmit} disabled={isSubmitting} style={{
          padding: "16px 48px", background: isSubmitting ? C.txtSec : "linear-gradient(135deg, #4F46E5, #7C3AED)",
          border: "none", borderRadius: 14, color: "#fff", cursor: isSubmitting ? "wait" : "pointer",
          fontWeight: 800, fontSize: "1.05rem", boxShadow: "0 4px 20px rgba(79,70,229,0.3)", transition: "all .3s",
        }}>{isSubmitting ? "⏳ Gerando e Enviando..." : "✅ Confirmar e Gerar Prompt"}</button>
        <p style={{ color: C.txtSec, fontSize: "0.78rem", marginTop: 10 }}>O prompt será enviado automaticamente para nossa equipe.</p>
      </div>
    </>
  );

  const renderConcluido = () => (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ width: 100, height: 100, borderRadius: "50%", background: C.successLt, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "3rem" }}>✅</div>
      <h2 style={{ color: C.txt, fontWeight: 800, fontSize: "1.6rem", marginBottom: 8 }}>Prompt Gerado com Sucesso!</h2>
      <p style={{ color: C.txtSec, fontSize: "1rem", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.6 }}>
        Suas informações foram recebidas pela nossa equipe. Em breve entraremos em contato para finalizar a configuração da sua IA.
      </p>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 420, margin: "0 auto 24px", textAlign: "left" }}>
        <h4 style={{ color: C.accent, fontWeight: 700, marginTop: 0, marginBottom: 14 }}>Próximos passos:</h4>
        {["Nossa equipe revisará suas informações", "Configuraremos o prompt na plataforma", "Adicionaremos os IDs de transferência dos setores", "Você receberá acesso para testar sua IA"].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <div style={{ minWidth: 26, height: 26, borderRadius: "50%", background: C.accentLt, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem" }}>{i + 1}</div>
            <span style={{ color: C.txt, fontSize: "0.88rem" }}>{s}</span>
          </div>
        ))}
      </div>
      <p style={{ color: C.txtSec, fontSize: "0.82rem" }}>Dúvidas? Entre em contato com nosso suporte.</p>
    </div>
  );

  const renderers = [renderIdentidade, renderPersonalidade, renderRegras, renderConhecimento, renderFluxo, renderTransferencia, renderEntrada, renderRevisao, renderConcluido];
  const isReview = currentStep === STEPS.length - 2;
  const isFinal = currentStep === STEPS.length - 1;

  const next = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F0F2FF 0%, #FFFFFF 100%)", color: C.txt, fontFamily: "'Inter','Segoe UI',-apple-system,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "20px 32px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>⚡ Configurador de IA</h1>
          <p style={{ color: C.txtSec, fontSize: "0.84rem", margin: "4px 0 0" }}>Preencha as informações para configurar sua assistente virtual</p>
        </div>
      </div>

      {/* STEPPER */}
      {!isFinal && (
        <div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "14px 32px", overflowX: "auto" }}>
          <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", gap: 4 }}>
            {STEPS.filter((_, i) => i < STEPS.length - 1).map((step, i) => (
              <button key={step.id} onClick={() => !submitted && setCurrentStep(i)} style={{
                flex: 1, padding: "10px 6px", background: i === currentStep ? C.accentLt : "transparent",
                border: `1.5px solid ${i === currentStep ? C.accent : i < currentStep ? C.success : C.inBor}`,
                borderRadius: 10, color: i === currentStep ? C.accent : i < currentStep ? C.success : C.txtSec,
                cursor: submitted ? "default" : "pointer", textAlign: "center", fontSize: "0.7rem",
                fontWeight: i === currentStep ? 700 : 500, transition: "all .2s", whiteSpace: "nowrap",
              }}>
                <span style={{ fontSize: "1rem", display: "block", marginBottom: 2 }}>{i < currentStep ? "✓" : step.icon}</span>
                {step.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div style={{ maxWidth: 920, margin: "0 auto", padding: isFinal ? "24px 32px" : "24px 32px 120px" }}>
        {!isFinal && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ color: C.txt, fontWeight: 700, fontSize: "1.2rem", margin: 0 }}>{STEPS[currentStep].icon} {STEPS[currentStep].label}</h2>
            <div style={{ height: 4, background: C.border, borderRadius: 4, marginTop: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((currentStep + 1) / (STEPS.length - 1)) * 100}%`, background: "linear-gradient(90deg, #4F46E5, #7C3AED)", borderRadius: 4, transition: "width .4s ease" }} />
            </div>
          </div>
        )}
        {renderers[currentStep]()}
      </div>

      {/* BOTTOM NAV */}
      {!isFinal && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: `1px solid ${C.border}`, padding: "14px 32px", boxShadow: "0 -2px 10px rgba(0,0,0,0.04)" }}>
          <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={prev} disabled={currentStep === 0} style={{
              padding: "10px 24px", background: currentStep === 0 ? C.card : "#fff",
              border: `1.5px solid ${C.inBor}`, borderRadius: 10,
              color: currentStep === 0 ? C.inBor : C.txt, cursor: currentStep === 0 ? "not-allowed" : "pointer", fontWeight: 600,
            }}>← Anterior</button>
            <span style={{ color: C.txtSec, fontSize: "0.82rem" }}>{currentStep + 1} de {STEPS.length - 1}</span>
            {!isReview && (
              <button onClick={next} style={{
                padding: "10px 24px", background: "linear-gradient(135deg, #4F46E5, #6D5BF7)",
                border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem",
                boxShadow: "0 2px 8px rgba(79,70,229,0.25)",
              }}>Próximo →</button>
            )}
            {isReview && <div />}
          </div>
        </div>
      )}
    </div>
  );
}
