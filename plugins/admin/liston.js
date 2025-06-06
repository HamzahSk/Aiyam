exports.run = {
  usage: ['liston'],
  category: 'admin tools',
  async: async (m, { client, args, Func }) => {
    try {
      const groupData = global.db.groups.find(v => v.jid === m.chat)
      if (!groupData || !groupData.member) {
        return m.reply('Data grup nggak ditemukan atau belum ada info member.')
      }

      const now = Date.now()
      const ONLINE_LIMIT = 5 * 60 * 1000 // 5 menit
      const onlineUsers = []

      for (let [jid, data] of Object.entries(groupData.member)) {
        if (data.lastseen && (now - data.lastseen < ONLINE_LIMIT)) {
          onlineUsers.push(jid)
        }
      }

      if (onlineUsers.length > 0) {
        let teks = '*📱 Pengguna yang online (aktif <5 menit):*\n\n'
        for (let jid of onlineUsers) {
          teks += `@${jid.replace(/@.+/, '')}\n`
        }
        await m.reply(teks, { mentions: onlineUsers })
      } else {
        m.reply('Nggak ada yang online sekarang, sepi amat grupnya...')
      }
    } catch (e) {
      console.log('Error di liston:', e)
      m.reply('Yah, error cuy. Coba bentar lagi ya.')
    }
  },
  owner: false,
  admin: true,
  group: true
}