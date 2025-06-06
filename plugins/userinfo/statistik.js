exports.run = {
  usage: ['botstat'],
  category: 'main',
  async: async (m, { client, Func }) => {
    const stats = global.db.statistic || {}
    const total = stats.totalResponses || 0
    const chatStats = stats.chatResponses || {}

    // Urutin berdasarkan respon terbanyak
    const sortedChats = Object.entries(chatStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    const list = sortedChats.map(([jid, count], i) => {
      const isGroup = jid.endsWith('@g.us')
      const name = isGroup ? `Grup ${i + 1}` : `User ${i + 1}`
      return `◦  *${name}* : ${Func.formatNumber(count)} respon`
    }).join('\n')

    const teks = `乂  *B O T - S T A T S*\n\n` +
                 `◦  *Total respon bot* : ${Func.formatNumber(total)} kali\n\n` +
                 `◦  *Top 10 chat aktif* :\n${list || 'Tidak ada data'}\n\n` +
                 global.footer

    client.reply(m.chat, teks, m)
  },
  error: false,
  cache: true,
  location: __filename
}