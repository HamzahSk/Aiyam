exports.run = {
   async: async (m, { client, body, users, Func, env }) => {
      try {
         let jid = m.sender;

         if (typeof users.hasBeenWelcomed === 'undefined') {
            users.hasBeenWelcomed = false;
         }

         if (m.isGroup) {
            if (body && body.startsWith('.') && !users.hasBeenWelcomed) {
               await sendWelcomeMessage(client, jid, env, m);
               users.hasBeenWelcomed = true;
            }
            return;
         }

         if (!users.hasBeenWelcomed) {
            await sendWelcomeMessage(client, jid, env, m);
            users.hasBeenWelcomed = true;
         }

      } catch (e) {
         return client.reply(m.chat, Func.jsonFormat(e), m);
      }
   },
   error: false,
   cache: true,
   location: __filename
};

async function sendWelcomeMessage(client, jid, env, m) {
   const welcomeMessage = `
🌟 *SELAMAT DATANG* 🌟

Hai @${jid.split('@')[0]}! 👋
Aku adalah bot WhatsApp yang siap membantumu.

📌 *CARA PENGGUNAAN*:
1. Ketik *.menu* untuk lihat semua perintah
2. Gunakan prefix *.* (titik) sebelum perintah
3. Jangan spam bot ya!

📜 *PERATURAN*:
- Dilarang kirim konten NSFW
- Jangan mention bot sembarangan
- Bot bisa banned kamu kalau ngelanggar

Butuh bantuan? Ketik *.help*
`
try {
   await client.sendIAMessage(jid, 
         [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Lihat Menu', id: `.menu`}) }], 
         m, {
             header: `Sambutan dari ${env.bot_name} bot`,
             content: welcomeMessage,
             footer: global.footer 
   })
} catch (e) {
   await client.sendMessage(jid, {
      text: welcomeMessage,
      mention: [jid]
   }, {quoted: m});
}
}