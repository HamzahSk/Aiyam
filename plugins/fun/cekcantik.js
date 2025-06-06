exports.run = {
   usage: ['cekcantik'],
   use: 'tag atau reply',
   category: 'fun',
   async: async (m, {
      client,
      args,
      text,
      prefix,
      command,
      Func
   }) => {
      try {
         // Ambil target, bisa dari reply, mention, atau pengirim
         const target = m.quoted?.sender || m.mentionedJid[0] || m.sender
         const targetId = target.replace(/@s\.whatsapp\.net$/, '')
         
         // Generate random percentage with weighted probability for more fun results
         const persentase = Math.random() < 0.1 ? 
            Math.floor(95 + Math.random() * 6) : // 10% chance of being 95-100%
            Math.floor(Math.random() * 95)       // 90% chance of being 0-94%
         
         // More varied and fun comments
         const comments = [
            { range: [0, 10], texts: [
               'Kamu kayaknya perlu upgrade ke versi premium deh 😅',
               'Mending pake masker terus ya? 😷',
               'Cermin kamu auto restart kalau liat kamu 😂'
            ]},
            { range: [11, 30], texts: [
               'Lumayan lah buat jadi cameo di FTV 🫢',
               'Kamu tuh kayak WiFi - signalnya ada tapi lemot 🐢',
               'Jangan sedih, setidaknya kamu punya kepribadian... mungkin? 🤔'
            ]},
            { range: [31, 50], texts: [
               'Standar lah ya kayak nasi padang tanpa rendang 🍛',
               'Cantik sih, tapi masih kalah sama mamah mertua 🏃‍♂️',
               'Kayak motor matic - biasa aja tapi banyak yang pake 🛵'
            ]},
            { range: [51, 70], texts: [
               'Wah ada aura cantik natural nih! 🌸',
               'Kamu tuh kayak dark chocolate - makin lama makin enak 🍫',
               'Cantiknya stabil kayak harga BBM subsidi ⛽'
            ]},
            { range: [71, 85], texts: [
               'Duh, auto swipe right nih di Tinder! 🔥',
               'Kamu tuh kayak limited edition - langka dan berharga 💎',
               'Cantiknya bikin auto follow back 🫣'
            ]},
            { range: [86, 94], texts: [
               'Wadidaw! Ini mah level artis sinetron! 🌟',
               'Cantiknya over 9000! 💥',
               'Auto reject kalau nembak, soalnya gak level 😭'
            ]},
            { range: [95, 100], texts: [
               'INI MAH LEVEL DEWI KALI! 👑',
               'Kok bisa sih secantik ini? Illegal banget! 🚨',
               'Auto jadi wallpaper banyak orang nih 😍'
            ]}
         ]
         
         // Find the right comment category
         const category = comments.find(cat => 
            persentase >= cat.range[0] && persentase <= cat.range[1]
         )
         
         // Randomly select one comment from the category
         const komentar = category.texts[Math.floor(Math.random() * category.texts.length)]
         
         // Add some random emoji combinations
         const emojis = [
            '💖✨', '🌸🔥', '💎👑', '🌟💫', '🦋🌺', 
            '🍷🌹', '💐⚡', '🌙⭐', '💘🌌', '🍯🐝'
         ][Math.floor(Math.random() * 10)]
         
         // Create more dynamic text
         const teks = `${emojis} *CEK LEVEL CANTIK* ${emojis}\n\n` +
                       `👤 @${targetId}\n\n` +
                       `📊 *Hasil:* ${persentase}% Cantik\n` +
                       `💬 _${komentar}_\n\n` +
                       `📅 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
         
         // Send with cool effects
         await client.sendMessage(m.chat, {
            text: teks,
            mentions: [target]
         }, { quoted: m })
         
         // Add random reaction
         const reactions = ['❤', '🔥', '💯', '👑', '🌹', '💘']
         await client.sendReact(m.chat, reactions[Math.floor(Math.random() * reactions.length)], m.key)

      } catch (e) {
         console.error(e)
         client.reply(m.chat, `❌ Error: ${e.message}`, m)
      }
   },
   cache: true,
   cooldown: 120,
   location: __filename
}