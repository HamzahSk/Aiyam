exports.run = {
  async: async (m, { client, env, setting }) => {
  
    const now = Date.now()
    const db = global.db
    if (typeof setting.autobio === 'undefined') {
        setting.autobio = false
    }
 if (setting.autobio) {
    // Pastikan struktur data tersedia
    if (!db.data) db.data = {}
    if (!db.data.lastAutoBio) db.data.lastAutoBio = 0

    const lastUpdated = db.data.lastAutoBio || 0
    const sudah3Menit = now - lastUpdated >= 3 * 60 * 1000

    if (!sudah3Menit) return // Skip kalo belum 3 menit

    db.data.lastAutoBio = now // Update timestamp sekarang

    try {
      const jam = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      })

      const tanggal = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      })

      const uptimeMs = process.uptime() * 1000
      const totalDetik = Math.floor(uptimeMs / 1000)
      const jamRuntime = Math.floor(totalDetik / 3600)
      const menitRuntime = Math.floor((totalDetik % 3600) / 60)
      const detikRuntime = totalDetik % 60
      const runtimeStr = `${jamRuntime}j ${menitRuntime}m ${detikRuntime}s`

      const totalUser = db?.users?.length || 0
      const totalOwner = Array.isArray(global.owner) ? global.owner.length : env.owner

      const bioBaru = `⏰ ${jam} WIB | 📅 ${tanggal} | 🕒 Runtime: ${runtimeStr} | 👥 ${totalUser} User | 👑 ${totalOwner} Owner`

      await client.updateProfileStatus(bioBaru)
      //console.log('[AUTO BIO] Bio berhasil diupdate:', bioBaru)
    } catch (err) {
      console.error('[AUTO BIO ERROR]', err)
    }
 }
  },
  error: false,
  cache: true,
  location: __filename
}