const venom = require('venom-bot');
const dotenv = require('dotenv');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const { getSheetData } = require('./sheets');

dotenv.config();

// ---------------------------
// LOGS
// ---------------------------
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
  ),
  transports: [new winston.transports.Console()]
});

// ---------------------------
// INICIAR O BOT
// ---------------------------
venom
  .create({
    session: 'bot-aniversarios',
    headless: true,
    disableWelcome: true,
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--single-process',
      '--no-zygote'
    ]
  })
  .then(client => start(client))
  .catch(err => logger.error('Erro ao iniciar o Venom: ' + err));

// ---------------------------
// FUNÇÃO PRINCIPAL
// ---------------------------
async function start(client) {
  logger.info("Bot iniciado com sucesso!");

  // ---------------------------
  // RECEBER MENSAGENS
  // ---------------------------
  client.onMessage(async message => {
    try {
      const texto = message.body?.toLowerCase() || '';

      if (texto === 'ping') {
        await client.sendText(message.from, 'pong');
      }

      if (texto === 'id') {
        await client.sendText(message.from, `Seu ID é: ${uuidv4()}`);
      }

      if (texto === 'aniversarios') {
        const lista = await listarAniversarios();
        await client.sendText(message.from, lista);
      }

    } catch (err) {
      logger.error("Erro ao responder mensagem: " + err);
    }
  });

  // Inicia o agendamento diário
  agendarExecucaoDiaria(() => enviarMensagensDeAniversario(client));
}

// ---------------------------
// AGENDAR EXECUÇÃO DIÁRIA ÀS 08:00
// ---------------------------
function agendarExecucaoDiaria(callback) {
  const agora = new Date();
  const proximaExecucao = new Date();

  proximaExecucao.setHours(8, 0, 0, 0); // 08:00

  if (agora > proximaExecucao) {
    proximaExecucao.setDate(proximaExecucao.getDate() + 1);
  }

  const tempoAteExecucao = proximaExecucao - agora;

  logger.info(`Próxima execução agendada para: ${proximaExecucao}`);

  setTimeout(() => {
    callback();
    agendarExecucaoDiaria(callback);
  }, tempoAteExecucao);
}

// ---------------------------
// LISTAR ANIVERSÁRIOS (comando manual)
// ---------------------------
async function listarAniversarios() {
  try {
    const dados = await getSheetData();
    let texto = "🎂 *Lista de aniversários cadastrados:*\n\n";

    for (let i = 1; i < dados.length; i++) {
      const [nome, data, numero] = dados[i];
      if (!nome || !data || !numero) continue;

      texto += `• ${nome} — ${data} — ${numero}\n`;
    }

    return texto;

  } catch (err) {
    logger.error("Erro ao listar aniversários: " + err);
    return "Erro ao acessar a planilha.";
  }
}

// ---------------------------
// ENVIO AUTOMÁTICO DE ANIVERSÁRIOS
// ---------------------------
async function enviarMensagensDeAniversario(client) {
  try {
    logger.info("Lendo aniversários do Google Sheets...");

    const dados = await getSheetData();
    const hoje = new Date().toISOString().slice(5, 10); // MM-DD

    for (let i = 1; i < dados.length; i++) {
      const [nome, data, numero] = dados[i];

      if (!nome || !data || !numero) continue;

      if (data === hoje) {
        await client.sendText(
          numero + '@c.us',
          `🎉 Feliz aniversário, ${nome}! 🎂`
        );
        logger.info(`Mensagem enviada para ${nome}`);
      }
    }

  } catch (err) {
    logger.error("Erro no envio automático: " + err);
  }
}
