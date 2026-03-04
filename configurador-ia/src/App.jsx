import { useState, memo } from "react";

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
  { id: "segmento", pergunta: "Qual o segmento de atuação da empresa?", tipo: "texto", placeholder: "Ex: Tecnologia, Alimentação, Saúde, E-commerce..." },
  { id: "tipoNegocio", pergunta: "A empresa trabalha com:", tipo: "opcoes", opcoes: ["Produto", "Serviço", "Ambos"] },
  { id: "publicoAlvo", pergunta: "Quem é o público-alvo principal?", tipo: "texto", placeholder: "Ex: Empresas B2B, consumidor final, jovens 18-35 anos..." },
  { id: "horario", pergunta: "Horário de funcionamento:", tipo: "texto", placeholder: "Ex: Seg a Sex, 9h às 18h" },
  { id: "fimDeSemana", pergunta: "Funciona nos fins de semana e feriados?", tipo: "simNao" },
  { id: "entrega", pergunta: "Como funciona a entrega/prestação do serviço?", tipo: "opcoes", opcoes: ["Entrega", "Retirada", "Entrega e Retirada", "Online/Remoto", "Presencial", "Não se aplica"] },
  { id: "minimoCompra", pergunta: "Existe pedido mínimo ou valor mínimo?", tipo: "simNaoTexto", placeholder: "Qual o valor ou quantidade mínima?" },
  { id: "formasPagamento", pergunta: "Formas de pagamento aceitas:", tipo: "texto", placeholder: "Ex: Pix, cartão crédito/débito, boleto, dinheiro..." },
  { id: "garantia", pergunta: "Oferece garantia ou política de troca/devolução?", tipo: "simNaoTexto", placeholder: "Descreva a política brevemente" },
  { id: "areaAtuacao", pergunta: "Área de atuação / cobertura:", tipo: "texto", placeholder: "Ex: Todo o Brasil, Grande São Paulo, Online mundial..." },
  { id: "diferenciais", pergunta: "Quais os 3 principais diferenciais competitivos?", tipo: "texto", placeholder: "Ex: Atendimento 24h, frete grátis acima de R$99, garantia estendida..." },

  { id: "temSite", pergunta: "Tem site, loja virtual ou catálogo online?", tipo: "simNaoTexto", placeholder: "Cole o link aqui" },
  { id: "redesSociais", pergunta: "Redes sociais ativas:", tipo: "texto", placeholder: "Ex: @empresa no Instagram, /empresa no Facebook..." },
  { id: "doresCliente", pergunta: "Quais as dúvidas ou reclamações mais frequentes dos clientes?", tipo: "texto", placeholder: "Ex: Prazo de entrega, como trocar produto, horário de funcionamento..." },
];

const INTERACOES = {
  atendimento: [
    {
      id: "atend1", titulo: "🎯 Consultivo e Guiado",
      descricao: "A IA faz perguntas estratégicas para entender a necessidade antes de responder. Ideal para empresas com muitos produtos/serviços.",
      conversa: [
        { de: "cliente", msg: "Oi, preciso de ajuda" },
        { de: "ia", msg: "Olá! 😊 Bem-vindo à {empresa}! Eu sou {ia}, sua assistente virtual.\n\nPara te ajudar da melhor forma, me conta: o que você está precisando hoje?" },
        { de: "cliente", msg: "Quero saber sobre os planos de vocês" },
        { de: "ia", msg: "Ótimo! Temos algumas opções que podem ser ideais pra você. 🎯\n\nAntes, me ajuda com duas coisinhas:\n1️⃣ Você já é nosso cliente ou está conhecendo agora?\n2️⃣ Está buscando algo mais básico ou completo?\n\nAssim consigo te indicar o melhor caminho!" },
      ],
    },
    {
      id: "atend2", titulo: "⚡ Direto e Objetivo",
      descricao: "A IA vai direto ao ponto com respostas curtas e organizadas. Ideal para clientes que já sabem o que querem.",
      conversa: [
        { de: "cliente", msg: "Quais são os planos?" },
        { de: "ia", msg: "Olá! Nossos planos:\n\n📌 *Básico* — R$49/mês\n📌 *Pro* — R$99/mês\n📌 *Enterprise* — Sob consulta\n\nQual te interessa? Posso detalhar qualquer um." },
        { de: "cliente", msg: "Me fala mais do Pro" },
        { de: "ia", msg: "O *Plano Pro* inclui:\n\n✅ Até 5 usuários\n✅ Suporte prioritário\n✅ Relatórios avançados\n✅ Integrações ilimitadas\n\nQuer contratar ou tem alguma dúvida?" },
      ],
    },
    {
      id: "atend3", titulo: "💚 Humanizado e Acolhedor",
      descricao: "A IA cria conexão emocional, usa o nome do cliente e tom super amigável. Ideal para serviços de saúde, bem-estar e educação.",
      conversa: [
        { de: "cliente", msg: "Boa tarde, estou com uma dúvida" },
        { de: "ia", msg: "Boa tarde! 💚 Que bom que você entrou em contato! Eu sou {ia} da {empresa}.\n\nAntes de tudo, como posso te chamar?" },
        { de: "cliente", msg: "Maria" },
        { de: "ia", msg: "Maria, prazer! 😊\n\nFica à vontade pra me contar sua dúvida — estou aqui pra te ajudar com todo carinho! Pode mandar que eu te escuto. 🙌" },
        { de: "cliente", msg: "Quero saber como funciona o agendamento" },
        { de: "ia", msg: "Claro, Maria! O agendamento é bem simples:\n\n1️⃣ Você escolhe o serviço\n2️⃣ Seleciona o melhor horário\n3️⃣ Pronto! Você recebe a confirmação\n\nQuer que eu te ajude a agendar agora? 📅" },
      ],
    },
  ],
  vendas: [
    {
      id: "vend1", titulo: "🎯 Vendedor Consultivo",
      descricao: "Qualifica o lead com perguntas estratégicas antes de oferecer. Ideal para vendas complexas e ticket alto.",
      conversa: [
        { de: "cliente", msg: "Vi o anúncio de vocês, quero saber mais" },
        { de: "ia", msg: "Que legal que você se interessou! 🚀 Eu sou {ia} da {empresa}.\n\nPra te recomendar a melhor solução, me responde rapidinho:\n\n1️⃣ Qual problema você quer resolver hoje?\n2️⃣ Já usa alguma solução parecida?" },
        { de: "cliente", msg: "Preciso organizar meu atendimento, uso planilha hoje" },
        { de: "ia", msg: "Entendi! Sair da planilha é um ótimo passo. 💪\n\nCom base no que me contou, o *Plano Pro* seria perfeito:\n\n✅ Centraliza todos os atendimentos\n✅ Relatórios automáticos\n✅ Economiza até 5h/semana\n\nQuer que eu te mostre como funciona na prática?" },
      ],
    },
    {
      id: "vend2", titulo: "🔥 Vendedor com Gatilhos de Urgência",
      descricao: "Apresenta ofertas com escassez e urgência para acelerar a decisão. Ideal para promoções e lançamentos.",
      conversa: [
        { de: "cliente", msg: "Quanto custa?" },
        { de: "ia", msg: "Ótima pergunta! E você chegou na hora certa 🔥\n\nEstamos com uma *condição especial essa semana*:\n\n🎯 Plano Pro com *30% OFF* — de R$99 por *R$69/mês*\n⏰ Válido até sexta-feira!\n\nQuer garantir essa condição? Posso te explicar tudo em 2 minutos!" },
        { de: "cliente", msg: "Me fala mais" },
        { de: "ia", msg: "Com o Pro você ganha:\n\n✅ Tudo do plano Básico\n✅ + Suporte prioritário 24h\n✅ + Relatórios avançados\n✅ + Sem limite de uso\n\n💰 E com o desconto de 30%, sai por apenas *R$69/mês*.\n\n⚡ Já tivemos 12 adesões hoje. Quer garantir a sua vaga?" },
      ],
    },
    {
      id: "vend3", titulo: "🤝 Vendedor Relacional",
      descricao: "Constrói relacionamento antes de vender, foca em confiança. Ideal para serviços recorrentes e alto valor.",
      conversa: [
        { de: "cliente", msg: "Oi, estou pesquisando opções" },
        { de: "ia", msg: "Olá! 😊 Que bom que a {empresa} está entre suas opções!\n\nMe conta um pouco sobre o que você está buscando? Quero entender de verdade sua necessidade antes de te indicar qualquer coisa." },
        { de: "cliente", msg: "Preciso de um sistema de gestão" },
        { de: "ia", msg: "Legal! Gestão é nossa especialidade. 💚\n\nAntes de falar de planos, me conta:\n\n• Quantas pessoas vão usar?\n• O que mais te incomoda hoje no processo atual?\n\nQuero ter certeza de que vou te indicar algo que realmente faça diferença no seu dia a dia. 🎯" },
      ],
    },
  ],
  suporte: [
    {
      id: "sup1", titulo: "🔧 Suporte Técnico Estruturado",
      descricao: "Segue um checklist para diagnosticar o problema passo a passo. Ideal para produtos técnicos e SaaS.",
      conversa: [
        { de: "cliente", msg: "Meu sistema parou de funcionar" },
        { de: "ia", msg: "Sinto muito pelo inconveniente! 😔 Vou te ajudar a resolver.\n\nPreciso de algumas informações:\n\n📋 Qual produto/serviço está com problema?\n📋 Quando o problema começou?\n📋 Aparece alguma mensagem de erro?" },
        { de: "cliente", msg: "O app trava na tela de login, começou hoje" },
        { de: "ia", msg: "Entendi! Vamos resolver isso. Tenta os seguintes passos:\n\n1️⃣ Feche o app completamente\n2️⃣ Limpe o cache (Configurações > Apps > Limpar cache)\n3️⃣ Abra novamente\n\nFuncionou? Se não, vou escalar para nossa equipe técnica. 🔧" },
      ],
    },
    {
      id: "sup2", titulo: "💚 Suporte Empático e Resolutivo",
      descricao: "Prioriza a empatia e a resolução rápida. Ideal para quando o cliente está frustrado.",
      conversa: [
        { de: "cliente", msg: "Estou muito insatisfeito, nada funciona direito" },
        { de: "ia", msg: "Entendo completamente sua frustração e peço desculpas sinceras. 😔\n\nSua experiência é muito importante pra nós. Me conta exatamente o que aconteceu — vou priorizar seu caso agora mesmo. 💪" },
        { de: "cliente", msg: "Pedi um produto e veio errado, já é a segunda vez" },
        { de: "ia", msg: "Poxa, isso realmente não deveria acontecer, especialmente pela segunda vez. Peço desculpas! 🙏\n\nVou resolver agora:\n\n✅ Vou registrar sua reclamação como prioridade\n✅ Vou transferir para nosso time resolver imediatamente\n\nVocê prefere troca ou reembolso?" },
      ],
    },
    {
      id: "sup3", titulo: "📋 Suporte com Base de Conhecimento",
      descricao: "Busca respostas na documentação e FAQ antes de escalar. Ideal para empresas com muitas perguntas repetitivas.",
      conversa: [
        { de: "cliente", msg: "Como faço pra trocar minha senha?" },
        { de: "ia", msg: "É bem simples! Segue o passo a passo:\n\n1️⃣ Acesse *Configurações* > *Segurança*\n2️⃣ Clique em *Alterar Senha*\n3️⃣ Digite a senha atual e a nova\n4️⃣ Clique em *Salvar*\n\n✅ Pronto! Conseguiu?" },
        { de: "cliente", msg: "E se eu esqueci a senha atual?" },
        { de: "ia", msg: "Sem problema! Nesse caso:\n\n1️⃣ Na tela de login, clique em *Esqueci minha senha*\n2️⃣ Digite seu e-mail cadastrado\n3️⃣ Você receberá um link para criar uma nova senha\n\n📧 O e-mail chega em até 5 minutos. Se não receber, confira a pasta de spam!\n\nResolveu? 😊" },
      ],
    },
  ],
};

const N8N_WEBHOOK_URL = "https://n8n-matheus.riochat.com.br/webhook/prompt";

// ─── COLORS (DeskRio) ───
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

const inputSx = {
  width: "100%", padding: "12px 16px", background: C.inBg,
  border: `1.5px solid ${C.inBor}`, borderRadius: 12, color: C.txt,
  fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
  transition: "border-color .2s, box-shadow .2s",
  fontFamily: "'DM Sans', sans-serif",
};

const focusStyle = (e, on) => {
  e.target.style.borderColor = on ? C.accent : C.inBor;
  e.target.style.boxShadow = on ? `0 0 0 3px ${C.accentLt}` : "none";
};

// ─── COMPONENTS ───
const Label = memo(({ children, sub }) => (
  <label style={{ display: "block", marginBottom: 6 }}>
    <span style={{ color: C.txt, fontWeight: 600, fontSize: "0.9rem" }}>{children}</span>
    {sub && <span style={{ color: C.txtSec, fontSize: "0.78rem", display: "block", marginTop: 2 }}>{sub}</span>}
  </label>
));

const Input = memo(({ value, onChange, placeholder, ...props }) => (
  <input defaultValue={value} onBlur={(e) => { onChange(e.target.value); focusStyle(e, false); }} placeholder={placeholder}
    style={inputSx} onFocus={(e) => focusStyle(e, true)} {...props} />
));

const TextArea = memo(({ value, onChange, placeholder, rows = 3 }) => (
  <textarea defaultValue={value} onBlur={(e) => { onChange(e.target.value); focusStyle(e, false); }} placeholder={placeholder} rows={rows}
    style={{ ...inputSx, resize: "vertical", fontFamily: "'DM Sans', sans-serif" }}
    onFocus={(e) => focusStyle(e, true)} />
));

const Select = memo(({ value, onChange, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputSx, cursor: "pointer" }}>
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
));

const Chip = memo(({ children, onRemove }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: C.chipBg, borderRadius: 20, fontSize: "0.82rem", color: C.chipTxt, margin: 3, fontWeight: 600 }}>
    {children}
    {onRemove && <button onClick={onRemove} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", padding: 0, lineHeight: 1 }}>×</button>}
  </span>
));

const AddRow = memo(({ value, onChange, onAdd, placeholder }) => {
  const ref = { current: null };
  const handleAdd = () => { onAdd(); if (ref.current) ref.current.value = ""; };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input defaultValue={value} onChange={(e) => onChange(e.target.value)} ref={(el) => { ref.current = el; }}
        placeholder={placeholder} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
        style={inputSx} onFocus={(e) => focusStyle(e, true)} onBlur={(e) => focusStyle(e, false)} />
      <button onClick={handleAdd} style={{ padding: "10px 18px", background: C.accentGrad, border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap", fontSize: "0.85rem" }}>+ Adicionar</button>
    </div>
  );
});

const Card = memo(({ title, children }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
    {title && <h3 style={{ color: C.accent, fontSize: "0.95rem", fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`, marginTop: 0 }}>{title}</h3>}
    {children}
  </div>
));

const FG = ({ children }) => <div style={{ marginBottom: 16 }}>{children}</div>;

const ReviewRow = memo(({ label, value, empty }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
    <span style={{ color: C.txtSec, fontSize: "0.84rem", fontWeight: 500, minWidth: 140 }}>{label}</span>
    <span style={{ color: empty ? C.danger : C.txt, fontSize: "0.84rem", textAlign: "right", flex: 1, marginLeft: 16 }}>
      {empty ? "⚠️ Não preenchido" : value}
    </span>
  </div>
));

const ToggleBtn = memo(({ active, onClick, children, style: sx }) => (
  <button onClick={onClick} style={{
    padding: "10px 20px", background: active ? C.accentGrad : "#fff",
    border: `2px solid ${active ? C.accent : C.inBor}`, borderRadius: 12,
    color: active ? "#fff" : C.txt, cursor: "pointer", fontWeight: 700,
    fontSize: "0.88rem", transition: "all .2s", ...sx,
  }}>{children}</button>
));

// ─── CHAT BUBBLE ───
const ChatBubble = ({ de, msg, nomeIA, nomeEmpresa }) => {
  const isCliente = de === "cliente";
  const parsed = msg.replace(/\{ia\}/g, nomeIA || "Assistente").replace(/\{empresa\}/g, nomeEmpresa || "Empresa");
  return (
    <div style={{ display: "flex", justifyContent: isCliente ? "flex-end" : "flex-start", marginBottom: 8 }}>
      <div style={{
        maxWidth: "80%", padding: "10px 14px", borderRadius: isCliente ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        background: isCliente ? "#DCF8C6" : "#fff", border: isCliente ? "none" : `1px solid ${C.border}`,
        fontSize: "0.82rem", lineHeight: 1.5, color: C.txt, whiteSpace: "pre-wrap",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: isCliente ? "#2E7D32" : C.accent, marginBottom: 4 }}>
          {isCliente ? "Cliente" : nomeIA || "IA"}
        </div>
        {parsed}
      </div>
    </div>
  );
};

// ═══════════════════════════
//  MAIN
// ═══════════════════════════
export default function PromptGenerator() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // IDENTIDADE + EMPRESA
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
  const [dragOver, setDragOver] = useState(false);
  const [faq, setFaq] = useState([{ pergunta: "", resposta: "" }]);

  // FLUXO + INTERAÇÃO
  const [etapasFluxo, setEtapasFluxo] = useState([]);
  const [fluxoGerado, setFluxoGerado] = useState(false);
  const [interacaoEscolhida, setInteracaoEscolhida] = useState(null);

  // TRANSFERÊNCIA + CAPACIDADES
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
  const handleFiles = (files) => { Array.from(files).forEach((file) => { if (file.size > 10 * 1024 * 1024) return; const r = new FileReader(); r.onload = (e) => setArquivos((p) => [...p, { name: file.name, size: file.size, type: file.type, base64: e.target.result }]); r.readAsDataURL(file); }); };
  const removeArquivo = (i) => setArquivos(arquivos.filter((_, j) => j !== i));
  const fmtSize = (b) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

  const gerarFluxo = () => {
    const t = funcaoIA;
    let e = [{ nome: "Saudação e Identificação", descricao: "Cumprimentar, se apresentar e coletar o nome do cliente" }];
    if (t === "vendas") e.push({ nome: "Qualificação", descricao: "Entender perfil, necessidades e orçamento do lead" }, { nome: "Apresentação", descricao: "Apresentar produtos/serviços mais adequados ao perfil" }, { nome: "Objeções", descricao: "Lidar com dúvidas e objeções com empatia" }, { nome: "Fechamento", descricao: "Direcionar para compra ou agendamento" });
    else if (t === "suporte") e.push({ nome: "Identificar Problema", descricao: "Coletar informações detalhadas sobre o problema" }, { nome: "Diagnóstico", descricao: "Analisar e buscar solução na base de conhecimento" }, { nome: "Solução", descricao: "Apresentar solução ou procedimento passo a passo" }, { nome: "Verificação", descricao: "Confirmar se o problema foi resolvido" });
    else e.push({ nome: "Entender Necessidade", descricao: "Descobrir o que o cliente precisa com perguntas" }, { nome: "Fornecer Informação", descricao: "Responder com base no conhecimento disponível" }, { nome: "Confirmar Satisfação", descricao: "Verificar se a dúvida foi resolvida" });
    e.push({ nome: "Encerramento ou Transferência", descricao: "Finalizar ou transferir para atendente humano" });
    setEtapasFluxo(e); setFluxoGerado(true);
  };

  // ─── GERAR PROMPT ───
  const gerarPrompt = () => {
    const rTxt = PERGUNTAS_EMPRESA.map((p) => { const r = respostas[p.id]; if (!r || r === "") return null; if (p.tipo === "simNao") return `${p.pergunta} ${r ? "Sim" : "Não"}`; if (p.tipo === "simNaoTexto") return `${p.pergunta} ${r.ativo ? "Sim" + (r.detalhe ? ` - ${r.detalhe}` : "") : "Não"}`; return `${p.pergunta} ${r}`; }).filter(Boolean).join("\n    ");
    const inter = interacaoEscolhida ? (INTERACOES[funcaoIA] || []).find(i => i.id === interacaoEscolhida) : null;

    let p = `<identidade>\n  <nome_ia>${nomeIA || "Assistente Virtual"}</nome_ia>\n  <empresa>${nomeEmpresa || "Empresa"}</empresa>\n  <descricao_empresa>${descricaoEmpresa || "Descrição"}</descricao_empresa>\n  <funcao>${funcaoIA === "vendas" ? "Vendedor e qualificador de leads" : funcaoIA === "suporte" ? "Suporte técnico" : "Atendimento ao cliente"}</funcao>\n  <tom_de_voz>${tomVoz}</tom_de_voz>\n  <idioma>${idioma}</idioma>\n  <informacoes_empresa>\n    ${rTxt}\n  </informacoes_empresa>\n</identidade>\n\n`;
    p += `<personalidade>\n  <estilo_resposta>${estiloResposta}</estilo_resposta>\n  <nivel_formalidade>${nivelFormalidade}</nivel_formalidade>\n  <uso_emojis>${usaEmojis}</uso_emojis>\n  <cumprimento_inicial>${cumprimentoInicial || `Olá! Eu sou ${nomeIA || "o assistente"} da ${nomeEmpresa || "empresa"}. Como posso ajudar?`}</cumprimento_inicial>\n  <mensagem_encerramento>${mensagemEncerramento || "Foi um prazer atender você! Se precisar, estou por aqui. 😊"}</mensagem_encerramento>\n`;
    if (inter) p += `  <estilo_interacao>\n    <tipo>${inter.titulo}</tipo>\n    <descricao>${inter.descricao}</descricao>\n  </estilo_interacao>\n`;
    p += `</personalidade>\n\n`;
    p += `<regras>\n  <proibicoes_absolutas>\n${proibicoes.map(x => `    <proibicao>${x}</proibicao>`).join("\n")}\n  </proibicoes_absolutas>\n  <comportamento_correto>\n${comportamentos.map(x => `    <comportamento>${x}</comportamento>`).join("\n")}\n  </comportamento_correto>\n  <deteccao_primeira_interacao>\n    <instrucao>Na primeira mensagem, sempre cumprimente e se apresente.</instrucao>\n  </deteccao_primeira_interacao>\n  <correcao_ortografica>\n    <instrucao>Interprete erros, gírias e abreviações. Nunca corrija o cliente.</instrucao>\n  </correcao_ortografica>\n</regras>\n\n`;
    const gv = glossario.filter(g => g.termo && g.definicao);
    if (gv.length) p += `<glossario>\n${gv.map(g => `  <termo><palavra>${g.termo}</palavra><significado>${g.definicao}</significado></termo>`).join("\n")}\n</glossario>\n\n`;
    p += `<dados>\n  <base_de_conhecimento>\n${baseConhecimento || "    [Informações da empresa]"}\n  </base_de_conhecimento>\n</dados>\n\n`;
    const fv = faq.filter(f => f.pergunta && f.resposta);
    if (fv.length) p += `<faq>\n${fv.map(f => `  <item><pergunta>${f.pergunta}</pergunta><resposta>${f.resposta}</resposta></item>`).join("\n")}\n</faq>\n\n`;
    p += `<fluxo_de_atendimento>\n${etapasFluxo.filter(e => e.nome).map((e, i) => `  <etapa ordem="${i + 1}"><nome>${e.nome}</nome><descricao>${e.descricao}</descricao></etapa>`).join("\n")}\n</fluxo_de_atendimento>\n\n`;
    p += `<formato_de_saida><formato>texto</formato><instrucao>Responda sempre em texto. Seja claro e objetivo.</instrucao></formato_de_saida>\n\n`;
    if (entradas.length) { p += `<capacidades_de_entrada>\n  <tipos_aceitos>${entradas.join(", ")}</tipos_aceitos>\n`; if (entradas.includes("audio")) p += `  <transcricao_audio><instrucao>${instrucaoAudio || "Transcreva e interprete áudios do cliente."}</instrucao></transcricao_audio>\n`; if (entradas.includes("imagem")) p += `  <interpretacao_imagem><instrucao>${instrucaoImagem || "Analise imagens enviadas pelo cliente."}</instrucao></interpretacao_imagem>\n`; if (entradas.includes("documento")) p += `  <leitura_documento><instrucao>${instrucaoDocumento || "Leia documentos enviados pelo cliente."}</instrucao></leitura_documento>\n`; p += `</capacidades_de_entrada>\n\n`; }
    if (habilitaTransferencia && setoresEscolhidos.length) { p += `<sistema_transferencia>\n`; setoresEscolhidos.forEach(s => { p += `  <etapa><acao_sistema><instrucao_transferencia>Para transferir ao ${s}: "${mensagemTransferencia || `Vou transferir para o time de ${s}. Um momento!`}"\nInformações: ${infosTransferencia.join(", ")}</instrucao_transferencia><destino>Tool "transferência" ID [ID_${s.toUpperCase().replace(/[^A-Z0-9]/g, "_")}]</destino></acao_sistema></etapa>\n`; }); p += `</sistema_transferencia>`; }
    return p;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const prompt = gerarPrompt();
    try { await fetch(N8N_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cliente: { nome: nomeCliente, email: emailCliente, telefone: telefoneCliente }, empresa: nomeEmpresa, nomeIA, descricaoEmpresa, funcaoIA, respostasEmpresa: respostas, interacaoEscolhida, setoresTransferencia: setoresEscolhidos, entradasHabilitadas: entradas, arquivos: arquivos.map(a => ({ name: a.name, size: a.size, type: a.type, base64: a.base64 })), promptXML: prompt, dataGeracao: new Date().toISOString() }) }); } catch (e) { console.error(e); }
    setIsSubmitting(false); setSubmitted(true); setStep(STEPS.length - 1);
  };

  // ═══════════════════════════
  //  RENDERS
  // ═══════════════════════════

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
          <FG><Label>Nome da IA</Label><Input value={nomeIA} onChange={setNomeIA} placeholder="Ex: Luna, Max, Aria..." /></FG>
          <FG><Label>Nome da Empresa</Label><Input value={nomeEmpresa} onChange={setNomeEmpresa} placeholder="Ex: TechCorp Brasil" /></FG>
        </div>
        <FG><Label sub="Qual será a principal função dessa IA?">Tipo de IA</Label>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            {[{ v: "atendimento", l: "🎧 Atendimento" }, { v: "vendas", l: "💰 Vendas" }, { v: "suporte", l: "🔧 Suporte" }].map(t => (
              <ToggleBtn key={t.v} active={funcaoIA === t.v} onClick={() => setFuncaoIA(t.v)} style={{ flex: 1 }}>{t.l}</ToggleBtn>
            ))}
          </div>
        </FG>
        <FG><Label sub="Descreva o que a empresa faz">Descrição da Empresa</Label>
          <TextArea value={descricaoEmpresa} onChange={setDescricaoEmpresa} placeholder="Ex: Empresa de tecnologia especializada em..." rows={2} /></FG>
      </Card>
      <Card title="Informações da Empresa">
        <p style={{ color: C.txtSec, fontSize: "0.82rem", marginBottom: 16 }}>Quanto mais você preencher, melhor será a IA. Preencha o que souber.</p>
        {PERGUNTAS_EMPRESA.map(perg => (
          <div key={perg.id} style={{ marginBottom: 16, padding: 14, background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <Label>{perg.pergunta}</Label>
            {perg.tipo === "texto" && <Input value={respostas[perg.id] || ""} onChange={v => setR(perg.id, v)} placeholder={perg.placeholder} />}
            {perg.tipo === "simNao" && <div style={{ display: "flex", gap: 10, marginTop: 6 }}><ToggleBtn active={respostas[perg.id] === true} onClick={() => setR(perg.id, true)}>Sim</ToggleBtn><ToggleBtn active={respostas[perg.id] === false} onClick={() => setR(perg.id, false)}>Não</ToggleBtn></div>}
            {perg.tipo === "opcoes" && <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>{perg.opcoes.map(op => <ToggleBtn key={op} active={respostas[perg.id] === op} onClick={() => setR(perg.id, op)}>{op}</ToggleBtn>)}</div>}
            {perg.tipo === "simNaoTexto" && <div style={{ marginTop: 6 }}><div style={{ display: "flex", gap: 10, marginBottom: 8 }}><ToggleBtn active={respostas[perg.id]?.ativo === true} onClick={() => setR(perg.id, { ...respostas[perg.id], ativo: true })}>Sim</ToggleBtn><ToggleBtn active={respostas[perg.id]?.ativo === false} onClick={() => setR(perg.id, { ativo: false })}>Não</ToggleBtn></div>{respostas[perg.id]?.ativo && <Input value={respostas[perg.id]?.detalhe || ""} onChange={v => setR(perg.id, { ...respostas[perg.id], detalhe: v })} placeholder={perg.placeholder} />}</div>}
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
        <p style={{ color: C.txtSec, fontSize: "0.82rem", marginBottom: 10 }}>Regras que a IA nunca deve quebrar. Edite ou adicione.</p>
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
        <FG><Label sub="Cole informações sobre produtos, serviços, preços, políticas">Conteúdo</Label>
          <TextArea value={baseConhecimento} onChange={setBaseConhecimento} placeholder="Cole aqui as informações da empresa..." rows={6} /></FG>
        <FG><Label sub="Arraste ou clique (PDF, DOC, TXT, CSV — máx 10MB)">Anexar Arquivos</Label>
          <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => { const i = document.createElement("input"); i.type = "file"; i.multiple = true; i.accept = ".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"; i.onchange = e => handleFiles(e.target.files); i.click(); }}
            style={{ border: `2px dashed ${dragOver ? C.accent : C.inBor}`, borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? C.accentLt : "#fff" }}>
            <div style={{ fontSize: "2rem", marginBottom: 6 }}>📁</div>
            <p style={{ color: C.txtSec, fontWeight: 600, fontSize: "0.88rem", margin: 0 }}>{dragOver ? "Solte aqui!" : "Arraste ou clique para selecionar"}</p>
          </div>
          {arquivos.length > 0 && <div style={{ marginTop: 10 }}>{arquivos.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 4 }}>
              <span style={{ fontSize: "0.84rem" }}>📄 {a.name} <span style={{ color: C.txtSec, fontSize: "0.72rem" }}>({fmtSize(a.size)})</span></span>
              <button onClick={e => { e.stopPropagation(); removeArquivo(i); }} style={{ background: C.dangerLt, border: "none", borderRadius: 6, color: C.danger, cursor: "pointer", padding: "4px 8px", fontWeight: 700 }}>✕</button>
            </div>
          ))}</div>}
        </FG>
      </Card>
      <Card title="Glossário">
        {glossario.map((g, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8, marginBottom: 8 }}>
            <Input value={g.termo} onChange={v => { const n = [...glossario]; n[i].termo = v; setGlossario(n); }} placeholder="Termo" />
            <Input value={g.definicao} onChange={v => { const n = [...glossario]; n[i].definicao = v; setGlossario(n); }} placeholder="Definição" />
            <button onClick={() => setGlossario(glossario.filter((_, j) => j !== i))} style={{ background: C.dangerLt, border: "none", borderRadius: 10, color: C.danger, cursor: "pointer", padding: "8px 12px" }}>✕</button>
          </div>
        ))}
        <button onClick={() => setGlossario([...glossario, { termo: "", definicao: "" }])} style={{ padding: "8px 16px", background: "transparent", border: `1.5px dashed ${C.accent}`, borderRadius: 10, color: C.accent, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>+ Termo</button>
      </Card>
      <Card title="FAQ">
        {faq.map((f, i) => (
          <div key={i} style={{ marginBottom: 12, padding: 12, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: C.accent, fontWeight: 600, fontSize: "0.8rem" }}>#{i + 1}</span><button onClick={() => setFaq(faq.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer" }}>✕</button></div>
            <FG><Input value={f.pergunta} onChange={v => { const n = [...faq]; n[i].pergunta = v; setFaq(n); }} placeholder="Pergunta" /></FG>
            <TextArea value={f.resposta} onChange={v => { const n = [...faq]; n[i].resposta = v; setFaq(n); }} placeholder="Resposta" rows={2} />
          </div>
        ))}
        <button onClick={() => setFaq([...faq, { pergunta: "", resposta: "" }])} style={{ padding: "8px 16px", background: "transparent", border: `1.5px dashed ${C.accent}`, borderRadius: 10, color: C.accent, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>+ FAQ</button>
      </Card>
    </>
  );

  const renderStep3 = () => {
    const interacoes = INTERACOES[funcaoIA] || INTERACOES.atendimento;
    return (
      <>
        <Card title="Fluxo de Atendimento">
          {!fluxoGerado ? (
            <div style={{ textAlign: "center", padding: "24px" }}>
              <p style={{ color: C.txtSec, fontSize: "0.9rem", marginBottom: 16 }}>Vou gerar um fluxo otimizado para <strong style={{ color: C.accent }}>{funcaoIA === "vendas" ? "Vendas" : funcaoIA === "suporte" ? "Suporte" : "Atendimento"}</strong>. Depois você edita.</p>
              <button onClick={gerarFluxo} style={{ padding: "14px 32px", background: C.accentGrad, border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", boxShadow: "0 4px 15px rgba(45,140,60,0.3)" }}>⚡ Gerar Fluxo</button>
            </div>
          ) : (
            <>
              {etapasFluxo.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, padding: 12, background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.accent}` }}>
                  <div style={{ minWidth: 30, height: 30, borderRadius: "50%", background: C.accentLt, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", marginTop: 4 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <FG><Input value={e.nome} onChange={v => { const n = [...etapasFluxo]; n[i].nome = v; setEtapasFluxo(n); }} placeholder="Etapa" /></FG>
                    <TextArea value={e.descricao} onChange={v => { const n = [...etapasFluxo]; n[i].descricao = v; setEtapasFluxo(n); }} placeholder="Descrição..." rows={2} />
                  </div>
                  <button onClick={() => setEtapasFluxo(etapasFluxo.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", marginTop: 4 }}>✕</button>
                </div>
              ))}
              <button onClick={() => setEtapasFluxo([...etapasFluxo, { nome: "", descricao: "" }])} style={{ padding: "10px 20px", background: "transparent", border: `1.5px dashed ${C.accent}`, borderRadius: 10, color: C.accent, cursor: "pointer", fontSize: "0.85rem", width: "100%", fontWeight: 600 }}>+ Etapa</button>
            </>
          )}
        </Card>

        <Card title="💬 Estilo de Interação — Como a IA vai conversar">
          <p style={{ color: C.txtSec, fontSize: "0.84rem", marginBottom: 20, lineHeight: 1.5 }}>Veja exemplos reais de conversa. Escolha o estilo que mais combina com sua empresa:</p>
          {interacoes.map(inter => (
            <div key={inter.id} onClick={() => setInteracaoEscolhida(inter.id)} style={{
              marginBottom: 20, borderRadius: 16, overflow: "hidden",
              border: `2px solid ${interacaoEscolhida === inter.id ? C.accent : C.border}`,
              cursor: "pointer", transition: "all .2s",
              boxShadow: interacaoEscolhida === inter.id ? `0 0 0 3px ${C.accentLt}` : "none",
            }}>
              <div style={{ padding: "16px 20px", background: interacaoEscolhida === inter.id ? C.accentLt : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: interacaoEscolhida === inter.id ? C.accent : C.txt }}>{inter.titulo}</h4>
                  <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: C.txtSec }}>{inter.descricao}</p>
                </div>
                {interacaoEscolhida === inter.id && <span style={{ background: C.accent, color: "#fff", padding: "4px 14px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}>✓ Selecionado</span>}
              </div>
              <div style={{ padding: "16px 20px", background: interacaoEscolhida === inter.id ? "#F1F8E9" : C.bg }}>
                {inter.conversa.map((msg, j) => <ChatBubble key={j} de={msg.de} msg={msg.msg} nomeIA={nomeIA} nomeEmpresa={nomeEmpresa} />)}
              </div>
            </div>
          ))}
        </Card>
      </>
    );
  };

  const renderStep4 = () => (
    <>
      <Card title="🔀 Transferência para Atendente">
        <div style={{ marginBottom: 16 }}><ToggleBtn active={habilitaTransferencia} onClick={() => setHabilitaTransferencia(!habilitaTransferencia)}>{habilitaTransferencia ? "✓ Habilitado" : "Desabilitado"}</ToggleBtn></div>
        {habilitaTransferencia && (
          <>
            <FG><Label>Setores</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>{SETORES_PADRAO.map(s => <ToggleBtn key={s} active={setoresEscolhidos.includes(s)} onClick={() => toggleSetor(s)}>{s}</ToggleBtn>)}</div>
              {setoresCustom.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>{setoresCustom.map(s => <div key={s} style={{ display: "flex" }}><ToggleBtn active={setoresEscolhidos.includes(s)} onClick={() => toggleSetor(s)}>{s}</ToggleBtn><button onClick={() => removeSetorCustom(s)} style={{ padding: "8px 10px", background: C.dangerLt, border: "none", borderRadius: "0 10px 10px 0", color: C.danger, cursor: "pointer", fontWeight: 700 }}>✕</button></div>)}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}><Input value={novoSetor} onChange={setNovoSetor} placeholder="Setor personalizado..." onKeyDown={e => e.key === "Enter" && addSetorCustom()} /><button onClick={addSetorCustom} style={{ padding: "10px 18px", background: C.accentGrad, border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}>+ Setor</button></div>
            </FG>
            <FG><Label>Mensagem de Transferência</Label><TextArea value={mensagemTransferencia} onChange={setMensagemTransferencia} placeholder="Ex: Vou transferir para nosso time. Um momento!" rows={2} /></FG>
            <FG><Label>Dados Enviados</Label>
              <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>{infosTransferencia.map((i, j) => <Chip key={j} onRemove={() => setInfosTransferencia(infosTransferencia.filter((_, k) => k !== j))}>{i}</Chip>)}</div>
              <AddRow value={novaInfo} onChange={setNovaInfo} onAdd={() => addItem(infosTransferencia, setInfosTransferencia, novaInfo, setNovaInfo)} placeholder="Ex: Nº do pedido..." />
            </FG>
          </>
        )}
      </Card>
      <Card title="📥 Capacidades de Entrada">
        <p style={{ color: C.txtSec, fontSize: "0.82rem", marginBottom: 16 }}>O que a IA pode receber e interpretar do cliente:</p>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[{ key: "audio", icon: "🎙️", label: "Áudios" }, { key: "imagem", icon: "🖼️", label: "Imagens" }, { key: "documento", icon: "📄", label: "Documentos" }].map(f => (
            <button key={f.key} onClick={() => toggleEntrada(f.key)} style={{ flex: 1, padding: 16, background: entradas.includes(f.key) ? C.accentLt : "#fff", border: `2px solid ${entradas.includes(f.key) ? C.accent : C.inBor}`, borderRadius: 14, color: entradas.includes(f.key) ? C.accent : C.txtSec, cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{f.label}</div>
            </button>
          ))}
        </div>
        {entradas.includes("audio") && <FG><Label>Instruções Áudio</Label><TextArea value={instrucaoAudio} onChange={setInstrucaoAudio} placeholder="Instruções..." rows={2} /></FG>}
        {entradas.includes("imagem") && <FG><Label>Instruções Imagem</Label><TextArea value={instrucaoImagem} onChange={setInstrucaoImagem} placeholder="Instruções..." rows={2} /></FG>}
        {entradas.includes("documento") && <FG><Label>Instruções Documento</Label><TextArea value={instrucaoDocumento} onChange={setInstrucaoDocumento} placeholder="Instruções..." rows={2} /></FG>}
        <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, padding: 14, marginTop: 16, display: "flex", gap: 10 }}>
          <span>💰</span>
          <p style={{ color: "#92400E", margin: 0, fontSize: "0.8rem" }}>O valor pode variar conforme as capacidades selecionadas. Você será informado antes da ativação.</p>
        </div>
      </Card>
    </>
  );

  const renderStep5 = () => (
    <>
      <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 14, padding: 16, marginBottom: 20, display: "flex", gap: 12 }}>
        <span style={{ fontSize: "1.3rem" }}>⚠️</span>
        <div><p style={{ color: "#92400E", fontWeight: 700, margin: "0 0 4px" }}>Revise antes de enviar</p><p style={{ color: "#A16207", margin: 0, fontSize: "0.82rem" }}>Após confirmar, o prompt será enviado para nossa equipe.</p></div>
      </div>
      <Card title="👤 Identidade"><ReviewRow label="Nome" value={nomeCliente} empty={!nomeCliente} /><ReviewRow label="Email" value={emailCliente} empty={!emailCliente} /><ReviewRow label="Telefone" value={telefoneCliente} empty={!telefoneCliente} /><ReviewRow label="IA" value={nomeIA} empty={!nomeIA} /><ReviewRow label="Empresa" value={nomeEmpresa} empty={!nomeEmpresa} /><ReviewRow label="Tipo" value={funcaoIA} /></Card>
      <Card title="🎭 Personalidade"><ReviewRow label="Tom" value={tomVoz} /><ReviewRow label="Estilo" value={estiloResposta} /><ReviewRow label="Emojis" value={usaEmojis} /></Card>
      <Card title="📋 Regras"><ReviewRow label="Proibições" value={`${proibicoes.length} regra(s)`} /><ReviewRow label="Comportamentos" value={`${comportamentos.length} item(s)`} /></Card>
      <Card title="📚 Conhecimento"><ReviewRow label="Base" value={baseConhecimento ? "Preenchido" : ""} empty={!baseConhecimento} /><ReviewRow label="Arquivos" value={arquivos.length ? arquivos.map(a => a.name).join(", ") : "Nenhum"} /><ReviewRow label="FAQ" value={`${faq.filter(f => f.pergunta).length} pergunta(s)`} /></Card>
      <Card title="🔄 Fluxo"><ReviewRow label="Etapas" value={etapasFluxo.filter(e => e.nome).map(e => e.nome).join(" → ")} empty={!etapasFluxo.length} /></Card>
      <Card title="💬 Interação"><ReviewRow label="Estilo" value={interacaoEscolhida ? (INTERACOES[funcaoIA] || []).find(i => i.id === interacaoEscolhida)?.titulo : "Não selecionado"} /></Card>
      <Card title="⚙️ Config"><ReviewRow label="Transferência" value={habilitaTransferencia ? `Sim (${setoresEscolhidos.join(", ")})` : "Não"} /><ReviewRow label="Capacidades" value={entradas.length ? entradas.join(", ") : "Somente texto"} /></Card>
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button onClick={handleSubmit} disabled={isSubmitting} style={{ padding: "16px 48px", background: isSubmitting ? C.txtSec : C.accentGrad, border: "none", borderRadius: 14, color: "#fff", cursor: isSubmitting ? "wait" : "pointer", fontWeight: 800, fontSize: "1.05rem", boxShadow: "0 4px 20px rgba(45,140,60,0.3)" }}>{isSubmitting ? "⏳ Gerando..." : "✅ Confirmar e Gerar Prompt"}</button>
      </div>
    </>
  );

  const renderConcluido = () => (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ width: 100, height: 100, borderRadius: "50%", background: C.successLt, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "3rem" }}>✅</div>
      <h2 style={{ color: C.txt, fontWeight: 800, fontSize: "1.5rem", marginBottom: 8 }}>Prompt Gerado com Sucesso!</h2>
      <p style={{ color: C.txtSec, fontSize: "1rem", maxWidth: 480, margin: "0 auto 30px", lineHeight: 1.6 }}>Em breve entraremos em contato para finalizar a configuração.</p>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 400, margin: "0 auto", textAlign: "left" }}>
        <h4 style={{ color: C.accent, fontWeight: 700, marginTop: 0, marginBottom: 14 }}>Próximos passos:</h4>
        {["Revisaremos suas informações", "Configuraremos na plataforma", "Adicionaremos os IDs de transferência", "Você receberá acesso para testar"].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <div style={{ minWidth: 24, height: 24, borderRadius: "50%", background: C.accentLt, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.7rem" }}>{i + 1}</div>
            <span style={{ fontSize: "0.86rem" }}>{s}</span>
          </div>
        ))}
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
      {!isFinal && (
        <div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "10px 32px", overflowX: "auto" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", gap: 4 }}>
            {STEPS.filter((_, i) => i < STEPS.length - 1).map((s, i) => {
              const isActive = i === step;
              const isDone = i < step;
              return (
                <button key={s.id} onClick={() => !submitted && setStep(i)} style={{
                  flex: 1, padding: "8px 6px",
                  background: isActive ? C.accent : isDone ? C.accentLt : "transparent",
                  border: "none", borderRadius: 10,
                  color: isActive ? "#fff" : isDone ? C.accent : C.txtLight,
                  cursor: submitted ? "default" : "pointer", textAlign: "center", fontSize: "0.68rem",
                  fontWeight: isActive ? 700 : 500, transition: "all .15s", whiteSpace: "nowrap",
                }}>
                  <span style={{ fontSize: "0.95rem", display: "block", marginBottom: 1 }}>{isDone ? "✓" : s.icon}</span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isFinal ? "24px 32px" : "24px 32px 120px", position: "relative" }}>
        {step === 0 && (
          <img src="/mascotes.png" alt="" style={{ position: "fixed", right: -20, bottom: 70, width: 200, opacity: 0.85, pointerEvents: "none", zIndex: 0 }} onError={e => { e.target.style.display = "none"; }} />
        )}
        {!isFinal && (
          <div style={{ marginBottom: 20, position: "relative", zIndex: 1 }}>
            <h2 style={{ color: C.txt, fontWeight: 700, fontSize: "1.15rem", margin: 0 }}>{STEPS[step].icon} {STEPS[step].label}</h2>
            <div style={{ height: 4, background: C.border, borderRadius: 4, marginTop: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((step + 1) / (STEPS.length - 1)) * 100}%`, background: C.accentGrad, borderRadius: 4, transition: "width .4s" }} />
            </div>
          </div>
        )}
        <div style={{ position: "relative", zIndex: 1 }}>{renderers[step]()}</div>
      </div>

      {/* BOTTOM NAV */}
      {!isFinal && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: `1px solid ${C.border}`, padding: "12px 32px", zIndex: 10 }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setStep(s => Math.max(s - 1, 0))} disabled={step === 0} style={{ padding: "10px 24px", background: step === 0 ? C.bg : "#fff", border: `1.5px solid ${C.inBor}`, borderRadius: 10, color: step === 0 ? C.inBor : C.txt, cursor: step === 0 ? "not-allowed" : "pointer", fontWeight: 600 }}>← Anterior</button>
            <span style={{ color: C.txtSec, fontSize: "0.82rem" }}>{step + 1} de {STEPS.length - 1}</span>
            {!isReview && <button onClick={() => setStep(s => Math.min(s + 1, STEPS.length - 1))} style={{ padding: "10px 24px", background: C.accentGrad, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>Próximo →</button>}
            {isReview && <div />}
          </div>
        </div>
      )}
    </div>
  );
}
