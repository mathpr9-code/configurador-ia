import { useState, memo, useRef } from "react";

// ─── CONFIG ───
const GEMINI_API_KEY = "AIzaSyAZQNi8kxv1XpNu50E4DoloXglmAByfmNM";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
const N8N_WEBHOOK_URL = "https://n8n-matheus.riochat.com.br/webhook/prompt";

// ─── 6 STEPS ───
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
  { id: "comoCompra", pergunta: "Como o cliente compra ou contrata seus serviços?", tipo: "opcoesOutro", opcoes: ["Pelo WhatsApp", "Pelo site/loja virtual", "Presencialmente", "Por telefone", "Por agendamento online", "Pela rede social", "Outro"] },
  { id: "horario", pergunta: "Horário de atendimento:", tipo: "horarioSemanal" },
  { id: "formasPagamento", pergunta: "Formas de pagamento aceitas:", tipo: "multiOpcoes", opcoes: ["Pix", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Link de Pagamento", "Dinheiro", "Todos"] },
  { id: "entrega", pergunta: "Como o cliente recebe o produto/serviço?", tipo: "opcoesOutro", opcoes: ["Entrega", "Retirada no local", "Entrega e retirada", "Online/Remoto", "Atendimento presencial", "Outro"] },
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
  dark: "#1C2B1C",
};

const inputSx = { width: "100%", padding: "12px 16px", background: C.inBg, border: `1.5px solid ${C.inBor}`, borderRadius: 12, color: C.txt, fontSize: "0.9rem", outline: "none", boxSizing: "border-box", transition: "border-color .2s, box-shadow .2s", fontFamily: "'DM Sans', sans-serif" };
const focusStyle = (e, on) => { e.target.style.borderColor = on ? C.accent : C.inBor; e.target.style.boxShadow = on ? `0 0 0 3px ${C.accentLt}` : "none"; };

// ─── UI COMPONENTS ───
const Label = memo(({ children, sub }) => (<label style={{ display: "block", marginBottom: 6 }}><span style={{ color: C.txt, fontWeight: 600, fontSize: "0.9rem" }}>{children}</span>{sub && <span style={{ color: C.txtSec, fontSize: "0.78rem", display: "block", marginTop: 2 }}>{sub}</span>}</label>));
const Input = memo(({ value, onChange, placeholder, ...props }) => (<input defaultValue={value} onBlur={(e) => { onChange(e.target.value); focusStyle(e, false); }} placeholder={placeholder} style={inputSx} onFocus={(e) => focusStyle(e, true)} {...props} />));
const TextArea = memo(({ value, onChange, placeholder, rows = 3 }) => (<textarea defaultValue={value} onBlur={(e) => { onChange(e.target.value); focusStyle(e, false); }} placeholder={placeholder} rows={rows} style={{ ...inputSx, resize: "vertical", fontFamily: "'DM Sans', sans-serif" }} onFocus={(e) => focusStyle(e, true)} />));
const Select = memo(({ value, onChange, options }) => (<select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputSx, cursor: "pointer" }}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>));
const Chip = memo(({ children, onRemove }) => (<span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: C.chipBg, borderRadius: 20, fontSize: "0.82rem", color: C.chipTxt, margin: 3, fontWeight: 600 }}>{children}{onRemove && <button onClick={onRemove} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", padding: 0, lineHeight: 1 }}>×</button>}</span>));
const Card = memo(({ title, children }) => (<div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>{title && <h3 style={{ color: C.accent, fontSize: "0.95rem", fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`, marginTop: 0 }}>{title}</h3>}{children}</div>));
const FG = ({ children }) => <div style={{ marginBottom: 16 }}>{children}</div>;
const ReviewRow = memo(({ label, value, empty }) => (<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}><span style={{ color: C.txtSec, fontSize: "0.84rem", fontWeight: 500, minWidth: 140 }}>{label}</span><span style={{ color: empty ? C.danger : C.txt, fontSize: "0.84rem", textAlign: "right", flex: 1, marginLeft: 16 }}>{empty ? "⚠️ Não preenchido" : value}</span></div>));
const ToggleBtn = memo(({ active, onClick, children, style: sx }) => (<button onClick={onClick} style={{ padding: "10px 20px", background: active ? C.accentGrad : "#fff", border: `2px solid ${active ? C.accent : C.inBor}`, borderRadius: 12, color: active ? "#fff" : C.txt, cursor: "pointer", fontWeight: 700, fontSize: "0.88rem", transition: "all .2s", ...sx }}>{children}</button>));
const AddRow = memo(({ value, onChange, onAdd, placeholder }) => { const ref = useRef(null); const handleAdd = () => { onAdd(); if (ref.current) ref.current.value = ""; }; return (<div style={{ display: "flex", gap: 8, marginTop: 8 }}><input defaultValue={value} onChange={(e) => onChange(e.target.value)} ref={ref} placeholder={placeholder} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} style={inputSx} onFocus={(e) => focusStyle(e, true)} onBlur={(e) => focusStyle(e, false)} /><button onClick={handleAdd} style={{ padding: "10px 18px", background: C.accentGrad, border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap", fontSize: "0.85rem" }}>+ Adicionar</button></div>); });

const ChatBubble = ({ de, msg }) => {
  const isC = de === "cliente";
  return (<div style={{ display: "flex", justifyContent: isC ? "flex-end" : "flex-start", marginBottom: 8 }}><div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: isC ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isC ? "#DCF8C6" : "#fff", border: isC ? "none" : `1px solid ${C.border}`, fontSize: "0.82rem", lineHeight: 1.5, color: C.txt, whiteSpace: "pre-wrap", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}><div style={{ fontSize: "0.68rem", fontWeight: 700, color: isC ? "#2E7D32" : C.accent, marginBottom: 4 }}>{isC ? "Cliente" : "IA"}</div>{msg}</div></div>);
};

// ─── GEMINI HELPER ───
async function callGemini(prompt) {
  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 4000 } }),
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (e) { console.error("Gemini error:", e); return ""; }
}

// ═══════════════════════════
//  MAIN
// ═══════════════════════════
export default function PromptGenerator() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  // IDENTIDADE
  const [nomeCliente, setNomeCliente] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [nomeIA, setNomeIA] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [funcaoIA, setFuncaoIA] = useState("atendimento");
  const [descricaoEmpresa, setDescricaoEmpresa] = useState("");
  const [respostas, setRespostas] = useState({});
  const setR = (id, val) => setRespostas((p) => ({ ...p, [id]: val }));

  // PERSONALIDADE + REGRAS
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

  // CONHECIMENTO
  const [glossario, setGlossario] = useState([{ termo: "", definicao: "" }]);
  const [baseConhecimento, setBaseConhecimento] = useState("");
  const [arquivos, setArquivos] = useState([]);
  const [arquivosTexto, setArquivosTexto] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [faq, setFaq] = useState([{ pergunta: "", resposta: "" }]);

  // FLUXO + INTERAÇÃO
  const [etapasFluxo, setEtapasFluxo] = useState([]);
  const [fluxoGerado, setFluxoGerado] = useState(false);
  const [gerandoFluxo, setGerandoFluxo] = useState(false);
  const [interacoes, setInteracoes] = useState([]);
  const [interacaoEscolhida, setInteracaoEscolhida] = useState(null);
  const [gerandoInteracoes, setGerandoInteracoes] = useState(false);

  // CONFIG
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

  // ─── CONTEXTO DA EMPRESA (usado pelo Gemini) ───
  const getContexto = () => {
    const rTxt = PERGUNTAS_EMPRESA.map(p => { const r = respostas[p.id]; if (!r || r === "") return null; if (p.tipo === "simNao") return `${p.pergunta} ${r ? "Sim" : "Não"}`; if (p.tipo === "simNaoTexto") return `${p.pergunta} ${r.ativo ? "Sim" + (r.detalhe ? ` - ${r.detalhe}` : "") : "Não"}`; if (p.tipo === "opcoes") return `${p.pergunta} ${r}`; if (p.tipo === "opcoesOutro") return r?.valor ? `${p.pergunta} ${r.valor}${r.valor === "Outro" && r.detalhe ? ` - ${r.detalhe}` : ""}` : null; if (p.tipo === "multiOpcoes") return Array.isArray(r) && r.length ? `${p.pergunta} ${r.join(", ")}` : null; if (p.tipo === "horarioSemanal") { const dias = Object.entries(r).filter(([k, v]) => k !== "_custom" && v).map(([k, v]) => `${k}: ${v === "Personalizado" ? (r._custom || "Personalizado") : v}`); return dias.length ? `${p.pergunta}\n${dias.join("\n")}` : null; } return `${p.pergunta} ${r}`; }).filter(Boolean).join("\n");
    return `Empresa: ${nomeEmpresa || "Não informado"}\nDescrição: ${descricaoEmpresa || "Não informado"}\nNome da IA: ${nomeIA || "Assistente"}\nTipo de IA: ${funcaoIA}\nTom de voz: ${tomVoz}\nEstilo: ${estiloResposta}\nEmojis: ${usaEmojis}\n\nInformações da empresa:\n${rTxt}\n\nBase de conhecimento:\n${baseConhecimento ? baseConhecimento.substring(0, 2000) : "Não informado"}\n${arquivosTexto.length ? "\nConteúdo dos arquivos:\n" + arquivosTexto.map(a => a.texto.substring(0, 1000)).join("\n---\n") : ""}`;
  };

  // ─── FILE HANDLING ───
  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        setArquivos((prev) => [...prev, { name: file.name, size: file.size, type: file.type, base64: e.target.result }]);
        // Para arquivos de texto, extrair conteúdo para base de conhecimento
        if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
          const textReader = new FileReader();
          textReader.onload = (ev) => setArquivosTexto(prev => [...prev, { name: file.name, texto: ev.target.result }]);
          textReader.readAsText(file);
        } else {
          setArquivosTexto(prev => [...prev, { name: file.name, texto: `[Arquivo: ${file.name} - ${file.type} - ${(file.size / 1024).toFixed(1)}KB]` }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };
  const removeArquivo = (i) => { setArquivos(arquivos.filter((_, j) => j !== i)); setArquivosTexto(arquivosTexto.filter((_, j) => j !== i)); };

  // ─── IMPORTAR PROMPT XML ───
  const importarPrompt = () => {
    const txt = importText;
    const get = (tag) => { const m = txt.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`)); return m ? m[1].trim() : ""; };
    const getAll = (tag) => { const r = []; const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "g"); let m; while ((m = re.exec(txt)) !== null) r.push(m[1].trim()); return r; };

    if (get("nome_ia")) setNomeIA(get("nome_ia"));
    if (get("empresa")) setNomeEmpresa(get("empresa"));
    if (get("descricao_empresa")) setDescricaoEmpresa(get("descricao_empresa"));
    if (get("tom_de_voz")) setTomVoz(get("tom_de_voz"));
    if (get("idioma")) setIdioma(get("idioma"));
    if (get("estilo_resposta")) setEstiloResposta(get("estilo_resposta"));
    if (get("nivel_formalidade")) setNivelFormalidade(get("nivel_formalidade"));
    if (get("uso_emojis")) setUsaEmojis(get("uso_emojis"));
    if (get("cumprimento_inicial")) setCumprimentoInicial(get("cumprimento_inicial"));
    if (get("mensagem_encerramento")) setMensagemEncerramento(get("mensagem_encerramento"));
    if (get("base_de_conhecimento")) setBaseConhecimento(get("base_de_conhecimento"));

    const funcao = get("funcao");
    if (funcao.toLowerCase().includes("vend")) setFuncaoIA("vendas");
    else if (funcao.toLowerCase().includes("suporte")) setFuncaoIA("suporte");
    else setFuncaoIA("atendimento");

    const proibs = getAll("proibicao");
    if (proibs.length) setProibicoes(proibs);
    const comps = getAll("comportamento");
    if (comps.length) setComportamentos(comps);

    const perguntas = getAll("pergunta");
    const respostasF = getAll("resposta");
    if (perguntas.length && respostasF.length) setFaq(perguntas.map((p, i) => ({ pergunta: p, resposta: respostasF[i] || "" })));

    const etapas = txt.match(/<etapa[^>]*>[\s\S]*?<\/etapa>/g) || [];
    if (etapas.length) {
      setEtapasFluxo(etapas.map(e => ({ nome: get.call(null, "nome") || "", descricao: "" })));
      const parsed = etapas.map(e => {
        const nm = e.match(/<nome>([\s\S]*?)<\/nome>/); const dc = e.match(/<descricao>([\s\S]*?)<\/descricao>/);
        return { nome: nm ? nm[1].trim() : "", descricao: dc ? dc[1].trim() : "" };
      });
      setEtapasFluxo(parsed);
      setFluxoGerado(true);
    }

    setShowImport(false); setImportText("");
    alert("Prompt importado com sucesso! Revise os campos preenchidos.");
  };

  // ─── GERAR FLUXO COM GEMINI ───
  const gerarFluxoIA = async () => {
    setGerandoFluxo(true);
    const ctx = getContexto();
    const prompt = `Você é um especialista em criação de fluxos de atendimento para chatbots. Com base nas informações abaixo, gere um fluxo de atendimento personalizado para esta empresa.

${ctx}

Gere exatamente entre 4 e 7 etapas de fluxo. Cada etapa deve ser específica para o negócio desta empresa.

Responda APENAS em JSON válido, sem markdown, sem backticks, neste formato exato:
[{"nome":"Nome da etapa","descricao":"Descrição detalhada do que a IA deve fazer nesta etapa"}]

IMPORTANTE: As etapas devem ser específicas para o tipo de negócio. Por exemplo, para uma imobiliária, inclua etapas como "Identificar interesse no lote/imóvel", "Agendar visita", etc. Para um restaurante, inclua "Apresentar cardápio", "Anotar pedido", etc.`;

    const result = await callGemini(prompt);
    try {
      const clean = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) { setEtapasFluxo(parsed); setFluxoGerado(true); }
    } catch (e) {
      console.error("Parse error:", e);
      // Fallback genérico
      setEtapasFluxo([
        { nome: "Saudação", descricao: "Cumprimentar e se apresentar" },
        { nome: "Identificação", descricao: "Entender a necessidade do cliente" },
        { nome: "Atendimento", descricao: "Fornecer informações relevantes" },
        { nome: "Encerramento", descricao: "Finalizar ou transferir" },
      ]);
      setFluxoGerado(true);
    }
    setGerandoFluxo(false);
  };

  // ─── GERAR INTERAÇÕES COM GEMINI ───
  const gerarInteracoesIA = async () => {
    setGerandoInteracoes(true);
    const ctx = getContexto();
    const prompt = `Você é um especialista em design de conversas para chatbots. Com base nas informações da empresa abaixo, crie 3 exemplos DIFERENTES de estilos de interação.

${ctx}

Cada estilo deve mostrar uma conversa REALISTA entre um cliente e a IA "${nomeIA || "Assistente"}" da empresa "${nomeEmpresa || "Empresa"}".

As conversas devem ser sobre temas REAIS do negócio desta empresa (usando os produtos/serviços/informações reais da empresa).

Responda APENAS em JSON válido, sem markdown, sem backticks:
[{
  "id":"est1",
  "titulo":"Emoji + Nome do Estilo",
  "descricao":"Quando usar este estilo",
  "conversa":[
    {"de":"cliente","msg":"mensagem do cliente"},
    {"de":"ia","msg":"resposta da IA"},
    {"de":"cliente","msg":"mensagem do cliente"},
    {"de":"ia","msg":"resposta da IA"}
  ]
}]

REGRAS:
- Cada conversa deve ter entre 4 e 6 mensagens alternadas
- Use emojis de forma ${usaEmojis === "nenhum" ? "nenhuma" : usaEmojis}
- Tom: ${tomVoz}
- A IA deve se chamar "${nomeIA || "Assistente"}" e a empresa "${nomeEmpresa || "Empresa"}"
- Os 3 estilos devem ser: 1) Consultivo 2) Direto/Objetivo 3) Humanizado/Acolhedor
- As conversas devem tratar de situações REAIS que clientes desta empresa teriam`;

    const result = await callGemini(prompt);
    try {
      const clean = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length) setInteracoes(parsed);
    } catch (e) { console.error("Parse interacoes:", e); }
    setGerandoInteracoes(false);
  };

  // ─── GERAR PROMPT XML ───
  const gerarPrompt = () => {
    const rTxt = PERGUNTAS_EMPRESA.map(p => { const r = respostas[p.id]; if (!r || r === "") return null; if (p.tipo === "simNao") return `${p.pergunta} ${r ? "Sim" : "Não"}`; if (p.tipo === "simNaoTexto") return `${p.pergunta} ${r.ativo ? "Sim" + (r.detalhe ? ` - ${r.detalhe}` : "") : "Não"}`; if (p.tipo === "opcoesOutro") return r?.valor ? `${p.pergunta} ${r.valor}${r.valor === "Outro" && r.detalhe ? ` - ${r.detalhe}` : ""}` : null; if (p.tipo === "multiOpcoes") return Array.isArray(r) && r.length ? `${p.pergunta} ${r.join(", ")}` : null; if (p.tipo === "horarioSemanal") { const dias = Object.entries(r).filter(([k, v]) => k !== "_custom" && v).map(([k, v]) => `${k}: ${v === "Personalizado" ? (r._custom || "Personalizado") : v}`); return dias.length ? `${p.pergunta}\n    ${dias.join("\n    ")}` : null; } return `${p.pergunta} ${r}`; }).filter(Boolean).join("\n    ");
    const inter = interacaoEscolhida != null ? interacoes.find(i => i.id === interacaoEscolhida) : null;
    const baseCompleta = [baseConhecimento, ...arquivosTexto.map(a => `\n--- Arquivo: ${a.name} ---\n${a.texto}`)].filter(Boolean).join("\n");

    let p = `<identidade>\n  <nome_ia>${nomeIA || "Assistente Virtual"}</nome_ia>\n  <empresa>${nomeEmpresa || "Empresa"}</empresa>\n  <descricao_empresa>${descricaoEmpresa || "Descrição"}</descricao_empresa>\n  <funcao>${funcaoIA === "vendas" ? "Vendedor e qualificador de leads" : funcaoIA === "suporte" ? "Suporte técnico" : "Atendimento ao cliente"}</funcao>\n  <tom_de_voz>${tomVoz}</tom_de_voz>\n  <idioma>${idioma}</idioma>\n  <informacoes_empresa>\n    ${rTxt}\n  </informacoes_empresa>\n</identidade>\n\n`;
    p += `<personalidade>\n  <estilo_resposta>${estiloResposta}</estilo_resposta>\n  <nivel_formalidade>${nivelFormalidade}</nivel_formalidade>\n  <uso_emojis>${usaEmojis}</uso_emojis>\n  <cumprimento_inicial>${cumprimentoInicial || `Olá! Eu sou ${nomeIA || "o assistente"} da ${nomeEmpresa || "empresa"}. Como posso ajudar?`}</cumprimento_inicial>\n  <mensagem_encerramento>${mensagemEncerramento || "Foi um prazer atender você! Se precisar, estou por aqui. 😊"}</mensagem_encerramento>\n`;
    if (inter) p += `  <estilo_interacao>\n    <tipo>${inter.titulo}</tipo>\n    <descricao>${inter.descricao}</descricao>\n  </estilo_interacao>\n`;
    p += `</personalidade>\n\n`;
    p += `<regras>\n  <proibicoes_absolutas>\n${proibicoes.map(x => `    <proibicao>${x}</proibicao>`).join("\n")}\n  </proibicoes_absolutas>\n  <comportamento_correto>\n${comportamentos.map(x => `    <comportamento>${x}</comportamento>`).join("\n")}\n  </comportamento_correto>\n  <deteccao_primeira_interacao>\n    <instrucao>Na primeira mensagem, sempre cumprimente e se apresente.</instrucao>\n  </deteccao_primeira_interacao>\n  <correcao_ortografica>\n    <instrucao>Interprete erros, gírias e abreviações. Nunca corrija o cliente.</instrucao>\n  </correcao_ortografica>\n</regras>\n\n`;
    const gv = glossario.filter(g => g.termo && g.definicao);
    if (gv.length) p += `<glossario>\n${gv.map(g => `  <termo><palavra>${g.termo}</palavra><significado>${g.definicao}</significado></termo>`).join("\n")}\n</glossario>\n\n`;
    p += `<dados>\n  <base_de_conhecimento>\n${baseCompleta || "    [Informações da empresa]"}\n  </base_de_conhecimento>\n</dados>\n\n`;
    const fv = faq.filter(f => f.pergunta && f.resposta);
    if (fv.length) p += `<faq>\n${fv.map(f => `  <item><pergunta>${f.pergunta}</pergunta><resposta>${f.resposta}</resposta></item>`).join("\n")}\n</faq>\n\n`;
    p += `<fluxo_de_atendimento>\n${etapasFluxo.filter(e => e.nome).map((e, i) => `  <etapa ordem="${i + 1}"><nome>${e.nome}</nome><descricao>${e.descricao}</descricao></etapa>`).join("\n")}\n</fluxo_de_atendimento>\n\n`;
    p += `<formato_de_saida><formato>texto</formato><instrucao>Responda sempre em texto claro e objetivo.</instrucao></formato_de_saida>\n\n`;
    if (entradas.length) { p += `<capacidades_de_entrada>\n  <tipos_aceitos>${entradas.join(", ")}</tipos_aceitos>\n`; if (entradas.includes("audio")) p += `  <transcricao_audio><instrucao>${instrucaoAudio || "Transcreva e interprete áudios."}</instrucao></transcricao_audio>\n`; if (entradas.includes("imagem")) p += `  <interpretacao_imagem><instrucao>${instrucaoImagem || "Analise imagens enviadas."}</instrucao></interpretacao_imagem>\n`; if (entradas.includes("documento")) p += `  <leitura_documento><instrucao>${instrucaoDocumento || "Leia documentos enviados."}</instrucao></leitura_documento>\n`; p += `</capacidades_de_entrada>\n\n`; }
    if (habilitaTransferencia && setoresEscolhidos.length) { p += `<sistema_transferencia>\n`; setoresEscolhidos.forEach(s => { p += `  <etapa><acao_sistema><instrucao_transferencia>Para ${s}: "${mensagemTransferencia || `Vou transferir para ${s}. Um momento!`}"\nInfos: ${infosTransferencia.join(", ")}</instrucao_transferencia><destino>Tool "transferência" ID [ID_${s.toUpperCase().replace(/[^A-Z0-9]/g, "_")}]</destino></acao_sistema></etapa>\n`; }); p += `</sistema_transferencia>`; }
    return p;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const prompt = gerarPrompt();
    try { await fetch(N8N_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cliente: { nome: nomeCliente, email: emailCliente, telefone: telefoneCliente }, empresa: nomeEmpresa, nomeIA, descricaoEmpresa, funcaoIA, respostasEmpresa: respostas, interacaoEscolhida, setoresTransferencia: setoresEscolhidos, entradasHabilitadas: entradas, arquivos: arquivos.map(a => ({ name: a.name, size: a.size, type: a.type, base64: a.base64 })), promptXML: prompt, dataGeracao: new Date().toISOString() }) }); } catch (e) { console.error(e); }
    setIsSubmitting(false); setSubmitted(true); setStep(STEPS.length - 1);
  };

  // ═══════════════════════════
  //  STEP RENDERS
  // ═══════════════════════════

  const renderStep0 = () => (
    <>
      {/* IMPORT BUTTON */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowImport(!showImport)} style={{ padding: "8px 16px", background: showImport ? C.dangerLt : "#fff", border: `1.5px solid ${showImport ? C.danger : C.inBor}`, borderRadius: 10, color: showImport ? C.danger : C.txtSec, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
          {showImport ? "✕ Cancelar" : "📋 Importar Prompt Existente"}
        </button>
      </div>
      {showImport && (
        <Card title="📋 Importar Prompt XML">
          <p style={{ color: C.txtSec, fontSize: "0.82rem", marginBottom: 12 }}>Cole o prompt XML existente abaixo. Os campos serão preenchidos automaticamente para edição.</p>
          <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Cole o prompt XML aqui..." rows={8} style={{ ...inputSx, resize: "vertical", fontFamily: "monospace", fontSize: "0.8rem" }} />
          <button onClick={importarPrompt} disabled={!importText.trim()} style={{ marginTop: 12, padding: "12px 28px", background: importText.trim() ? C.accentGrad : C.border, border: "none", borderRadius: 12, color: "#fff", cursor: importText.trim() ? "pointer" : "not-allowed", fontWeight: 700 }}>⚡ Importar e Preencher Campos</button>
        </Card>
      )}
      <Card title="Seus Dados">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FG><Label>Seu Nome</Label><Input value={nomeCliente} onChange={setNomeCliente} placeholder="Seu nome completo" /></FG>
          <FG><Label>Seu E-mail</Label><Input value={emailCliente} onChange={setEmailCliente} placeholder="email@empresa.com" /></FG>
        </div>
        <FG><Label sub="Número com DDD">Telefone / WhatsApp</Label><Input value={telefoneCliente} onChange={setTelefoneCliente} placeholder="(11) 99999-9999" /></FG>
      </Card>
      <Card title="Dados da IA">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FG><Label>Nome da IA</Label><Input value={nomeIA} onChange={setNomeIA} placeholder="Ex: Luna, Max, Aria..." /></FG>
          <FG><Label>Nome da Empresa</Label><Input value={nomeEmpresa} onChange={setNomeEmpresa} placeholder="Ex: TechCorp Brasil" /></FG>
        </div>
        <FG><Label sub="Qual a principal função?">Tipo de IA</Label>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>{[{ v: "atendimento", l: "🎧 Atendimento" }, { v: "vendas", l: "💰 Vendas" }, { v: "suporte", l: "🔧 Suporte" }].map(t => (<ToggleBtn key={t.v} active={funcaoIA === t.v} onClick={() => setFuncaoIA(t.v)} style={{ flex: 1 }}>{t.l}</ToggleBtn>))}</div>
        </FG>
      </Card>
      <Card title="Informações da Empresa">
        <p style={{ color: C.txtSec, fontSize: "0.82rem", marginBottom: 16, lineHeight: 1.5 }}>Quanto mais detalhes, melhor a IA. Responda tudo que souber — essas respostas alimentam a inteligência do seu assistente.</p>
        {PERGUNTAS_EMPRESA.map(perg => (
          <div key={perg.id} style={{ marginBottom: 14, padding: 14, background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <Label>{perg.pergunta}</Label>
            {perg.tipo === "texto" && <Input value={respostas[perg.id] || ""} onChange={v => setR(perg.id, v)} placeholder={perg.placeholder} />}
            {perg.tipo === "simNao" && <div style={{ marginTop: 6 }}><select value={respostas[perg.id] === true ? "sim" : respostas[perg.id] === false ? "nao" : ""} onChange={e => setR(perg.id, e.target.value === "sim" ? true : e.target.value === "nao" ? false : "")} style={{ ...inputSx, cursor: "pointer" }}><option value="">Selecione</option><option value="sim">Sim</option><option value="nao">Não</option></select></div>}
            {perg.tipo === "opcoes" && <div style={{ marginTop: 6 }}><select value={respostas[perg.id] || ""} onChange={e => setR(perg.id, e.target.value)} style={{ ...inputSx, cursor: "pointer" }}><option value="">Selecione</option>{perg.opcoes.map(op => <option key={op} value={op}>{op}</option>)}</select></div>}
            {perg.tipo === "opcoesOutro" && <div style={{ marginTop: 6 }}><select value={respostas[perg.id]?.valor || ""} onChange={e => setR(perg.id, { valor: e.target.value, detalhe: "" })} style={{ ...inputSx, cursor: "pointer" }}><option value="">Selecione</option>{perg.opcoes.map(op => <option key={op} value={op}>{op}</option>)}</select>{respostas[perg.id]?.valor === "Outro" && <div style={{ marginTop: 8 }}><Input value={respostas[perg.id]?.detalhe || ""} onChange={v => setR(perg.id, { ...respostas[perg.id], detalhe: v })} placeholder="Descreva..." /></div>}</div>}
            {perg.tipo === "simNaoTexto" && <div style={{ marginTop: 6 }}><select value={respostas[perg.id]?.ativo === true ? "sim" : respostas[perg.id]?.ativo === false ? "nao" : ""} onChange={e => { if (e.target.value === "sim") setR(perg.id, { ...respostas[perg.id], ativo: true }); else if (e.target.value === "nao") setR(perg.id, { ativo: false }); else setR(perg.id, {}); }} style={{ ...inputSx, cursor: "pointer" }}><option value="">Selecione</option><option value="sim">Sim</option><option value="nao">Não</option></select>{respostas[perg.id]?.ativo && <div style={{ marginTop: 8 }}><Input value={respostas[perg.id]?.detalhe || ""} onChange={v => setR(perg.id, { ...respostas[perg.id], detalhe: v })} placeholder={perg.placeholder} /></div>}</div>}
            {perg.tipo === "multiOpcoes" && (() => { const sel = respostas[perg.id] || []; const opcoesSemTodos = perg.opcoes.filter(o => o !== "Todos"); const [aberto, setAberto] = useState(false); const allSelected = sel.length === opcoesSemTodos.length; const displayText = allSelected ? "Todos" : sel.length ? sel.join(", ") : "Selecione"; return (<div style={{ marginTop: 6, position: "relative" }}><div onClick={() => setAberto(!aberto)} style={{ ...inputSx, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: sel.length ? C.txt : C.txtLight }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayText}</span><span style={{ fontSize: "0.7rem", color: C.txtSec, transform: aberto ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span></div>{aberto && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "#fff", border: `1.5px solid ${C.accent}`, borderRadius: 12, marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 260, overflowY: "auto" }}>{perg.opcoes.map(op => { const isAll = op === "Todos"; const isActive = isAll ? allSelected : sel.includes(op); return (<div key={op} onClick={() => { if (isAll) { setR(perg.id, allSelected ? [] : [...opcoesSemTodos]); } else { setR(perg.id, sel.includes(op) ? sel.filter(x => x !== op) : [...sel, op]); } }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${C.border}`, background: isActive ? C.accentLt : "#fff", transition: "background .1s" }}><div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isActive ? C.accent : C.inBor}`, background: isActive ? C.accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{isActive && <span style={{ color: "#fff", fontSize: "0.7rem", fontWeight: 900 }}>✓</span>}</div><span style={{ fontSize: "0.84rem", fontWeight: isActive ? 600 : 400, color: isActive ? C.accent : C.txt }}>{op}</span></div>); })}</div>}</div>); })()}
            {perg.tipo === "horarioSemanal" && (() => { const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]; const h = respostas[perg.id] || {}; const horarios = ["08h às 17h", "09h às 18h", "10h às 19h", "Fechado", "Personalizado"]; return (<div style={{ marginTop: 8 }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{dias.map(dia => (<div key={dia} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fff", borderRadius: 10, border: `1px solid ${h[dia] ? C.accent : C.border}` }}><span style={{ minWidth: 65, fontSize: "0.82rem", fontWeight: 600, color: C.txt }}>{dia}</span><select value={h[dia] || ""} onChange={e => setR(perg.id, { ...h, [dia]: e.target.value })} style={{ ...inputSx, padding: "8px 10px", fontSize: "0.8rem", cursor: "pointer" }}><option value="">Selecione</option>{horarios.map(hr => <option key={hr} value={hr}>{hr}</option>)}</select></div>))}</div>{Object.values(h).includes("Personalizado") && <div style={{ marginTop: 8 }}><Input value={h._custom || ""} onChange={v => setR(perg.id, { ...h, _custom: v })} placeholder="Informe o horário personalizado" /></div>}</div>); })()}
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
          <FG><Label>Idioma</Label><Select value={idioma} onChange={setIdioma} options={[{ value: "Português Brasileiro", label: "Português (BR)" }, { value: "Inglês", label: "Inglês" }, { value: "Espanhol", label: "Espanhol" }, { value: "Português e Inglês", label: "PT + EN" }]} /></FG>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <FG><Label>Estilo</Label><Select value={estiloResposta} onChange={setEstiloResposta} options={[{ value: "consultivo", label: "Consultivo" }, { value: "direto", label: "Direto" }, { value: "explicativo", label: "Explicativo" }, { value: "vendedor", label: "Vendedor" }]} /></FG>
          <FG><Label>Formalidade</Label><Select value={nivelFormalidade} onChange={setNivelFormalidade} options={[{ value: "formal", label: "Formal" }, { value: "semi-formal", label: "Semi-formal" }, { value: "informal", label: "Informal" }]} /></FG>
          <FG><Label>Emojis</Label><Select value={usaEmojis} onChange={setUsaEmojis} options={[{ value: "nenhum", label: "Nenhum" }, { value: "moderado", label: "Moderado" }, { value: "frequente", label: "Frequente" }]} /></FG>
        </div>
      </Card>
      <Card title="Mensagens Padrão">
        <FG><Label sub="Primeira mensagem da IA">Cumprimento</Label><TextArea value={cumprimentoInicial} onChange={setCumprimentoInicial} placeholder={`Ex: Olá! Eu sou ${nomeIA || "o assistente"} da ${nomeEmpresa || "empresa"}. Como posso ajudar?`} rows={2} /></FG>
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
        <FG><Label sub="Cole informações sobre produtos, serviços, preços, políticas — OU arraste arquivos abaixo">Conteúdo</Label><TextArea value={baseConhecimento} onChange={setBaseConhecimento} placeholder="Cole aqui as informações da empresa. Tudo que estiver aqui, a IA vai saber responder." rows={6} /></FG>
        <FG><Label sub="Arquivos de texto (.txt, .csv) são lidos automaticamente e viram base de conhecimento">Anexar Arquivos</Label>
          <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => { const i = document.createElement("input"); i.type = "file"; i.multiple = true; i.accept = ".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"; i.onchange = e => handleFiles(e.target.files); i.click(); }}
            style={{ border: `2px dashed ${dragOver ? C.accent : C.inBor}`, borderRadius: 12, padding: "24px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? C.accentLt : "#fff" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>📁</div>
            <p style={{ color: C.txtSec, fontWeight: 600, fontSize: "0.86rem", margin: "0 0 4px" }}>{dragOver ? "Solte aqui!" : "Arraste ou clique para selecionar"}</p>
            <p style={{ color: C.txtLight, fontSize: "0.72rem", margin: 0 }}>PDF, DOC, TXT, CSV, XLS — máx 10MB</p>
          </div>
          {arquivos.length > 0 && <div style={{ marginTop: 10 }}>{arquivos.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 4 }}>
              <span style={{ fontSize: "0.84rem" }}>📄 {a.name} <span style={{ color: C.txtSec, fontSize: "0.72rem" }}>({fmtSize(a.size)})</span> {arquivosTexto.find(t => t.name === a.name)?.texto?.startsWith("[Arquivo:") ? "" : <span style={{ color: C.accent, fontSize: "0.7rem", fontWeight: 600 }}>✓ Lido</span>}</span>
              <button onClick={e => { e.stopPropagation(); removeArquivo(i); }} style={{ background: C.dangerLt, border: "none", borderRadius: 6, color: C.danger, cursor: "pointer", padding: "4px 8px", fontWeight: 700 }}>✕</button>
            </div>
          ))}</div>}
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
      <Card title="⚡ Fluxo de Atendimento — Gerado por IA">
        {!fluxoGerado ? (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <p style={{ color: C.txtSec, fontSize: "0.88rem", marginBottom: 16, lineHeight: 1.6 }}>A IA vai analisar todas as informações que você preencheu sobre <strong style={{ color: C.accent }}>{nomeEmpresa || "sua empresa"}</strong> e gerar um fluxo de atendimento personalizado.</p>
            <button onClick={gerarFluxoIA} disabled={gerandoFluxo} style={{ padding: "14px 32px", background: gerandoFluxo ? C.txtSec : C.accentGrad, border: "none", borderRadius: 12, color: "#fff", cursor: gerandoFluxo ? "wait" : "pointer", fontWeight: 700, fontSize: "0.95rem", boxShadow: "0 4px 15px rgba(61,163,73,0.3)" }}>
              {gerandoFluxo ? "⏳ Gerando com IA..." : "⚡ Gerar Fluxo com IA"}
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: C.txtSec, fontSize: "0.82rem", marginBottom: 14 }}>Fluxo personalizado para {nomeEmpresa || "sua empresa"}. Edite como quiser:</p>
            {etapasFluxo.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, padding: 12, background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.accent}` }}>
                <div style={{ minWidth: 28, height: 28, borderRadius: "50%", background: C.accentLt, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.78rem", marginTop: 4 }}>{i + 1}</div>
                <div style={{ flex: 1 }}><FG><Input value={e.nome} onChange={v => { const n = [...etapasFluxo]; n[i].nome = v; setEtapasFluxo(n); }} placeholder="Etapa" /></FG><TextArea value={e.descricao} onChange={v => { const n = [...etapasFluxo]; n[i].descricao = v; setEtapasFluxo(n); }} placeholder="Descrição..." rows={2} /></div>
                <button onClick={() => setEtapasFluxo(etapasFluxo.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", marginTop: 4 }}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEtapasFluxo([...etapasFluxo, { nome: "", descricao: "" }])} style={{ flex: 1, padding: "10px", background: "transparent", border: `1.5px dashed ${C.accent}`, borderRadius: 10, color: C.accent, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>+ Etapa</button>
              <button onClick={() => { setFluxoGerado(false); setEtapasFluxo([]); }} style={{ padding: "10px 16px", background: "transparent", border: `1.5px solid ${C.inBor}`, borderRadius: 10, color: C.txtSec, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>🔄 Regerar</button>
            </div>
          </>
        )}
      </Card>

      <Card title="💬 Estilo de Interação — Exemplos Reais com IA">
        {interacoes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <p style={{ color: C.txtSec, fontSize: "0.88rem", marginBottom: 16, lineHeight: 1.6 }}>A IA vai criar 3 estilos de conversa usando os dados reais da <strong style={{ color: C.accent }}>{nomeEmpresa || "sua empresa"}</strong>, com situações que seus clientes realmente teriam.</p>
            <button onClick={gerarInteracoesIA} disabled={gerandoInteracoes} style={{ padding: "14px 32px", background: gerandoInteracoes ? C.txtSec : C.accentGrad, border: "none", borderRadius: 12, color: "#fff", cursor: gerandoInteracoes ? "wait" : "pointer", fontWeight: 700, fontSize: "0.95rem", boxShadow: "0 4px 15px rgba(61,163,73,0.3)" }}>
              {gerandoInteracoes ? "⏳ Gerando interações..." : "💬 Gerar Exemplos com IA"}
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: C.txtSec, fontSize: "0.82rem", marginBottom: 16 }}>Escolha o estilo que mais combina com {nomeEmpresa || "sua empresa"}:</p>
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
            <button onClick={() => { setInteracoes([]); setInteracaoEscolhida(null); }} style={{ padding: "10px 16px", background: "transparent", border: `1.5px solid ${C.inBor}`, borderRadius: 10, color: C.txtSec, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", width: "100%" }}>🔄 Gerar Novos Exemplos</button>
          </>
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
          <FG><Label>Mensagem</Label><TextArea value={mensagemTransferencia} onChange={setMensagemTransferencia} placeholder="Ex: Vou transferir para nosso time." rows={2} /></FG>
          <FG><Label>Dados Enviados</Label><div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>{infosTransferencia.map((inf, j) => <Chip key={j} onRemove={() => setInfosTransferencia(infosTransferencia.filter((_, k) => k !== j))}>{inf}</Chip>)}</div><AddRow value={novaInfo} onChange={setNovaInfo} onAdd={() => addItem(infosTransferencia, setInfosTransferencia, novaInfo, setNovaInfo)} placeholder="Ex: Nº do pedido..." /></FG>
        </>)}
      </Card>
      <Card title="📥 Capacidades de Entrada">
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>{[{ key: "audio", icon: "🎙️", label: "Áudios" }, { key: "imagem", icon: "🖼️", label: "Imagens" }, { key: "documento", icon: "📄", label: "Documentos" }].map(f => (<button key={f.key} onClick={() => toggleEntrada(f.key)} style={{ flex: 1, padding: 16, background: entradas.includes(f.key) ? C.accentLt : "#fff", border: `2px solid ${entradas.includes(f.key) ? C.accent : C.inBor}`, borderRadius: 14, color: entradas.includes(f.key) ? C.accent : C.txtSec, cursor: "pointer", textAlign: "center" }}><div style={{ fontSize: "1.8rem", marginBottom: 6 }}>{f.icon}</div><div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{f.label}</div></button>))}</div>
        {entradas.includes("audio") && <FG><Label>Instruções Áudio</Label><TextArea value={instrucaoAudio} onChange={setInstrucaoAudio} placeholder="Instruções..." rows={2} /></FG>}
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
      <Card title="⚙️ Config"><ReviewRow label="Transferência" value={habilitaTransferencia ? `Sim (${setoresEscolhidos.join(", ") || "nenhum setor"})` : "Não"} /><ReviewRow label="Capacidades" value={entradas.length ? entradas.join(", ") : "Somente texto"} /></Card>
      <div style={{ marginTop: 24, textAlign: "center" }}><button onClick={handleSubmit} disabled={isSubmitting} style={{ padding: "16px 48px", background: isSubmitting ? C.txtSec : C.accentGrad, border: "none", borderRadius: 14, color: "#fff", cursor: isSubmitting ? "wait" : "pointer", fontWeight: 800, fontSize: "1.05rem", boxShadow: "0 4px 20px rgba(61,163,73,0.3)" }}>{isSubmitting ? "⏳ Gerando..." : "✅ Confirmar e Gerar Prompt"}</button></div>
    </>
  );

  const renderConcluido = () => (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ width: 100, height: 100, borderRadius: "50%", background: C.successLt, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "3rem" }}>✅</div>
      <h2 style={{ color: C.txt, fontWeight: 800, fontSize: "1.5rem", marginBottom: 8 }}>Prompt Gerado com Sucesso!</h2>
      <p style={{ color: C.txtSec, fontSize: "1rem", maxWidth: 480, margin: "0 auto 30px", lineHeight: 1.6 }}>Em breve entraremos em contato para finalizar a configuração.</p>
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
      {/* HEADER */}
      <div style={{ background: "#fff", padding: "18px 32px", borderBottom: `2px solid ${C.border}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/logo.png" alt="DeskRio" style={{ height: 38 }} onError={e => { e.target.onerror = null; e.target.style.display = "none"; document.getElementById("logo-fallback").style.display = "inline"; }} />
          <span id="logo-fallback" style={{ display: "none", fontSize: "1.5rem", fontWeight: 800, color: C.accent }}>DeskRio</span>
          <span style={{ color: "#ccc", fontSize: "1.3rem" }}>|</span>
          <span style={{ color: "#555", fontSize: "0.95rem", fontWeight: 600 }}>Configurador de IA</span>
        </div>
      </div>
      {/* STEPPER */}
      {!isFinal && (<div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "10px 32px", overflowX: "auto" }}><div style={{ maxWidth: 960, margin: "0 auto", display: "flex", gap: 4 }}>{STEPS.filter((_, i) => i < STEPS.length - 1).map((s, i) => { const isActive = i === step; const isDone = i < step; return (<button key={s.id} onClick={() => !submitted && setStep(i)} style={{ flex: 1, padding: "8px 6px", background: isActive ? C.accent : isDone ? C.accentLt : "transparent", border: "none", borderRadius: 10, color: isActive ? "#fff" : isDone ? C.accent : C.txtLight, cursor: submitted ? "default" : "pointer", textAlign: "center", fontSize: "0.68rem", fontWeight: isActive ? 700 : 500, transition: "all .15s", whiteSpace: "nowrap" }}><span style={{ fontSize: "0.95rem", display: "block", marginBottom: 1 }}>{isDone ? "✓" : s.icon}</span>{s.label}</button>); })}</div></div>)}
      {/* CONTENT */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isFinal ? "24px 32px" : "24px 32px 120px", position: "relative" }}>
        {step === 0 && <img src="/mascotes.png" alt="" style={{ position: "fixed", right: -20, bottom: 70, width: 200, opacity: 0.85, pointerEvents: "none", zIndex: 0 }} onError={e => { e.target.style.display = "none"; }} />}
        {!isFinal && (<div style={{ marginBottom: 20, position: "relative", zIndex: 1 }}><h2 style={{ color: C.txt, fontWeight: 700, fontSize: "1.15rem", margin: 0 }}>{STEPS[step].icon} {STEPS[step].label}</h2><div style={{ height: 4, background: C.border, borderRadius: 4, marginTop: 10, overflow: "hidden" }}><div style={{ height: "100%", width: `${((step + 1) / (STEPS.length - 1)) * 100}%`, background: C.accentGrad, borderRadius: 4, transition: "width .4s" }} /></div></div>)}
        <div style={{ position: "relative", zIndex: 1 }}>{renderers[step]()}</div>
      </div>
      {/* NAV */}
      {!isFinal && (<div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: `1px solid ${C.border}`, padding: "12px 32px", zIndex: 10 }}><div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}><button onClick={() => setStep(s => Math.max(s - 1, 0))} disabled={step === 0} style={{ padding: "10px 24px", background: step === 0 ? C.bg : "#fff", border: `1.5px solid ${C.inBor}`, borderRadius: 10, color: step === 0 ? C.inBor : C.txt, cursor: step === 0 ? "not-allowed" : "pointer", fontWeight: 600 }}>← Anterior</button><span style={{ color: C.txtSec, fontSize: "0.82rem" }}>{step + 1} de {STEPS.length - 1}</span>{!isReview && <button onClick={() => setStep(s => Math.min(s + 1, STEPS.length - 1))} style={{ padding: "10px 24px", background: C.accentGrad, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>Próximo →</button>}{isReview && <div />}</div></div>)}
    </div>
  );
}
