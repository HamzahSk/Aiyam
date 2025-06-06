const { Component } = require('@neoxr/wb')
const { Function: Func, NeoxrApi } = new Component
global.Api = new NeoxrApi('https://api.neoxr.my.id/api', process.env.API_KEY)
global.header = `© aiyam-bot v${require('package.json').version} (Beta)`
global.footer = Func.Styles(`✨Robot oleh aiyam ッ zah`)
global.status = Object.freeze({
   invalid: Func.Styles('❌ URL tidak valid!'),
   wrong: Func.Styles('📝 Formatnya salah nih.'),
   fail: Func.Styles('😭 Gagal mendapatkan metadata.'),
   error: Func.Styles('Terjadi kesalahan! 💥'),
   errorF: Func.Styles('🛠️ Maaf, fitur ini sedang bermasalah.'),
   premium: Func.Styles('👑 Fitur ini khusus untuk pengguna premium.'),
   register: Func.Styles('📝 Kamu harus mendaftar dulu untuk menggunakan fitur ini\n ketik .daftar untuk mendaftar ke bot'),
   auth: Func.Styles('🔒 Kamu tidak punya izin untuk fitur ini, tanya owner dulu ya.'),
   owner: Func.Styles('👑 Perintah ini hanya untuk owner bot.'),
   group: Func.Styles('💬 Perintah ini hanya bisa dipakai di grup.'),
   botAdmin: Func.Styles('🛡️ Aktifkan aku jadi admin dulu ya baru bisa.'),
   admin: Func.Styles('👮 Perintah ini khusus untuk admin grup.'),
   private: Func.Styles('💌 Pakai perintah ini di chat pribadi aja ya.'),
   gameSystem: Func.Styles('🎮 Fitur game lagi dinonaktifkan nih.'),
   gameInGroup: Func.Styles('🎮 Fitur game belum aktif di grup ini.'),
   gameLevel: Func.Styles('⏫ Level game kamu sudah maksimal, tidak bisa main lagi.')
})
