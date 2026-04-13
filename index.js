import venom from 'venom-bot';
import { google } from 'googleapis';
import cron from 'node-cron';

// ===============================
// CONFIGURAÇÃO DO GOOGLE SHEETS
// ===============================

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});

const sheets = google.sheets({ version: 'v4', auth });

// ID da sua planilha
const SPREADSHEET_ID = '1YLP8JR7AARn8hityU2hpukp_g3EZY4tHbBAJxUpF0CI';

// Nome da aba e colunas
const RANGE = 'Página1!A:C';

// ===============================
// FUNÇÃO PARA LER ANIVERSARIANTES
// ===============================

async function verificarAniversariantes(client) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('Planilha vazia.');
      return;
    }

    const hoje = new Date();
    const dia = hoje.getDate();
    const mes = hoje.getMonth() + 1;

    const aniversariantes = rows.filter((linha) => {
      const [nome, data] = linha;
      if (!data) return false;

      const [ano, mesNasc, diaNasc] = data.split('-').map(Number);
      return diaNasc === dia && mesNasc === mes;
    });

    if (aniversariantes.length === 0) {
      console.log('Nenhum aniversariante hoje.');
      return;
    }

    for (const pessoa of aniversariantes) {
      const nome = pessoa[0];
      const mensagem = `🎉 *Hoje é aniversário de ${nome}!* 🎉\n\nParabéns! 🎂🥳`;

      await client.sendText(
        '5511996774201-1619623995@g.us', // ID do seu grupo
        mensagem
      );
    }

    console.log('Mensagens enviadas com sucesso!');
  } catch (error) {
    console.error('Erro ao verificar aniversariantes:', error);
  }
}

// ===============================
// INICIALIZAÇÃO DO BOT
// ===============================

venom
  .create({
    session: 'bot-aniversarios',
    multidevice: true,
    headless: true,
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-dev-tools',
      '--no-zygote',
      '--single-process'
    ]
  })
  .then((client) => {
    console.log('Bot iniciado com sucesso!');

    // Executa imediatamente ao iniciar
    verificarAniversariantes(client);

    // ===============================
    // CRON DIÁRIO ÀS 08:00
    // ===============================
    cron.schedule(
      '0 8 * * *',
      () => {
        verificarAniversariantes(client);
      },
      {
        timezone: 'America/Sao_Paulo'
      }
    );

    console.log('Agendador configurado para 08:00 todos os dias.');
  })
  .catch((error) => console.error(error));
