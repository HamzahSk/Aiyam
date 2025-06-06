exports.run = {
  async: async (m, { client, body }) => {
    try {
      const text = body.trim().toLowerCase();
      const sender = m.sender;

      global.db._menfessConfirm = global.db._menfessConfirm || {};
      global.db.menfess = global.db.menfess || {};

      // Simpan client ke global buat dipakai di setInterval
      if (!global._menfessClient) global._menfessClient = client;

      const conf = global.db._menfessConfirm[sender];
      if (!conf) return;

      if (text === 'y') {
        const sessionId = 'MF-' + Date.now().toString(36);
        const expiredAt = Date.now() + 300000; // 5 menit

        // Buat sesi dua arah
        global.db.menfess[sender] = {
          target: conf.target,
          alias: conf.alias,
          sessionId,
          expiredAt
        };

        global.db.menfess[conf.target] = {
          target: sender,
          alias: 'Anonymous',
          sessionId,
          expiredAt
        };

        delete global.db._menfessConfirm[sender];

        await client.reply(m.chat,
          `✅ *Sesi Menfess Dimulai!*\n\n• Nama: *${conf.alias}*\n• Target: ${conf.target.split('@')[0]}\n• Durasi: 5 menit\n\nKirim pesan apapun akan diteruskan ke target.`,
          m
        );

        await client.sendMessage(conf.target, {
          text: `💌 *Kamu Dapat Menfess!*\n\n• Dari: *${conf.alias}*\n• Durasi: 5 menit\n\nBalas pesan ini untuk balas anonim.\n\n> ketik .endmenfess untuk mengakhiri`,
          mentions: [conf.target]
        });

        // Timer buat ngapus session setelah 5 menit
        setTimeout(async () => {
          const s = global.db.menfess[sender];
          if (s?.sessionId === sessionId) {
            delete global.db.menfess[sender];
            if (global.db.menfess[s.target]?.sessionId === sessionId) {
              delete global.db.menfess[s.target];
            }
            client.reply(m.chat, '⏳ Sesi menfess berakhir otomatis (5 menit)', m).catch(console.error);
            client.sendMessage(s.target, {
              text: '⏳ Sesi menfess berakhir otomatis (5 menit)'
            }).catch(console.error);
          }
        }, 300000);

      } else if (text === 'n') {
        delete global.db._menfessConfirm[sender];
        client.reply(m.chat, '❌ Sesi menfess dibatalkan!', m);
      }

    } catch (e) {
      console.error(e);
      client.reply(m.chat, '❌ Gagal memproses menfess.', m);
    }
  },
  error: false,
  cache: true,
  location: __filename
};

// Session Cleaner
setInterval(() => {
  if (!global.db.menfess || !global._menfessClient) return;

  const now = Date.now();
  for (const [jid, session] of Object.entries(global.db.menfess)) {
    if (session.expiredAt < now) {
      const targetSession = global.db.menfess[session.target];
      if (targetSession?.sessionId === session.sessionId) {
        delete global.db.menfess[session.target];
        global._menfessClient.sendMessage(session.target, {
          text: '⏳ Sesi menfess berakhir otomatis (5 menit)'
        }).catch(console.error);
      }

      delete global.db.menfess[jid];
      global._menfessClient.sendMessage(jid, {
        text: '⏳ Sesi menfess berakhir otomatis (5 menit)'
      }).catch(console.error);
    }
  }
}, 60000); // per 1 menit cek expired session