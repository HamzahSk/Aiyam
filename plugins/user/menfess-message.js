exports.run = {
  async: async (m, { client, body }) => {
    try {
      const sender = m.sender;
      global.db.menfess = global.db.menfess || {};
      const session = global.db.menfess[sender];
      
      if (!session || !m.text) return;
      if (m.text.length > 500) return client.reply(m.chat, '❌ Pesan terlalu panjang (max 500 karakter)', m);
      if (session.expiredAt < Date.now()) {
        delete global.db.menfess[sender];
        delete global.db.menfess[session.target];
        return client.reply(m.chat, '⏳ Sesi menfess berakhir', m);
      }
      
      const target = session.target;
      const isOrigin = session.alias !== 'Anonymous';
      const timeLeft = Math.max(0, session.expiredAt - Date.now());
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      
      await client.sendMessage(target, {
        text: `💌 *Pesan ${isOrigin ? 'dari ' + session.alias : 'Anonymous'}*:\n\n${body}\n\n> Sisa waktu: ${minutes}m ${seconds}s`,
        mentions: [target],
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true
        }
      });
      
      client.reply(m.chat, `✅ Terkirim ke ${!isOrigin ? session.alias : 'Anonymous'} \n> Sisa: ${minutes}m ${seconds}s`, m);
        
    } catch (e) {
      console.error(e);
      client.reply(m.chat, '❌ Gagal mengirim pesan.', m);
    }
  },
  error: false,
  cache: true,
  location: __filename
};
/*
// Session cleaner
setInterval(() => {
  if (!global.db.menfess) return;
  
  const now = Date.now();
  for (const [jid, session] of Object.entries(global.db.menfess)) {
    if (session.expiredAt < now) {
      delete global.db.menfess[jid];
      delete global.db.menfess[session.target];
      client.sendMessage(jid, { text: '⏳ Sesi menfess berakhir otomatis'}).catch(console.error);
      client.sendMessage(session.target, { text: '⏳ Sesi menfess berakhir otomatis (5 menit)'}).catch(console.error);
    }
  }
}, 30000);
*/