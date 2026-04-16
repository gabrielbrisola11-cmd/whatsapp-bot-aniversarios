const venom = require('venom-bot');
const axios = require('axios');
const dotenv = require('dotenv');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

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
  transports: [
    new winston.transports.Console()
  ]
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
// ENVIO AUTOMÁTICO DE ANIVERSÁRIOS
// ---------------------------
async function enviarMensagensDeAniversario(client) {
  try {
    logger.info("Executando rotina diária de aniversários...");

    const hoje = new Date().toISOString().slice(5, 10); // MM-DD

    const aniversarios = [
      { nome: "João", data: "04-15", numero: "5511999999999@c.us" },
      { nome: "Maria", data: "04-20", numero: "5511888888888@c.us" }
    ];

    aniversarios.forEach(async pessoa => {
      if (pessoa.data === hoje) {
        await client.sendText(
          pessoa.numero,
          `🎉 Feliz aniversário, ${pessoa.nome}! 🎂`
        );
        logger.info(`Mensagem enviada para ${pessoa.nome}`);
      }
    });

  } catch (err) {
    logger.error("Erro no envio automático: " + err);
  }
}
