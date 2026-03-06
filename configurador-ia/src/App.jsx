import { useState, memo, useRef, useEffect } from "react";

// ─── CONFIG ───
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "AIzaSyAZQNi8kxv1XpNu50E4DoloXglmAByfmNM";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
const N8N_WEBHOOK_URL = "https://n8n-matheus.riochat.com.br/webhook/prompt";

const STEPS = [
  { id: "identidade", label: "Identidade", icon: "👤" },
  { id: "personalidade", label: "Personalidade", icon: "🎭" },
  { id: "conhecimento", label: "Conhecimento", icon: "📚" },
  { id: "fluxo", label: "Fluxo & Interação", icon: "🔄" },
  { id: "config", label: "Configurações", icon: "⚙️" },
  { id: "revisao", label: "Revisão", icon: "✅" },
  { id: "concluido", label: "Concluído", icon: "🎉" },
];

const SETORES_PADRAO = ["Comercial", "Pós-venda", "Vendas", "Suporte"];

const DEFAULT_PROIBICOES = [
  "Inventar informações que não estão na base de conhecimento",
  "Informar valores, preços ou orçamentos",
  "Prometer prazos de entrega ou conclusão de serviços",
  "Fazer promessas que a empresa não pode cumprir",
  "Usar linguagem ofensiva ou discriminatória",
  "Compartilhar dados sensíveis de outros clientes",
  "Fornecer diagnósticos médicos, jurídicos ou financeiros",
  "Realizar cobranças ou negociações de pagamento",
];

const DEFAULT_COMPORTAMENTOS = [
  "Ser empático e acolhedor em todas as interações",
  "Confirmar o entendimento antes de responder",
  "Quando não souber a informação, transferir para um atendente humano",
  "Manter o foco no objetivo da conversa",
  "Sempre perguntar se pode ajudar em algo mais antes de encerrar",
  "Usar o nome do cliente durante a conversa quando disponível",
];

const PERGUNTAS_EMPRESA = [
  { id: "segmento", pergunta: "Qual o ramo da empresa?", tipo: "texto", placeholder: "Ex: Restaurante, Clínica, Loja de roupas, Escritório contábil..." },
  { id: "publicoAlvo", pergunta: "Descreva seu público-alvo ou cliente ideal em poucas palavras:", tipo: "texto", placeholder: "Ex: Empresas de tecnologia, consumidor final, jovens 18-30 anos, pequenas empresas..." },
  { id: "tipoNegocio", pergunta: "A empresa trabalha com:", tipo: "opcoes", opcoes: ["Produto", "Serviço", "Ambos"] },
  { id: "comoCompra", pergunta: "Como o cliente compra ou contrata seus serviços?", tipo: "multiOpcoesOutro", opcoes: ["Pelo WhatsApp", "Pelo site/loja virtual", "Presencialmente", "Por telefone", "Por agendamento online", "Pela rede social", "Outro"] },
  { id: "horario", pergunta: "Horário de atendimento:", tipo: "horarioSemanal" },
  { id: "formasPagamento", pergunta: "Formas de pagamento aceitas:", tipo: "multiOpcoes", opcoes: ["Pix", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Link de Pagamento", "Dinheiro", "Todos"] },
  { id: "entrega", pergunta: "Como o cliente recebe o produto/serviço?", tipo: "multiOpcoesOutro", opcoes: ["Entrega", "Retirada no local", "Entrega e retirada", "Online/Remoto", "Atendimento presencial", "Outro"] },
  { id: "minimoCompra", pergunta: "Existe pedido mínimo ou valor mínimo? Qual?", tipo: "simNaoTexto", placeholder: "Ex: Mínimo de R$50, mínimo 2 peças..." },
  { id: "objecoes", pergunta: "Quais perguntas ou reclamações os clientes mais fazem?", tipo: "texto", placeholder: "Ex: 'Quanto custa?', 'Tem desconto?', 'Vocês parcelam?', 'Demora muito?'..." },
  { id: "diferenciais", pergunta: "O que diferencia a empresa dos concorrentes? (3 pontos)", tipo: "texto", placeholder: "Ex: Atendimento personalizado, entrega no mesmo dia, 10 anos de experiência..." },
  { id: "siteInstagram", pergunta: "Qual o site e/ou Instagram da empresa?", tipo: "texto", placeholder: "Ex: www.minhaempresa.com.br | @minhaempresa" },
  { id: "lojaFisica", pergunta: "Tem loja física ou escritório? Qual o endereço?", tipo: "simNaoTexto", placeholder: "Ex: Rua das Flores, 123 - Centro, São Paulo/SP" },
  { id: "objetivoIA", pergunta: "O que você quer que a IA faça?", tipo: "texto", placeholder: "Ex: Tire dúvidas, realize um pré-atendimento, atue como suporte, qualifique leads..." },
];

// ─── COLORS ───
const C = {
  bg: "#F2F7F2", card: "#FFFFFF", border: "#D4E4D4",
  accent: "#3DA349", accentLt: "#E5F4E7", accentDk: "#2B8535",
  accentGrad: "linear-gradient(135deg, #3DA349, #4CAF50)",
  txt: "#1C2B1C", txtSec: "#5D7A5D", txtLight: "#94B094",
  inBg: "#FAFCFA", inBor: "#C0D4C0",
  chipBg: "#E5F4E7", chipTxt: "#3DA349",
  danger: "#D32F2F", dangerLt: "#FFEBEE",
  success: "#3DA349", successLt: "#E5F4E7",
};

const inputSx = { width: "100%", padding: "12px 16px", background: C.inBg, border: `1.5px solid ${C.inBor}`, borderRadius: 12, color: C.txt, fontSize: "0.9rem", outline: "none", boxSizing: "border-box", transition: "border-color .2s, box-shadow .2s", fontFamily: "'DM Sans', sans-serif" };
const focusStyle = (e, on) => { e.target.style.borderColor = on ? C.accent : C.inBor; e.target.style.boxShadow = on ? `0 0 0 3px ${C.accentLt}` : "none"; };

// ─── UI ───
const Label = memo(({ children, sub }) => (<label style={{ display: "block", marginBottom: 6 }}><span style={{ color: C.txt, fontWeight: 600, fontSize: "0.9rem" }}>{children}</span>{sub && <span style={{ color: C.txtSec, fontSize: "0.78rem", display: "block", marginTop: 2 }}>{sub}</span>}</label>));
const Input = memo(({ value, onChange, placeholder, ...props }) => (<input defaultValue={value} onBlur={(e) => { onChange(e.target.value); focusStyle(e, false); }} placeholder={placeholder} style={inputSx} onFocus={(e) => focusStyle(e, true)} {...props} />));
const TextArea = memo(({ value, onChange, placeholder, rows = 3 }) => (<textarea defaultValue={value} onBlur={(e) => { onChange(e.target.value); focusStyle(e, false); }} placeholder={placeholder} rows={rows} style={{ ...inputSx, resize: "vertical", fontFamily: "'DM Sans', sans-serif" }} onFocus={(e) => focusStyle(e, true)} />));
const Select = memo(({ value, onChange, options }) => (<select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputSx, cursor: "pointer" }}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>));
const Chip = memo(({ children, onRemove }) => (<span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: C.chipBg, borderRadius: 20, fontSize: "0.82rem", color: C.chipTxt, margin: 3, fontWeight: 600 }}>{children}{onRemove && <button onClick={onRemove} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", padding: 0, lineHeight: 1 }}>×</button>}</span>));
const Card = memo(({ title, children }) => (<div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>{title && <h3 style={{ color: C.accent, fontSize: "0.95rem", fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`, marginTop: 0 }}>{title}</h3>}{children}</div>));
const FG = ({ children }) => <div style={{ marginBottom: 16 }}>{children}</div>;
const ReviewRow = memo(({ label, value, empty }) => (<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}><span style={{ color: C.txtSec, fontSize: "0.84rem", fontWeight: 500, minWidth: 140 }}>{label}</span><span style={{ color: empty ? C.danger : C.txt, fontSize: "0.84rem", textAlign: "right", flex: 1, marginLeft: 16 }}>{empty ? "⚠️ Não preenchido" : value}</span></div>));
const ToggleBtn = memo(({ active, onClick, children, style: sx }) => (<button onClick={onClick} style={{ padding: "10px 20px", background: active ? C.accentGrad : "#fff", border: `2px solid ${active ? C.accent : C.inBor}`, borderRadius: 12, color: active ? "#fff" : C.txt, cursor: "pointer", fontWeight: 700, fontSize: "0.88rem", transition: "all .2s", ...sx }}>{children}</button>));
const AddRow = memo(({ value, onChange, onAdd, placeholder }) => { const ref = useRef(null); const ha = () => { onAdd(); if (ref.current) ref.current.value = ""; }; return (<div style={{ display: "flex", gap: 8, marginTop: 8 }}><input defaultValue={value} onChange={(e) => onChange(e.target.value)} ref={ref} placeholder={placeholder} onKeyDown={(e) => { if (e.key === "Enter") ha(); }} style={inputSx} onFocus={(e) => focusStyle(e, true)} onBlur={(e) => focusStyle(e, false)} /><button onClick={ha} style={{ padding: "10px 18px", background: C.accentGrad, border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap", fontSize: "0.85rem" }}>+ Adicionar</button></div>); });
const ChatBubble = ({ de, msg }) => { const isC = de === "cliente"; return (<div style={{ display: "flex", justifyContent: isC ? "flex-end" : "flex-start", marginBottom: 8 }}><div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: isC ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isC ? "#DCF8C6" : "#fff", border: isC ? "none" : `1px solid ${C.border}`, fontSize: "0.82rem", lineHeight: 1.5, color: C.txt, whiteSpace: "pre-wrap", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}><div style={{ fontSize: "0.68rem", fontWeight: 700, color: isC ? "#2E7D32" : C.accent, marginBottom: 4 }}>{isC ? "Cliente" : "IA"}</div>{msg}</div></div>); };

// ─── GEMINI ───
async function callGemini(prompt) {
  try {
    const r = await fetch(GEMINI_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 6000 } }) });
    const d = await r.json();
    return d?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (e) { console.error("Gemini:", e); return ""; }
}

// ═════════════════════════
//  MAIN
// ═════════════════════════
export default function PromptGenerator() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState(null);

  const [nomeCliente, setNomeCliente] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [nomeIA, setNomeIA] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [funcaoIA, setFuncaoIA] = useState("atendimento");
  const [respostas, setRespostas] = useState({});
  const setR = (id, val) => setRespostas((p) => ({ ...p, [id]: val }));

  const [tomVoz, setTomVoz] = useState("profissional");
  const [idioma, setIdioma] = useState("Português Brasileiro");
  const [estiloResposta, setEstiloResposta] = useState("consultivo");
  const [nivelFormalidade, setNivelFormalidade] = useState("semi-formal");
  const [usaEmojis, setUsaEmojis] = useState("moderado");
  const [cumprimentoInicial, setCumprimentoInicial] = useState("");
  const [mensagemEncerramento, setMensagemEncerramento] = useState("");
  const [proibicoes, setProibicoes] = useState([...DEFAULT_PROIBICOES]);
  const [novaProibicao, setNovaProibicao] = useState("");
  const [comportamentos, setComportamentos] = useState([...DEFAULT_COMPORTAMENTOS]);
  const [novoComportamento, setNovoComportamento] = useState("");

  const [glossario, setGlossario] = useState([{ termo: "", definicao: "" }]);
  const [baseConhecimento, setBaseConhecimento] = useState("");
  const [arquivos, setArquivos] = useState([]);
  const [arquivosTexto, setArquivosTexto] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [faq, setFaq] = useState([{ pergunta: "", resposta: "" }]);

  const [etapasFluxo, setEtapasFluxo] = useState([]);
  const [fluxoGerado, setFluxoGerado] = useState(false);
  const [gerandoFluxo, setGerandoFluxo] = useState(false);
  const [interacoes, setInteracoes] = useState([]);
  const [interacaoEscolhida, setInteracaoEscolhida] = useState(null);
  const [gerandoInteracoes, setGerandoInteracoes] = useState(false);
  const [jaGerouAuto, setJaGerouAuto] = useState(false);

  const [habilitaTransferencia, setHabilitaTransferencia] = useState(true);
  const [setoresEscolhidos, setSetoresEscolhidos] = useState([]);
  const [setoresCustom, setSetoresCustom] = useState([]);
  const [novoSetor, setNovoSetor] = useState("");
  const [infosTransferencia, setInfosTransferencia] = useState(["Nome do cliente", "Resumo da conversa", "Necessidade identificada"]);
  const [novaInfo, setNovaInfo] = useState("");
  const [mensagemTransferencia, setMensagemTransferencia] = useState("");
  const [entradas, setEntradas] = useState([]);
  const [instrucaoAudio, setInstrucaoAudio] = useState("");
  const [instrucaoImagem, setInstrucaoImagem] = useState("");
  const [instrucaoDocumento, setInstrucaoDocumento] = useState("");

  // ─── HELPERS ───
  const toggleEntrada = (f) => setEntradas((p) => p.includes(f) ? p.filter((x) => x !== f) : [...p, f]);
  const toggleSetor = (s) => setSetoresEscolhidos((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const addSetorCustom = () => { const s = novoSetor.trim(); if (s && !setoresCustom.includes(s)) { setSetoresCustom([...setoresCustom, s]); setSetoresEscolhidos([...setoresEscolhidos, s]); setNovoSetor(""); } };
  const removeSetorCustom = (s) => { setSetoresCustom(setoresCustom.filter((x) => x !== s)); setSetoresEscolhidos(setoresEscolhidos.filter((x) => x !== s)); };
  const addItem = (list, setList, value, setValue) => { if (value.trim()) { setList([...list, value.trim()]); setValue(""); } };
  const fmtSize = (b) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

  const getRespTxt = (id) => {
    const p = PERGUNTAS_EMPRESA.find(x => x.id === id); const r = respostas[id];
    if (!r || r === "") return ""; if (p?.tipo === "simNao") return r ? "Sim" : "Não";
    if (p?.tipo === "simNaoTexto") return r.ativo ? "Sim" + (r.detalhe ? ` - ${r.detalhe}` : "") : "Não";
    if (p?.tipo === "opcoes") return r;
    if (p?.tipo === "opcoesOutro") return r?.valor ? `${r.valor}${r.valor === "Outro" && r.detalhe ? ` - ${r.detalhe}` : ""}` : "";
    if (p?.tipo === "multiOpcoes") return Array.isArray(r) ? r.join(", ") : "";
    if (p?.tipo === "multiOpcoesOutro") return r ? (r.opcoes || []).join(", ") + (r.outroTexto ? `, ${r.outroTexto}` : "") : "";
    if (p?.tipo === "horarioSemanal") { return Object.entries(r || {}).filter(([k, v]) => k !== "_custom" && v).map(([k, v]) => `${k}: ${v === "Personalizado" ? (r._custom || "Personalizado") : v}`).join(" | "); }
    return r || "";
  };

  const getContexto = () => {
    const info = PERGUNTAS_EMPRESA.map(p => { const t = getRespTxt(p.id); return t ? `${p.pergunta} ${t}` : null; }).filter(Boolean).join("\n");
    return `Empresa: ${nomeEmpresa}\nNome da IA: ${nomeIA || "Assistente"}\nTipo: ${funcaoIA}\nTom: ${tomVoz}, Estilo: ${estiloResposta}, Emojis: ${usaEmojis}\n\n${info}\n\nBase de conhecimento: ${baseConhecimento ? baseConhecimento.substring(0, 2000) : "Não informado"}${arquivosTexto.length ? "\n" + arquivosTexto.map(a => a.texto.substring(0, 800)).join("\n") : ""}`;
  };

  // ─── FILES (Gemini extrai texto de PDFs) ───
  const [extraindoPDF, setExtraindoPDF] = useState(false);
  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Full = e.target.result;
        setArquivos((prev) => [...prev, { name: file.name, size: file.size, type: file.type, base64: base64Full, status: "processando" }]);
        
        if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
          const tr = new FileReader();
          tr.onload = (ev) => {
            setArquivosTexto(prev => [...prev, { name: file.name, texto: ev.target.result }]);
            setArquivos(prev => prev.map(a => a.name === file.name ? { ...a, status: "lido" } : a));
          };
          tr.readAsText(file);
        } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          setExtraindoPDF(true);
          try {
            const base64Data = base64Full.split(",")[1];
            const res = await fetch(GEMINI_URL, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [
                  { inlineData: { mimeType: "application/pdf", data: base64Data } },
                  { text: "Extraia TODO o texto deste PDF. Retorne APENAS o conteúdo de texto puro, sem formatação markdown, sem comentários. Se houver tabelas, formate-as de forma legível." }
                ] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 8000 }
              })
            });
            const data = await res.json();
            const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text || `[PDF: ${file.name} - não foi possível extrair texto]`;
            setArquivosTexto(prev => [...prev, { name: file.name, texto }]);
            setArquivos(prev => prev.map(a => a.name === file.name ? { ...a, status: "lido" } : a));
          } catch (err) {
            console.error("PDF extract error:", err);
            setArquivosTexto(prev => [...prev, { name: file.name, texto: `[PDF: ${file.name} - erro ao extrair]` }]);
            setArquivos(prev => prev.map(a => a.name === file.name ? { ...a, status: "erro" } : a));
          }
          setExtraindoPDF(false);
        } else {
          setArquivosTexto(prev => [...prev, { name: file.name, texto: `[Arquivo: ${file.name} - ${file.type}]` }]);
          setArquivos(prev => prev.map(a => a.name === file.name ? { ...a, status: "referencia" } : a));
        }
      };
      reader.readAsDataURL(file);
    });
  };
  const removeArquivo = (i) => { const nome = arquivos[i]?.name; setArquivos(arquivos.filter((_, j) => j !== i)); setArquivosTexto(arquivosTexto.filter(a => a.name !== nome)); };

  // ─── AUTO-GENERATE on step 3 ───
  useEffect(() => {
    if (step === 3 && !jaGerouAuto && nomeEmpresa) {
      setJaGerouAuto(true);
      if (!fluxoGerado) gerarFluxoIA();
      if (!interacoes.length) gerarInteracoesIA();
    }
  }, [step]);

  // ─── GEMINI: FLUXO ───
  const gerarFluxoIA = async () => {
    setGerandoFluxo(true);
    const ctx = getContexto();
    const prompt = `Você é um especialista em fluxos de atendimento para chatbots. Analise as informações da empresa e gere um fluxo personalizado.

${ctx}

Gere entre 4 e 6 etapas de fluxo ESPECÍFICAS para este negócio. Cada etapa deve ter nome e descrição detalhada de como a IA deve agir, incluindo exemplos de frases.

RESPONDA APENAS em JSON puro (sem markdown, sem backticks):
[{"nome":"Nome da Etapa","descricao":"Descrição detalhada com exemplo de frase que a IA deve usar"}]

IMPORTANTE:
- A primeira etapa SEMPRE deve ser saudação com coleta de nome
- A última etapa SEMPRE deve ser encerramento ou transferência para humano
- As etapas do meio devem ser ESPECÍFICAS para o tipo de negócio (ex: para auto center, incluir identificação do veículo; para restaurante, coleta de pedido)
- Inclua exemplos de frases reais que a IA deve usar em cada etapa`;

    const result = await callGemini(prompt);
    try {
      const clean = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length) { setEtapasFluxo(parsed); setFluxoGerado(true); setGerandoFluxo(false); return; }
    } catch (e) { console.error("Flow parse:", e, result); }
    // Fallback
    setEtapasFluxo([
      { nome: "Saudação e Identificação", descricao: `Cumprimentar, se apresentar como ${nomeIA || "assistente"} da ${nomeEmpresa} e perguntar o nome do cliente.` },
      { nome: "Entender a Necessidade", descricao: "Fazer perguntas para entender o que o cliente precisa." },
      { nome: "Fornecer Informação", descricao: "Responder com base na base de conhecimento. Se não souber, avisar que vai transferir." },
      { nome: "Encerramento ou Transferência", descricao: "Confirmar se resolveu a dúvida. Se necessário, transferir para atendente humano." },
    ]);
    setFluxoGerado(true); setGerandoFluxo(false);
  };

  // ─── GEMINI: INTERAÇÕES ───
  const gerarInteracoesIA = async () => {
    setGerandoInteracoes(true);
    const ctx = getContexto();
    const prompt = `Você é um especialista em design de conversas para chatbots. Crie 3 exemplos de estilos de interação para a empresa abaixo.

${ctx}

REGRAS OBRIGATÓRIAS:
- Os exemplos devem usar situações REAIS deste negócio específico
- A IA se chama "${nomeIA || "Assistente"}" e a empresa é "${nomeEmpresa}"
- Cada conversa deve ter 4 a 6 mensagens alternadas (cliente/ia)
- Use emojis de forma ${usaEmojis === "nenhum" ? "nenhuma" : usaEmojis}
- Tom: ${tomVoz}
- Os 3 estilos devem ser DIFERENTES entre si (consultivo, direto, humanizado)
- As situações devem ser do DIA A DIA deste tipo de negócio

RESPONDA APENAS em JSON puro (sem markdown, sem backticks):
[{"id":"est1","titulo":"Emoji Nome do Estilo","descricao":"Quando usar","conversa":[{"de":"cliente","msg":"texto"},{"de":"ia","msg":"texto"}]}]`;

    const result = await callGemini(prompt);
    try {
      const clean = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length >= 2) { setInteracoes(parsed); setGerandoInteracoes(false); return; }
    } catch (e) { console.error("Interaction parse:", e, result); }
    // Fallback com exemplos genéricos
    setInteracoes([
      { id: "f1", titulo: "🎯 Consultivo", descricao: "Faz perguntas antes de responder", conversa: [{ de: "cliente", msg: "Olá, preciso de ajuda" }, { de: "ia", msg: `Olá! 😊 Eu sou ${nomeIA || "o assistente"} da ${nomeEmpresa}! Para te ajudar melhor, me conta: o que você está precisando?` }, { de: "cliente", msg: "Quero saber mais sobre os serviços" }, { de: "ia", msg: "Claro! Antes me conta um pouquinho sobre o que você precisa, assim consigo te indicar a melhor opção! 🎯" }] },
      { id: "f2", titulo: "⚡ Direto e Objetivo", descricao: "Respostas curtas e rápidas", conversa: [{ de: "cliente", msg: "Quais serviços vocês oferecem?" }, { de: "ia", msg: `Olá! Na ${nomeEmpresa} oferecemos diversos serviços. O que você está buscando especificamente?` }, { de: "cliente", msg: "Quero saber os horários" }, { de: "ia", msg: "Nosso horário de atendimento é de segunda a sexta. Posso te ajudar com mais alguma coisa?" }] },
      { id: "f3", titulo: "💚 Humanizado", descricao: "Cria conexão emocional", conversa: [{ de: "cliente", msg: "Boa tarde" }, { de: "ia", msg: `Boa tarde! 💚 Que bom receber você aqui na ${nomeEmpresa}! Eu sou ${nomeIA || "o assistente"}. Como posso te chamar?` }, { de: "cliente", msg: "Maria" }, { de: "ia", msg: "Maria, que prazer! 😊 Me conta como posso te ajudar hoje. Estou aqui pra isso! 🙌" }] },
    ]);
    setGerandoInteracoes(false);
  };

  // ─── GERAR PROMPT COMPLETO VIA GEMINI (estilo Viva Mais Açaí) ───
  const [gerandoPrompt, setGerandoPrompt] = useState(false);

  const gerarPrompt = async () => {
    const infoEmpresa = PERGUNTAS_EMPRESA.map(p => { const t = getRespTxt(p.id); return t ? `${p.pergunta} ${t}` : null; }).filter(Boolean).join("\n");
    const inter = interacaoEscolhida ? interacoes.find(i => i.id === interacaoEscolhida) : null;
    const baseCompleta = [baseConhecimento, ...arquivosTexto.map(a => a.texto)].filter(Boolean).join("\n");
    const saudacao = cumprimentoInicial || `Olá! 😊\nEu sou ${nomeIA || "o assistente"}, seu assistente aqui na ${nomeEmpresa}.\nQual o seu nome?`;
    const encerramento = mensagemEncerramento || `Foi um prazer atender você! Se precisar, estou por aqui. 😊`;
    const gv = glossario.filter(g => g.termo && g.definicao);
    const fv = faq.filter(f => f.pergunta && f.resposta);

    const megaPrompt = `Você é um especialista em criar prompts XML completos e profissionais para chatbots de atendimento. 

Gere um prompt XML COMPLETO e ROBUSTO seguindo EXATAMENTE a estrutura do exemplo abaixo. O prompt deve ser específico para a empresa informada.

═══ DADOS DA EMPRESA ═══
Nome da IA: ${nomeIA || "Assistente"}
Empresa: ${nomeEmpresa}
Tipo de IA: ${funcaoIA}
Tom: ${tomVoz} | Estilo: ${estiloResposta} | Formalidade: ${nivelFormalidade} | Emojis: ${usaEmojis}
Idioma: ${idioma}

Informações da empresa:
${infoEmpresa}

Saudação inicial: ${saudacao}
Mensagem de encerramento: ${encerramento}

Proibições:
${proibicoes.map(p => `- ${p}`).join("\n")}

Comportamentos corretos:
${comportamentos.map(c => `- ${c}`).join("\n")}

${gv.length ? `Glossário:\n${gv.map(g => `- ${g.termo}: ${g.definicao}`).join("\n")}` : ""}

Base de conhecimento:
${baseCompleta || "[Não fornecida]"}

${fv.length ? `FAQ:\n${fv.map(f => `P: ${f.pergunta}\nR: ${f.resposta}`).join("\n\n")}` : ""}

Fluxo de atendimento:
${etapasFluxo.filter(e => e.nome).map((e, i) => `${i + 1}. ${e.nome}: ${e.descricao}`).join("\n")}

${inter ? `Estilo de interação escolhido: ${inter.titulo} - ${inter.descricao}` : ""}

Capacidades de entrada: ${entradas.length ? entradas.join(", ") : "Somente texto"}
${entradas.includes("audio") ? `Instrução áudio: ${instrucaoAudio || "Transcreva áudios. Se transcrição confusa, peça para digitar."}` : ""}

${habilitaTransferencia && setoresEscolhidos.length ? `Setores de transferência: ${setoresEscolhidos.join(", ")}\nMensagem de transferência: ${mensagemTransferencia || "Vou transferir para nosso time."}\nInformações a enviar: ${infosTransferencia.join(", ")}` : ""}

═══ ESTRUTURA OBRIGATÓRIA DO XML ═══

O prompt DEVE seguir esta estrutura (baseada no modelo Viva Mais Açaí):

1. <identidade> com nome_ia, empresa, papel, missao
2. <personalidade> com tom, estilo, emojis, respostas
3. <regras_anti_alucinacao> com regras ESPECÍFICAS para este negócio (prioridade CRÍTICA)
4. <regras> com proibicoes_absolutas e comportamento_correto
5. <correcao_ortografica> com mapeamento de termos comuns do negócio e erros frequentes
6. <dados_empresa> com endereço (se informado), horários, formas de pagamento
7. <dados><base_de_conhecimento> com todo o conteúdo fornecido
8. <glossario> com termos técnicos do segmento (GERE termos relevantes para o negócio mesmo que não tenham sido informados)
9. <faq> com perguntas e respostas
10. <fluxo_de_atendimento> com etapas detalhadas incluindo exemplos de frases da IA
11. <formato_de_saida>
12. <capacidades_de_entrada> (se houver)
13. <sistema_transferencia> com EXATAMENTE esta estrutura para cada setor:
    <etapa>
      <acao_sistema>
        <instrucao_transferencia>
          Após enviar a mensagem, você deve:
          1. Enviar a mensagem de transferência
          2. TRANSFERIR AS SEGUINTES INFORMAÇÕES para o setor:
          ═══════════════════════════════════════
          📋 INFORMAÇÕES DO ATENDIMENTO
          ═══════════════════════════════════════
          [informações relevantes]
          ═══════════════════════════════════════
        </instrucao_transferencia>
        <destino>Execute a Tool "transferência" e use o ID [ID_SETOR]</destino>
        <contexto>Incluir todo o histórico da conversa junto com o resumo estruturado</contexto>
      </acao_sistema>
    </etapa>
14. <exemplo_interacao_completa> com pelo menos 1 exemplo de conversa COMPLETA e REALISTA do início ao fim (saudação → atendimento → encerramento)

REGRAS DE GERAÇÃO:
- Gere APENAS o XML puro, sem explicações antes ou depois
- NÃO use markdown ou backticks
- Seja EXTREMAMENTE detalhado nas instruções de cada etapa do fluxo
- Inclua exemplos de frases que a IA deve usar em cada etapa
- Gere regras anti-alucinação ESPECÍFICAS para este tipo de negócio
- Gere termos de glossário relevantes para o segmento MESMO QUE não tenham sido informados
- O exemplo de interação deve ser REALISTA e usar informações reais da empresa
- A estrutura de transferência DEVE seguir EXATAMENTE o formato com acao_sistema, instrucao_transferencia, destino e contexto`;

    const result = await callGemini(megaPrompt);
    
    if (result && result.includes("<identidade>")) {
      return result.trim();
    }
    
    // Fallback: monta manualmente se Gemini falhar
    return montarPromptManual(infoEmpresa, baseCompleta, saudacao, encerramento, inter, gv, fv);
  };

  const montarPromptManual = (infoEmpresa, baseCompleta, saudacao, encerramento, inter, gv, fv) => {
    let xml = `<identidade>\n  <nome_ia>${nomeIA || "Assistente"}</nome_ia>\n  <empresa>${nomeEmpresa || "Empresa"}</empresa>\n  <funcao>${funcaoIA}</funcao>\n  <tom_de_voz>${tomVoz}</tom_de_voz>\n  <idioma>${idioma}</idioma>\n  <informacoes_empresa>\n${infoEmpresa}\n  </informacoes_empresa>\n</identidade>\n\n`;
    xml += `<personalidade>\n  <estilo_resposta>${estiloResposta}</estilo_resposta>\n  <nivel_formalidade>${nivelFormalidade}</nivel_formalidade>\n  <uso_emojis>${usaEmojis}</uso_emojis>\n  <cumprimento_inicial>${saudacao}</cumprimento_inicial>\n  <mensagem_encerramento>${encerramento}</mensagem_encerramento>\n</personalidade>\n\n`;
    xml += `<regras>\n  <proibicoes_absolutas>\n${proibicoes.map(x => `    <proibicao>${x}</proibicao>`).join("\n")}\n  </proibicoes_absolutas>\n  <comportamento_correto>\n${comportamentos.map(x => `    <comportamento>${x}</comportamento>`).join("\n")}\n  </comportamento_correto>\n</regras>\n\n`;
    if (gv.length) xml += `<glossario>\n${gv.map(g => `  <termo><palavra>${g.termo}</palavra><significado>${g.definicao}</significado></termo>`).join("\n")}\n</glossario>\n\n`;
    xml += `<dados>\n  <base_de_conhecimento>\n${baseCompleta || "    [Base não fornecida]"}\n  </base_de_conhecimento>\n</dados>\n\n`;
    if (fv.length) xml += `<faq>\n${fv.map(f => `  <item><pergunta>${f.pergunta}</pergunta><resposta>${f.resposta}</resposta></item>`).join("\n")}\n</faq>\n\n`;
    xml += `<fluxo_de_atendimento>\n${etapasFluxo.filter(e => e.nome).map((e, i) => `  <etapa ordem="${i + 1}"><nome>${e.nome}</nome><descricao>${e.descricao}</descricao></etapa>`).join("\n")}\n</fluxo_de_atendimento>\n\n`;
    if (habilitaTransferencia && setoresEscolhidos.length) {
      xml += `<sistema_transferencia>\n`;
      setoresEscolhidos.forEach(s => { xml += `  <etapa>\n    <acao_sistema>\n      <instrucao_transferencia>Para ${s}: "${mensagemTransferencia || `Vou transferir para ${s}.`}"\nInformações: ${infosTransferencia.join(", ")}</instrucao_transferencia>\n      <destino>Execute a Tool "transferência" e use o ID [ID_${s.toUpperCase().replace(/[^A-Z0-9]/g, "_")}]</destino>\n      <contexto>Incluir todo o histórico da conversa</contexto>\n    </acao_sistema>\n  </etapa>\n`; });
      xml += `</sistema_transferencia>`;
    }
    return xml;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setGerandoPrompt(true);
    try {
      const prompt = await gerarPrompt();
      setGerandoPrompt(false);
      await fetch(N8N_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cliente: { nome: nomeCliente, email: emailCliente, telefone: telefoneCliente }, empresa: nomeEmpresa, nomeIA, funcaoIA, respostasEmpresa: respostas, interacaoEscolhida, setoresTransferencia: setoresEscolhidos, entradasHabilitadas: entradas, arquivos: arquivos.map(a => ({ name: a.name, size: a.size, type: a.type, base64: a.base64 })), promptXML: prompt, dataGeracao: new Date().toISOString() }) });
    } catch (e) { console.error(e); }
    setIsSubmitting(false); setSubmitted(true); setStep(STEPS.length - 1);
  };

  // ═════════════════════════
  //  RENDER STEPS
  // ═════════════════════════

  const renderStep0 = () => (
    <>
      <Card title="Seus Dados">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FG><Label>Seu Nome</Label><Input value={nomeCliente} onChange={setNomeCliente} placeholder="Seu nome completo" /></FG>
          <FG><Label>Seu E-mail</Label><Input value={emailCliente} onChange={setEmailCliente} placeholder="email@empresa.com" /></FG>
        </div>
        <FG><Label sub="Número com DDD">Telefone / WhatsApp</Label><Input value={telefoneCliente} onChange={setTelefoneCliente} placeholder="(11) 99999-9999" /></FG>
      </Card>
      <Card title="Dados da IA">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FG><Label>Nome da IA</Label><Input value={nomeIA} onChange={setNomeIA} placeholder="Ex: Luna, Max, Otto..." /></FG>
          <FG><Label>Nome da Empresa</Label><Input value={nomeEmpresa} onChange={setNomeEmpresa} placeholder="Ex: TechCorp Brasil" /></FG>
        </div>
        <FG><Label sub="Qual a principal função?">Tipo de IA</Label>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>{[{ v: "atendimento", l: "🎧 Atendimento" }, { v: "vendas", l: "💰 Vendas" }, { v: "suporte", l: "🔧 Suporte" }].map(t => (<ToggleBtn key={t.v} active={funcaoIA === t.v} onClick={() => setFuncaoIA(t.v)} style={{ flex: 1 }}>{t.l}</ToggleBtn>))}</div>
        </FG>
      </Card>
      <Card title="Informações da Empresa">
        <p style={{ color: C.txtSec, fontSize: "0.82rem", marginBottom: 16, lineHeight: 1.5 }}>Quanto mais detalhes, melhor a IA. Responda tudo que souber.</p>
        {PERGUNTAS_EMPRESA.map(perg => (
          <div key={perg.id} style={{ marginBottom: 14, padding: 14, background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <Label>{perg.pergunta}</Label>
            {perg.tipo === "texto" && <Input value={respostas[perg.id] || ""} onChange={v => setR(perg.id, v)} placeholder={perg.placeholder} />}
            {perg.tipo === "simNao" && <select value={respostas[perg.id] === true ? "s" : respostas[perg.id] === false ? "n" : ""} onChange={e => setR(perg.id, e.target.value === "s" ? true : e.target.value === "n" ? false : "")} style={{ ...inputSx, cursor: "pointer" }}><option value="">Selecione</option><option value="s">Sim</option><option value="n">Não</option></select>}
            {perg.tipo === "opcoes" && <select value={respostas[perg.id] || ""} onChange={e => setR(perg.id, e.target.value)} style={{ ...inputSx, cursor: "pointer", marginTop: 6 }}><option value="">Selecione</option>{perg.opcoes.map(o => <option key={o} value={o}>{o}</option>)}</select>}
            {perg.tipo === "opcoesOutro" && <div style={{ marginTop: 6 }}><select value={respostas[perg.id]?.valor || ""} onChange={e => setR(perg.id, { valor: e.target.value, detalhe: "" })} style={{ ...inputSx, cursor: "pointer" }}><option value="">Selecione</option>{perg.opcoes.map(o => <option key={o} value={o}>{o}</option>)}</select>{respostas[perg.id]?.valor === "Outro" && <div style={{ marginTop: 8 }}><Input value={respostas[perg.id]?.detalhe || ""} onChange={v => setR(perg.id, { ...respostas[perg.id], detalhe: v })} placeholder="Descreva..." /></div>}</div>}
            {perg.tipo === "simNaoTexto" && <div style={{ marginTop: 6 }}><select value={respostas[perg.id]?.ativo === true ? "s" : respostas[perg.id]?.ativo === false ? "n" : ""} onChange={e => { if (e.target.value === "s") setR(perg.id, { ...respostas[perg.id], ativo: true }); else if (e.target.value === "n") setR(perg.id, { ativo: false }); }} style={{ ...inputSx, cursor: "pointer" }}><option value="">Selecione</option><option value="s">Sim</option><option value="n">Não</option></select>{respostas[perg.id]?.ativo && <div style={{ marginTop: 8 }}><Input value={respostas[perg.id]?.detalhe || ""} onChange={v => setR(perg.id, { ...respostas[perg.id], detalhe: v })} placeholder={perg.placeholder} /></div>}</div>}
            {(perg.tipo === "multiOpcoes" || perg.tipo === "multiOpcoesOutro") && (() => { const cur = perg.tipo === "multiOpcoesOutro" ? (respostas[perg.id]?.opcoes || []) : (respostas[perg.id] || []); const opcoesSemTodos = perg.opcoes.filter(o => o !== "Todos" && o !== "Outro"); const aberto = dropdownAberto === perg.id; const allSel = cur.length >= opcoesSemTodos.length; const display = allSel && perg.opcoes.includes("Todos") ? "Todos" : cur.length ? cur.join(", ") + (perg.tipo === "multiOpcoesOutro" && respostas[perg.id]?.outroTexto ? `, ${respostas[perg.id].outroTexto}` : "") : "Selecione"; return (<div style={{ marginTop: 6, position: "relative" }}><div onClick={() => setDropdownAberto(aberto ? null : perg.id)} style={{ ...inputSx, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: cur.length ? C.txt : C.txtLight }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display}</span><span style={{ fontSize: "0.7rem", color: C.txtSec, transform: aberto ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span></div>{aberto && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "#fff", border: `1.5px solid ${C.accent}`, borderRadius: 12, marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto" }}>{perg.opcoes.map(op => { const isAll = op === "Todos"; const isOutro = op === "Outro"; const isActive = isAll ? allSel : isOutro ? cur.includes("Outro") : cur.includes(op); return (<div key={op} onClick={() => { if (perg.tipo === "multiOpcoesOutro") { const prev = respostas[perg.id] || { opcoes: [], outroTexto: "" }; if (isAll) { setR(perg.id, { ...prev, opcoes: allSel ? [] : [...opcoesSemTodos] }); } else { const nOps = prev.opcoes.includes(op) ? prev.opcoes.filter(x => x !== op) : [...prev.opcoes, op]; setR(perg.id, { ...prev, opcoes: nOps }); } } else { if (isAll) { setR(perg.id, allSel ? [] : [...opcoesSemTodos]); } else { setR(perg.id, cur.includes(op) ? cur.filter(x => x !== op) : [...cur, op]); } } }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${C.border}`, background: isActive ? C.accentLt : "#fff" }}><div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isActive ? C.accent : C.inBor}`, background: isActive ? C.accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{isActive && <span style={{ color: "#fff", fontSize: "0.7rem", fontWeight: 900 }}>✓</span>}</div><span style={{ fontSize: "0.84rem", fontWeight: isActive ? 600 : 400, color: isActive ? C.accent : C.txt }}>{op}</span></div>); })}</div>}{perg.tipo === "multiOpcoesOutro" && (respostas[perg.id]?.opcoes || []).includes("Outro") && <div style={{ marginTop: 8 }}><Input value={respostas[perg.id]?.outroTexto || ""} onChange={v => setR(perg.id, { ...respostas[perg.id], outroTexto: v })} placeholder="Descreva..." /></div>}</div>); })()}
            {perg.tipo === "horarioSemanal" && (() => { const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]; const h = respostas[perg.id] || {}; const hrs = ["08h às 17h", "09h às 18h", "10h às 19h", "Fechado", "Personalizado"]; return (<div style={{ marginTop: 8 }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{dias.map(dia => (<div key={dia} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fff", borderRadius: 10, border: `1px solid ${h[dia] ? C.accent : C.border}` }}><span style={{ minWidth: 65, fontSize: "0.82rem", fontWeight: 600 }}>{dia}</span><select value={h[dia] || ""} onChange={e => setR(perg.id, { ...h, [dia]: e.target.value })} style={{ ...inputSx, padding: "8px 10px", fontSize: "0.8rem", cursor: "pointer" }}><option value="">Selecione</option>{hrs.map(hr => <option key={hr} value={hr}>{hr}</option>)}</select></div>))}</div>{Object.values(h).includes("Personalizado") && <div style={{ marginTop: 8 }}><Input value={h._custom || ""} onChange={v => setR(perg.id, { ...h, _custom: v })} placeholder="Informe o horário personalizado" /></div>}</div>); })()}
          </div>
        ))}
      </Card>
    </>
  );

  const renderStep1 = () => (
    <>
      <Card title="Estilo de Comunicação">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FG><Label>Tom de Voz</Label><Select value={tomVoz} onChange={setTomVoz} options={[{ value: "profissional", label: "Profissional" }, { value: "amigavel", label: "Amigável" }, { value: "tecnico", label: "Técnico" }, { value: "casual", label: "Casual" }, { value: "formal", label: "Formal" }, { value: "empatico", label: "Empático" }]} /></FG>
          <FG><Label>Idioma</Label><Select value={idioma} onChange={setIdioma} options={[{ value: "Português Brasileiro", label: "Português (BR)" }, { value: "Inglês", label: "Inglês" }, { value: "Espanhol", label: "Espanhol" }]} /></FG>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <FG><Label>Estilo</Label><Select value={estiloResposta} onChange={setEstiloResposta} options={[{ value: "consultivo", label: "Consultivo" }, { value: "direto", label: "Direto" }, { value: "explicativo", label: "Explicativo" }, { value: "vendedor", label: "Vendedor" }]} /></FG>
          <FG><Label>Formalidade</Label><Select value={nivelFormalidade} onChange={setNivelFormalidade} options={[{ value: "formal", label: "Formal" }, { value: "semi-formal", label: "Semi-formal" }, { value: "informal", label: "Informal" }]} /></FG>
          <FG><Label>Emojis</Label><Select value={usaEmojis} onChange={setUsaEmojis} options={[{ value: "nenhum", label: "Nenhum" }, { value: "moderado", label: "Moderado" }, { value: "frequente", label: "Frequente" }]} /></FG>
        </div>
      </Card>
      <Card title="Mensagens Padrão">
        <FG><Label sub="Primeira mensagem da IA">Cumprimento</Label><TextArea value={cumprimentoInicial} onChange={setCumprimentoInicial} placeholder={`Ex: Olá! 😊 Eu sou ${nomeIA || "o assistente"} da ${nomeEmpresa || "empresa"}. Qual o seu nome?`} rows={2} /></FG>
        <FG><Label sub="Mensagem final">Encerramento</Label><TextArea value={mensagemEncerramento} onChange={setMensagemEncerramento} placeholder="Ex: Foi um prazer! Se precisar, estou por aqui. 😊" rows={2} /></FG>
      </Card>
      <Card title="🚫 Proibições Absolutas">
        <p style={{ color: C.txtSec, fontSize: "0.82rem", marginBottom: 10 }}>Regras que a IA NUNCA deve quebrar:</p>
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>{proibicoes.map((p, i) => <Chip key={i} onRemove={() => setProibicoes(proibicoes.filter((_, j) => j !== i))}>{p}</Chip>)}</div>
        <AddRow value={novaProibicao} onChange={setNovaProibicao} onAdd={() => addItem(proibicoes, setProibicoes, novaProibicao, setNovaProibicao)} placeholder="Nova proibição..." />
      </Card>
      <Card title="✅ Comportamentos Corretos">
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>{comportamentos.map((c, i) => <Chip key={i} onRemove={() => setComportamentos(comportamentos.filter((_, j) => j !== i))}>{c}</Chip>)}</div>
        <AddRow value={novoComportamento} onChange={setNovoComportamento} onAdd={() => addItem(comportamentos, setComportamentos, novoComportamento, setNovoComportamento)} placeholder="Novo comportamento..." />
      </Card>
    </>
  );

  const renderStep2 = () => (
    <>
      <Card title="Base de Conhecimento">
        <FG><Label sub="Cole informações sobre produtos, serviços, preços, políticas">Conteúdo</Label><TextArea value={baseConhecimento} onChange={setBaseConhecimento} placeholder="Cole aqui as informações da empresa. Tudo aqui vira conhecimento da IA." rows={6} /></FG>
        <FG><Label sub="Arquivos .txt e .csv são lidos automaticamente. PDFs e outros ficam como referência.">Anexar Arquivos</Label>
          <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => { const i = document.createElement("input"); i.type = "file"; i.multiple = true; i.accept = ".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"; i.onchange = e => handleFiles(e.target.files); i.click(); }}
            style={{ border: `2px dashed ${dragOver ? C.accent : C.inBor}`, borderRadius: 12, padding: "24px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? C.accentLt : "#fff" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>📁</div>
            <p style={{ color: C.txtSec, fontWeight: 600, fontSize: "0.86rem", margin: "0 0 4px" }}>{dragOver ? "Solte aqui!" : "Arraste ou clique para selecionar"}</p>
            <p style={{ color: C.txtLight, fontSize: "0.72rem", margin: 0 }}>PDF, DOC, TXT, CSV, XLS — máx 10MB</p>
          </div>
          {arquivos.length > 0 && <div style={{ marginTop: 10 }}>{arquivos.map((a, i) => (<div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 4 }}><span style={{ fontSize: "0.84rem" }}>📄 {a.name} <span style={{ color: C.txtSec, fontSize: "0.72rem" }}>({fmtSize(a.size)})</span> {a.status === "lido" ? <span style={{ color: C.accent, fontSize: "0.7rem", fontWeight: 600 }}>✓ Extraído</span> : a.status === "processando" ? <span style={{ color: "#E67E22", fontSize: "0.7rem", fontWeight: 600 }}>⏳ Extraindo texto...</span> : a.status === "erro" ? <span style={{ color: C.danger, fontSize: "0.7rem", fontWeight: 600 }}>⚠️ Erro</span> : <span style={{ color: C.txtLight, fontSize: "0.7rem" }}>Referência</span>}</span><button onClick={e => { e.stopPropagation(); removeArquivo(i); }} style={{ background: C.dangerLt, border: "none", borderRadius: 6, color: C.danger, cursor: "pointer", padding: "4px 8px", fontWeight: 700 }}>✕</button></div>))}</div>}
          {extraindoPDF && <p style={{ color: "#E67E22", fontSize: "0.8rem", marginTop: 8, fontWeight: 600 }}>⏳ Extraindo texto do PDF com IA... Aguarde.</p>}
        </FG>
      </Card>
      <Card title="Glossário">
        {glossario.map((g, i) => (<div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8, marginBottom: 8 }}><Input value={g.termo} onChange={v => { const n = [...glossario]; n[i].termo = v; setGlossario(n); }} placeholder="Termo" /><Input value={g.definicao} onChange={v => { const n = [...glossario]; n[i].definicao = v; setGlossario(n); }} placeholder="Definição" /><button onClick={() => setGlossario(glossario.filter((_, j) => j !== i))} style={{ background: C.dangerLt, border: "none", borderRadius: 10, color: C.danger, cursor: "pointer", padding: "8px 12px" }}>✕</button></div>))}
        <button onClick={() => setGlossario([...glossario, { termo: "", definicao: "" }])} style={{ padding: "8px 16px", background: "transparent", border: `1.5px dashed ${C.accent}`, borderRadius: 10, color: C.accent, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>+ Termo</button>
      </Card>
      <Card title="FAQ">
        {faq.map((f, i) => (<div key={i} style={{ marginBottom: 12, padding: 12, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: C.accent, fontWeight: 600, fontSize: "0.8rem" }}>#{i + 1}</span><button onClick={() => setFaq(faq.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer" }}>✕</button></div><FG><Input value={f.pergunta} onChange={v => { const n = [...faq]; n[i].pergunta = v; setFaq(n); }} placeholder="Pergunta" /></FG><TextArea value={f.resposta} onChange={v => { const n = [...faq]; n[i].resposta = v; setFaq(n); }} placeholder="Resposta" rows={2} /></div>))}
        <button onClick={() => setFaq([...faq, { pergunta: "", resposta: "" }])} style={{ padding: "8px 16px", background: "transparent", border: `1.5px dashed ${C.accent}`, borderRadius: 10, color: C.accent, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>+ FAQ</button>
      </Card>
    </>
  );

  const renderStep3 = () => (
    <>
      <Card title="⚡ Fluxo de Atendimento">
        {gerandoFluxo ? (
          <div style={{ textAlign: "center", padding: "30px" }}><div style={{ fontSize: "2rem", marginBottom: 12 }}>⏳</div><p style={{ color: C.txtSec }}>Gerando fluxo personalizado para <strong>{nomeEmpresa}</strong>...</p></div>
        ) : fluxoGerado ? (
          <>
            <p style={{ color: C.txtSec, fontSize: "0.82rem", marginBottom: 14 }}>Fluxo personalizado para {nomeEmpresa}. Edite como quiser:</p>
            {etapasFluxo.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, padding: 12, background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.accent}` }}>
                <div style={{ minWidth: 28, height: 28, borderRadius: "50%", background: C.accentLt, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.78rem", marginTop: 4 }}>{i + 1}</div>
                <div style={{ flex: 1 }}><FG><Input value={e.nome} onChange={v => { const n = [...etapasFluxo]; n[i].nome = v; setEtapasFluxo(n); }} placeholder="Etapa" /></FG><TextArea value={e.descricao} onChange={v => { const n = [...etapasFluxo]; n[i].descricao = v; setEtapasFluxo(n); }} placeholder="Descrição..." rows={2} /></div>
                <button onClick={() => setEtapasFluxo(etapasFluxo.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", marginTop: 4 }}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEtapasFluxo([...etapasFluxo, { nome: "", descricao: "" }])} style={{ flex: 1, padding: "10px", background: "transparent", border: `1.5px dashed ${C.accent}`, borderRadius: 10, color: C.accent, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>+ Etapa</button>
              <button onClick={() => { setFluxoGerado(false); setEtapasFluxo([]); gerarFluxoIA(); }} style={{ padding: "10px 16px", background: "transparent", border: `1.5px solid ${C.inBor}`, borderRadius: 10, color: C.txtSec, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>🔄 Regerar</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <p style={{ color: C.txtSec, fontSize: "0.88rem", marginBottom: 16 }}>Preencha os dados da empresa na etapa 1 para gerar o fluxo automaticamente.</p>
            <button onClick={gerarFluxoIA} style={{ padding: "14px 32px", background: C.accentGrad, border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem" }}>⚡ Gerar Fluxo</button>
          </div>
        )}
      </Card>

      <Card title="💬 Estilo de Interação">
        {gerandoInteracoes ? (
          <div style={{ textAlign: "center", padding: "30px" }}><div style={{ fontSize: "2rem", marginBottom: 12 }}>⏳</div><p style={{ color: C.txtSec }}>Criando exemplos de interação para <strong>{nomeEmpresa}</strong>...</p></div>
        ) : interacoes.length > 0 ? (
          <>
            <p style={{ color: C.txtSec, fontSize: "0.82rem", marginBottom: 16 }}>Escolha o estilo que mais combina com {nomeEmpresa}:</p>
            {interacoes.map(inter => (
              <div key={inter.id} onClick={() => setInteracaoEscolhida(inter.id)} style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden", border: `2px solid ${interacaoEscolhida === inter.id ? C.accent : C.border}`, cursor: "pointer", transition: "all .2s", boxShadow: interacaoEscolhida === inter.id ? `0 0 0 3px ${C.accentLt}` : "none" }}>
                <div style={{ padding: "14px 18px", background: interacaoEscolhida === inter.id ? C.accentLt : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: interacaoEscolhida === inter.id ? C.accent : C.txt }}>{inter.titulo}</h4><p style={{ margin: "3px 0 0", fontSize: "0.8rem", color: C.txtSec }}>{inter.descricao}</p></div>
                  {interacaoEscolhida === inter.id && <span style={{ background: C.accent, color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700 }}>✓ Selecionado</span>}
                </div>
                <div style={{ padding: "14px 18px", background: interacaoEscolhida === inter.id ? "#F1F8E9" : C.bg }}>
                  {(inter.conversa || []).map((msg, j) => <ChatBubble key={j} de={msg.de} msg={msg.msg} />)}
                </div>
              </div>
            ))}
            <button onClick={() => { setInteracoes([]); setInteracaoEscolhida(null); gerarInteracoesIA(); }} style={{ padding: "10px 16px", background: "transparent", border: `1.5px solid ${C.inBor}`, borderRadius: 10, color: C.txtSec, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", width: "100%" }}>🔄 Gerar Novos Exemplos</button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <p style={{ color: C.txtSec, fontSize: "0.88rem", marginBottom: 16 }}>Preencha os dados da empresa para gerar interações automaticamente.</p>
            <button onClick={gerarInteracoesIA} style={{ padding: "14px 32px", background: C.accentGrad, border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem" }}>💬 Gerar Interações</button>
          </div>
        )}
      </Card>
    </>
  );

  const renderStep4 = () => (
    <>
      <Card title="🔀 Transferência">
        <div style={{ marginBottom: 16 }}><ToggleBtn active={habilitaTransferencia} onClick={() => setHabilitaTransferencia(!habilitaTransferencia)}>{habilitaTransferencia ? "✓ Habilitado" : "Desabilitado"}</ToggleBtn></div>
        {habilitaTransferencia && (<>
          <FG><Label>Setores</Label><div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>{SETORES_PADRAO.map(s => <ToggleBtn key={s} active={setoresEscolhidos.includes(s)} onClick={() => toggleSetor(s)}>{s}</ToggleBtn>)}</div>{setoresCustom.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>{setoresCustom.map(s => <div key={s} style={{ display: "flex" }}><ToggleBtn active={setoresEscolhidos.includes(s)} onClick={() => toggleSetor(s)}>{s}</ToggleBtn><button onClick={() => removeSetorCustom(s)} style={{ padding: "8px 10px", background: C.dangerLt, border: "none", borderRadius: "0 10px 10px 0", color: C.danger, cursor: "pointer", fontWeight: 700 }}>✕</button></div>)}</div>}<div style={{ display: "flex", gap: 8, marginTop: 10 }}><Input value={novoSetor} onChange={setNovoSetor} placeholder="Setor personalizado..." /><button onClick={addSetorCustom} style={{ padding: "10px 18px", background: C.accentGrad, border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}>+ Setor</button></div></FG>
          <FG><Label>Mensagem</Label><TextArea value={mensagemTransferencia} onChange={setMensagemTransferencia} placeholder="Ex: Vou transferir o seu atendimento para um dos nossos especialistas!" rows={2} /></FG>
          <FG><Label>Dados Enviados</Label><div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>{infosTransferencia.map((inf, j) => <Chip key={j} onRemove={() => setInfosTransferencia(infosTransferencia.filter((_, k) => k !== j))}>{inf}</Chip>)}</div><AddRow value={novaInfo} onChange={setNovaInfo} onAdd={() => addItem(infosTransferencia, setInfosTransferencia, novaInfo, setNovaInfo)} placeholder="Ex: Nº do pedido..." /></FG>
        </>)}
      </Card>
      <Card title="📥 Capacidades de Entrada">
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>{[{ key: "audio", icon: "🎙️", label: "Áudios" }, { key: "imagem", icon: "🖼️", label: "Imagens" }, { key: "documento", icon: "📄", label: "Documentos" }].map(f => (<button key={f.key} onClick={() => toggleEntrada(f.key)} style={{ flex: 1, padding: 16, background: entradas.includes(f.key) ? C.accentLt : "#fff", border: `2px solid ${entradas.includes(f.key) ? C.accent : C.inBor}`, borderRadius: 14, color: entradas.includes(f.key) ? C.accent : C.txtSec, cursor: "pointer", textAlign: "center" }}><div style={{ fontSize: "1.8rem", marginBottom: 6 }}>{f.icon}</div><div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{f.label}</div></button>))}</div>
        {entradas.includes("audio") && <FG><Label>Instruções Áudio</Label><TextArea value={instrucaoAudio} onChange={setInstrucaoAudio} placeholder="Ex: Se a transcrição vier confusa, peça para o cliente digitar..." rows={2} /></FG>}
        {entradas.includes("imagem") && <FG><Label>Instruções Imagem</Label><TextArea value={instrucaoImagem} onChange={setInstrucaoImagem} placeholder="Instruções..." rows={2} /></FG>}
        {entradas.includes("documento") && <FG><Label>Instruções Documento</Label><TextArea value={instrucaoDocumento} onChange={setInstrucaoDocumento} placeholder="Instruções..." rows={2} /></FG>}
      </Card>
    </>
  );

  const renderStep5 = () => (
    <>
      <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 14, padding: 16, marginBottom: 20, display: "flex", gap: 12 }}><span style={{ fontSize: "1.3rem" }}>⚠️</span><div><p style={{ color: "#92400E", fontWeight: 700, margin: "0 0 4px" }}>Revise antes de enviar</p><p style={{ color: "#A16207", margin: 0, fontSize: "0.82rem" }}>Após confirmar, o prompt será enviado para a equipe.</p></div></div>
      <Card title="👤 Identidade"><ReviewRow label="Nome" value={nomeCliente} empty={!nomeCliente} /><ReviewRow label="Email" value={emailCliente} empty={!emailCliente} /><ReviewRow label="IA" value={nomeIA} empty={!nomeIA} /><ReviewRow label="Empresa" value={nomeEmpresa} empty={!nomeEmpresa} /><ReviewRow label="Tipo" value={funcaoIA} /></Card>
      <Card title="🎭 Personalidade"><ReviewRow label="Tom" value={tomVoz} /><ReviewRow label="Estilo" value={estiloResposta} /><ReviewRow label="Emojis" value={usaEmojis} /></Card>
      <Card title="📋 Regras"><ReviewRow label="Proibições" value={`${proibicoes.length} regra(s)`} /><ReviewRow label="Comportamentos" value={`${comportamentos.length} item(s)`} /></Card>
      <Card title="📚 Conhecimento"><ReviewRow label="Base" value={baseConhecimento ? "Preenchido" : ""} empty={!baseConhecimento && !arquivosTexto.length} /><ReviewRow label="Arquivos" value={arquivos.length ? arquivos.map(a => a.name).join(", ") : "Nenhum"} /></Card>
      <Card title="🔄 Fluxo"><ReviewRow label="Etapas" value={etapasFluxo.filter(e => e.nome).map(e => e.nome).join(" → ")} empty={!etapasFluxo.length} /></Card>
      <Card title="💬 Interação"><ReviewRow label="Estilo" value={interacaoEscolhida ? interacoes.find(i => i.id === interacaoEscolhida)?.titulo : "Não selecionado"} /></Card>
      <Card title="⚙️ Config"><ReviewRow label="Transferência" value={habilitaTransferencia ? `Sim (${setoresEscolhidos.join(", ") || "nenhum"})` : "Não"} /><ReviewRow label="Capacidades" value={entradas.length ? entradas.join(", ") : "Somente texto"} /></Card>
      <div style={{ marginTop: 24, textAlign: "center" }}><button onClick={handleSubmit} disabled={isSubmitting} style={{ padding: "16px 48px", background: isSubmitting ? C.txtSec : C.accentGrad, border: "none", borderRadius: 14, color: "#fff", cursor: isSubmitting ? "wait" : "pointer", fontWeight: 800, fontSize: "1.05rem", boxShadow: "0 4px 20px rgba(61,163,73,0.3)" }}>{isSubmitting ? (gerandoPrompt ? "⏳ Gerando prompt com IA..." : "📤 Enviando...") : "✅ Confirmar e Gerar Prompt"}</button></div>
    </>
  );

  const renderConcluido = () => (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ width: 100, height: 100, borderRadius: "50%", background: C.successLt, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "3rem" }}>✅</div>
      <h2 style={{ color: C.txt, fontWeight: 800, fontSize: "1.5rem", marginBottom: 8 }}>Prompt Gerado com Sucesso!</h2>
      <p style={{ color: C.txtSec, fontSize: "1rem", maxWidth: 480, margin: "0 auto 30px", lineHeight: 1.6 }}>Em breve entraremos em contato para finalizar.</p>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 400, margin: "0 auto", textAlign: "left" }}>
        <h4 style={{ color: C.accent, fontWeight: 700, marginTop: 0, marginBottom: 14 }}>Próximos passos:</h4>
        {["Revisaremos suas informações", "Configuraremos na plataforma", "Adicionaremos os IDs de transferência", "Você receberá acesso para testar"].map((s, i) => (<div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}><div style={{ minWidth: 24, height: 24, borderRadius: "50%", background: C.accentLt, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.7rem" }}>{i + 1}</div><span style={{ fontSize: "0.86rem" }}>{s}</span></div>))}
      </div>
    </div>
  );

  const renderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderConcluido];
  const isReview = step === STEPS.length - 2;
  const isFinal = step === STEPS.length - 1;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.txt, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ background: "#fff", padding: "18px 32px", borderBottom: `2px solid ${C.border}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/logo.png" alt="DeskRio" style={{ height: 38 }} onError={e => { e.target.onerror = null; e.target.style.display = "none"; document.getElementById("logo-fallback").style.display = "inline"; }} />
          <span id="logo-fallback" style={{ display: "none", fontSize: "1.5rem", fontWeight: 800, color: C.accent }}>DeskRio</span>
          <span style={{ color: "#ccc", fontSize: "1.3rem" }}>|</span>
          <span style={{ color: "#555", fontSize: "0.95rem", fontWeight: 600 }}>Configurador de IA</span>
        </div>
      </div>
      {!isFinal && (<div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "10px 32px", overflowX: "auto" }}><div style={{ maxWidth: 960, margin: "0 auto", display: "flex", gap: 4 }}>{STEPS.filter((_, i) => i < STEPS.length - 1).map((s, i) => { const isA = i === step; const isD = i < step; return (<button key={s.id} onClick={() => !submitted && setStep(i)} style={{ flex: 1, padding: "8px 6px", background: isA ? C.accent : isD ? C.accentLt : "transparent", border: "none", borderRadius: 10, color: isA ? "#fff" : isD ? C.accent : C.txtLight, cursor: submitted ? "default" : "pointer", textAlign: "center", fontSize: "0.68rem", fontWeight: isA ? 700 : 500, whiteSpace: "nowrap" }}><span style={{ fontSize: "0.95rem", display: "block", marginBottom: 1 }}>{isD ? "✓" : s.icon}</span>{s.label}</button>); })}</div></div>)}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isFinal ? "24px 32px" : "24px 32px 120px", position: "relative" }}>
        {step === 0 && <img src="/mascotes.png" alt="" style={{ position: "fixed", right: -20, bottom: 70, width: 200, opacity: 0.85, pointerEvents: "none", zIndex: 0 }} onError={e => { e.target.style.display = "none"; }} />}
        {!isFinal && (<div style={{ marginBottom: 20, position: "relative", zIndex: 1 }}><h2 style={{ color: C.txt, fontWeight: 700, fontSize: "1.15rem", margin: 0 }}>{STEPS[step].icon} {STEPS[step].label}</h2><div style={{ height: 4, background: C.border, borderRadius: 4, marginTop: 10, overflow: "hidden" }}><div style={{ height: "100%", width: `${((step + 1) / (STEPS.length - 1)) * 100}%`, background: C.accentGrad, borderRadius: 4, transition: "width .4s" }} /></div></div>)}
        <div style={{ position: "relative", zIndex: 1 }}>{renderers[step]()}</div>
      </div>
      {!isFinal && (<div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: `1px solid ${C.border}`, padding: "12px 32px", zIndex: 10 }}><div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}><button onClick={() => setStep(s => Math.max(s - 1, 0))} disabled={step === 0} style={{ padding: "10px 24px", background: step === 0 ? C.bg : "#fff", border: `1.5px solid ${C.inBor}`, borderRadius: 10, color: step === 0 ? C.inBor : C.txt, cursor: step === 0 ? "not-allowed" : "pointer", fontWeight: 600 }}>← Anterior</button><span style={{ color: C.txtSec, fontSize: "0.82rem" }}>{step + 1} de {STEPS.length - 1}</span>{!isReview && <button onClick={() => setStep(s => Math.min(s + 1, STEPS.length - 1))} style={{ padding: "10px 24px", background: C.accentGrad, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>Próximo →</button>}{isReview && <div />}</div></div>)}
    </div>
  );
}
