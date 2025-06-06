exports.run = {
  usage: ['endmenfess'],
  category: 'special',
  async: async (m, { client, isPrefix }) => {
    try {
      const sender = m.sender;
      global.db.menfess = global.db.menfess || {};
      
      const session = global.db.menfess[sender];
      if (!session) return client.reply(m.chat, 
        `⚠️ *Tidak ada sesi menfess aktif!*\n\nKamu tidak sedang dalam sesi menfess.`, m);
      
      const target = session.target;
      const isOrigin = session.alias !== 'Anonymous';
      const partnerAlias = isOrigin 
        ? 'Anonymous' 
        : (global.db.menfess[target]?.alias || 'Teman Misterius');
      
      delete global.db.menfess[sender];
      delete global.db.menfess[target];
      
      await client.reply(m.chat, 
        `✅ *Sesi menfess diakhiri!*\n\n• Dengan: ${isOrigin ? 'Anonymous' : partnerAlias}\n\nGunakan *${isPrefix}menfess* untuk sesi baru.`, m);
      
      await client.sendMessage(target, {
        text: `🔚 *Sesi menfess diakhiri!*\n\n• Oleh: ${isOrigin ? partnerAlias : 'Anonymous'}\n\nTerima kasih!`,
        mentions: [target]
      });

    } catch (e) {
      console.error(e);
      return client.reply(m.chat, '❌ Gagal mengakhiri sesi. Silakan coba lagi.', m);
    }
  },
  error: false,
  location: __filename
};