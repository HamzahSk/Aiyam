exports.run = {
    usage: ['haloo'],
    category: 'example',
    async: async (m, {
       client,
       Func,
    }) => {
       try {
      let user = global.db.users.find(v => v.jid == m.sender)
       const teks = await Func.getLang('mess.limit', { limit: user.limit })
          // custom disappearing message
          await client.reply(m.chat, teks)
       } catch (e) {
          client.reply(m.chat, Func.jsonFormat(e), m)
       }
    },
    error: false,
    private: true,
    cache: true,
    location: __filename
 }