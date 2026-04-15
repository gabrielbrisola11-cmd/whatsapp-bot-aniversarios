const venom = require('@open-wa/wa-automate-lite');
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
venom.create({
  sessionId: 'bot-aniversarios',
  headless: true,
  useChrome: false,
  disableSpins: true,
  logConsole: true
})
.then(client => start(client))
.catch(err => logger.error(err));

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
      if (message.body.toLowerCase() === 'ping') {
        await client.sendText(message.from, 'pong');
      }

      if (message.body.toLowerCase() === 'id') {
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

  // Se já passou das 08:00 hoje, agenda para amanhã
  if (agora > proximaExecucao) {
    proximaExecucao.setDate(proximaExecucao.getDate() + 1);
  }

  const tempoAteExecucao = proximaExecucao - agora;

  logger.info(`Próxima execução agendada para: ${proximaExecucao}`);

  setTimeout(() => {
    callback(); // executa às 08:00
    agendarExecucaoDiaria(callback); // agenda o próximo dia
  }, tempoAteExecucao);
}

// ---------------------------
// ENVIO AUTOMÁTICO DE ANIVERSÁRIOS
// ---------------------------
async function enviarMensagensDeAniversario(client) {
  try {
    logger.info("Executando rotina diária de aniversários...");

    const hoje = new Date().toISOString().slice(5, 10); // MM-DD

    // Exemplo de lista de aniversários
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
