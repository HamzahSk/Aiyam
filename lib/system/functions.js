const { Component } = require('@neoxr/wb')
const { Function: Func, Config: env } = new Component
const fs = require('fs');
const path = require('path');
const axios = require('axios')
const FormData = require('form-data')
const { fromBuffer } = require('file-type')
const { redis, redisConnected } = require('./redis') // Mengimpor konfigurasi dan status Redis
const storePath = path.join(__dirname, 'database', 'store.json');
const lang = JSON.parse(fs.readFileSync('./lib/lang.json'))
const cheerio = require('cheerio')
const fetch = require('node-fetch');
const https = require('https')
const http = require('http')
const { URL } = require('url')
const moment = require('moment-timezone');
const cloudinary = require('./cloudinary');

Func.uploadToCloudinary = async (filePath, isVideo = false) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: isVideo ? 'video' : 'auto', // auto biar fleksibel, atau 'video' buat mp4
      folder: 'upload', // opsional: buat klasifikasi file di dashboard cloudinary
      use_filename: true, // biar pake nama asli
      unique_filename: false // jangan randomin nama file
    });
    console.log('✅ Uploaded to Cloudinary:', result.secure_url);
    return result.secure_url;
  } catch (err) {
    console.error('❌ Upload error:', err.message || err);
    return null;
  }
}

Func.getTimeNow = async () => moment.tz(env.Timezone).valueOf()


Func.TelegraPh = async (buffer) => {
	return new Promise (async (resolve, reject) => {
		try {
			const form = new FormData();
			const input = Buffer.from(buffer);
			const { ext } = await fromBuffer(buffer);
			form.append('file', input, { filename: 'data.' + ext });
			const data = await axios.post('https://telegra.ph/upload', form, {
				headers: {
					...form.getHeaders()
				}
			})
			resolve('https://telegra.ph' + data.data[0].src)
		} catch (e) {
			reject(e)
		}
	})
}

Func.UguuSe = async (buffer) => {
	return new Promise (async (resolve, reject) => {
		try {
			const form = new FormData();
			const input = Buffer.from(buffer);
			const { ext } = await fromBuffer(buffer);
			form.append('files[]', input, { filename: 'data.' + ext });
			const data = await axios.post('https://uguu.se/upload.php', form, {
				headers: {
					...form.getHeaders()
				}
			})
			resolve(data.data.files[0])
		} catch (e) {
			reject(e)
		}
	})
}

Func.webp2mp4File = async (path) => {
	return new Promise((resolve, reject) => {
		const form = new FormData();
		 form.append('new-image-url', '')
		 form.append('new-image', fs.createReadStream(path))
		 axios({
			  method: 'post',
			  url: 'https://s6.ezgif.com/webp-to-mp4',
			  data: form,
			  headers: {
				   'Content-Type': `multipart/form-data; boundary=${form._boundary}`
			  }
		 }).then(({ data }) => {
			  const FormDataThen = new FormData()
			  const $ = cheerio.load(data)
			  const file = $('input[name="file"]').attr('value')
			  FormDataThen.append('file', file)
			  FormDataThen.append('convert', "Convert WebP to MP4!")
			  axios({
				   method: 'post',
				   url: 'https://ezgif.com/webp-to-mp4/' + file,
				   data: FormDataThen,
				   headers: {
						'Content-Type': `multipart/form-data; boundary=${FormDataThen._boundary}`
				   }
			  }).then(({ data }) => {
				   const $ = cheerio.load(data)
				   const result = 'https:' + $('div#output > p.outfile > video > source').attr('src')
				   resolve({
						status: true,
						message: "Created By MRHRTZ",
						result: result
				   })
			  }).catch(reject)
		 }).catch(reject)
	})
}

Func.getfilesize = async (url) => {
      return new Promise((resolve, reject) => {
         try {
            const { protocol } = new URL(url)
            const mod = protocol === 'https:' ? https : http

            const req = mod.request(url, {
               method: 'HEAD'
            }, res => {
               const length = res.headers['content-length']
               if (!length) return resolve({ size: 0, formatted: '0 MB' })

               const sizeInMB = Number(length) / (1024 * 1024)
               resolve({
                  size: sizeInMB,
                  formatted: `${sizeInMB.toFixed(2)} MB`
               })
            })

            req.on('error', reject)
            req.end()
         } catch (e) {
            resolve({ size: 0, formatted: '0 MB' }) // fallback biar gak error
         }
      })
}

Func.toRupiah = async (jumlah, withDecimals = true) => {
    // Handle invalid input
    if (isNaN(jumlah)) jumlah = 0;
    
    // Format bagian utama
    let parts = parseInt(jumlah).toString().split('.');
    let ribuan = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Format desimal jika needed
    let desimal = '';
    if (withDecimals) {
        desimal = ',' + (jumlah.toFixed(2).split('.')[1] || '00');
    }
    
    return 'Rp ' + ribuan + desimal;
}

Func.parseRupiah = async (rupiahString) => {
    return parseFloat(
        rupiahString.replace(/[^\d,-]/g, '')
                   .replace(',', '.')
                   .replace(/\.(?=.*\.)/g, '')
    ) || 0;
}

Func.getStore = async (jid) => {
   const storeKey = `store:${jid}`
   let oldData = {}

   try {
      const cached = await redis.get(storeKey)
      oldData = cached ? JSON.parse(cached) : {}
   } catch (err) {
      console.log('[REDIS] Gagal ambil data StoreR:', err)
   }

   return {
      data: oldData,
      save: async (updated = {}) => {
         try {
            const final = structuredClone(oldData)

            for (const key in updated) {
               // Gabung kalau bentuknya object (biar snipe/messages gak ke-replace total)
               if (typeof updated[key] === 'object' && !Array.isArray(updated[key])) {
                  final[key] = { ...(final[key] || {}), ...updated[key] }
               } else {
                  final[key] = updated[key]
               }
            }

            await redis.set(storeKey, JSON.stringify(final), { EX: 259200 })
         } catch (err) {
            console.log('[REDIS] Gagal simpen data StoreR:', err)
         }
      }
   }
}

Func.jadwalCheck = async (client, groupSet, groupMetadata) => {
  if (!groupSet || !groupSet.jid) return;

  const now = new Date(await Func.getTimeNow());
  const jam = now.getHours().toString().padStart(2, '0');
  const menit = now.getMinutes().toString().padStart(2, '0');
  const currentHM = `${jam}:${menit}`;

  if (!groupSet.jadwal || !Array.isArray(groupSet.jadwal)) return;
  if (!groupSet.lastExec) groupSet.lastExec = {};

  const isAnnouncement = groupMetadata.announce;

  for (let jadwal of groupSet.jadwal) {
    const jadwalKey = `${jadwal.time}_${jadwal.action}`;
    const lastExecTime = groupSet.lastExec[jadwalKey];
    const currentKeyTimestamp = `${now.toISOString().split('T')[0]}_${currentHM}`;

    if (jadwal.time === currentHM && lastExecTime !== currentKeyTimestamp) {
      const willClose = jadwal.action === 'close';
      
      // Cek apakah perlu diubah statusnya
      if ((willClose && !isAnnouncement) || (!willClose && isAnnouncement)) {
        // Perlu diubah
        try {
          await client.groupSettingUpdate(groupSet.jid, willClose ? 'announcement' : 'not_announcement');
          await client.sendMessage(groupSet.jid, {
            text: `*Grup berhasil di-${jadwal.action} pada jam ${jadwal.time} WIB*`
          });
        } catch (e) {
          console.log(`Gagal update group ${groupSet.jid}:`, e);
        }
      } else {
        // Status udah sesuai, jadi ga perlu diapa2in
        await client.sendMessage(groupSet.jid, {
          text: `*Grup udah dalam status '${jadwal.action}', jadwal jam ${jadwal.time} WIB dilewati ya.*`
        });
      }

      groupSet.lastExec[jadwalKey] = currentKeyTimestamp;
      const index = global.db.groups.findIndex(v => v.jid === groupSet.jid);
      if (index !== -1) global.db.groups[index] = groupSet;
    }
  }
};

Func.msgLog = async (msg, conn) => {
  try {
    if (!msg.message) return

    // Langsung proses msg tanpa serialize
    const m = msg

    const from = m.from.endsWith('@g.us') ? m.pushName || 'Tanpa Nama' : m.senderName || 'Tanpa Nama'
    const contentType = Object.keys(m.message || {})[0] || 'Unknown'

    const logTime = chalk.gray(new Date().toLocaleTimeString())
    const fromUser = chalk.cyanBright(from)
    const messageType = chalk.magenta(contentType.toUpperCase())

    const textPreview = (() => {
      if (m.type === 'conversation' || m.type === 'extendedTextMessage') {
        return chalk.yellow(`"${m.body?.slice(0, 50)}"`)
      } else if (m.type === 'imageMessage') {
        return chalk.green('[Image]')
      } else if (m.type === 'videoMessage') {
        return chalk.green('[Video]')
      } else if (m.type === 'stickerMessage') {
        return chalk.green('[Sticker]')
      } else {
        return chalk.gray('[Non-text]')
      }
    })()

    console.log(`${logTime} ${fromUser} >> ${messageType} ${textPreview}`)
  } catch (err) {
    console.log(chalk.red('[LOG ERROR]'), err)
  }
}

Func.uploadTmpFile = async (buffer) => {
   const fileInfo = await fromBuffer(buffer)
   if (!fileInfo || !fileInfo.ext || !fileInfo.mime) {
      throw new Error('Jenis file gak dikenali.')
   }

   const form = new FormData()
   form.append('file', buffer, {
      filename: `tmp.${fileInfo.ext}`,
      contentType: fileInfo.mime
   })

   try {
      const { data } = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
         headers: form.getHeaders()
      })

      if (!data?.data?.url) throw new Error('Upload gagal atau response-nya aneh.')

      const match = /https?:\/\/tmpfiles\.org\/(.*)/.exec(data.data.url)
      if (!match || !match[1]) throw new Error('Gagal parsing ID file dari URL.')

      return `https://tmpfiles.org/dl/${match[1]}`
   } catch (err) {
      console.error('Upload Error:', err.message)
      throw err
   }
}

Func.parseTemplate = async (template, data = {}) => {
  return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
    return key in data ? data[key] : ''; // Bisa juga `[${key}]` kalo mau tandain kunci yg ga ada
  });
};

Func.getLang = async (key, data = {}) => {
  const keys = key.split('.');
  let template = lang;

  for (const k of keys) {
    template = template?.[k];
  }

  if (!template) return key; // fallback kalo kunci ga ketemu

  return await Func.parseTemplate(template, data);
};

Func.spam = async (m) => {
   let user = global.db.users.find(v => v.jid === m.sender)
   if (!user) return { ignore: false, banned: false }

   const nowJakarta = await Func.getTimeNow();

   // Init data spam
   if (!user._spam) {
      user._spam = {
         count: 0,
         last: 0,
         reset: nowJakarta + 180000
      }
   }

   // Cek apakah masih kebanned
   if (user.banned && user.ban_temporary > nowJakarta) {
      let sisa = user.ban_temporary - nowJakarta
      let menit = Math.floor(sisa / 60000)
      return {
         ignore: true,
         banned: true,
         message: `Lu masih dibanned karena spam, tunggu sekitar ${menit} menit lagi ya.`
      }
   } else if (user.banned && user.ban_temporary <= nowJakarta) {
      user.banned = false
      user.ban_temporary = 0
   }

   // Reset tiap 3 menit
   if (nowJakarta >= user._spam.reset) {
      user._spam.count = 0
      user._spam.reset = nowJakarta + 180000
   }

   // Deteksi spam
   if (nowJakarta - user._spam.last < 3000) {
      user._spam.count++

      // Warning sebelum banned
      if (user._spam.count === 2) {
         return {
            ignore: true,
            banned: false,
            message: 'Santai napa... Jangan spam, bisa kena banned 3 jam loh!'
         }
      }

      if (user._spam.count >= 3) {
         user.banned = true
         user.ban_temporary = nowJakarta + (3 * 60 * 60 * 1000) // banned 3 jam
         user.ban_times = (user.ban_times || 0) + 1
         user._spam.count = 0

         return {
            ignore: true,
            banned: true,
            message: 'Lu dibanned 3 jam karena spam berturut-turut.'
         }
      }

      return { ignore: true, banned: false }
   }

   user._spam.last = nowJakarta
   return { ignore: false, banned: false }
}

Func.getStoreFallback = async (jid) => {
    // Pastikan folder database ada
    if (!fs.existsSync(path.dirname(storePath))) {
        fs.mkdirSync(path.dirname(storePath), { recursive: true });
    }

    // Baca atau inisialisasi file store
    let allData = {};
    if (fs.existsSync(storePath)) {
        try {
            allData = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
        } catch (err) {
            console.error('[STORE] Error reading local store:', err);
            allData = {};
        }
    }

    const storeKey = `store:${jid}`;
    const oldData = allData[storeKey] || {};

    return {
        data: oldData,
        save: async (updated = {}) => {
            try {
                const final = JSON.parse(JSON.stringify(oldData)); // Deep clone

                // Gunakan logika merge yang sama dengan Func.getStore
                for (const key in updated) {
                    if (typeof updated[key] === 'object' && !Array.isArray(updated[key])) {
                        final[key] = { ...(final[key] || {}), ...updated[key] };
                    } else {
                        final[key] = updated[key];
                    }
                }

                // Update data dan simpan ke file
                allData[storeKey] = final;
                fs.writeFileSync(storePath, JSON.stringify(allData, null, 2));
            } catch (err) {
                console.error('[STORE] Error saving to local store:', err);
            }
        }
    };
}


Func.yourFunc1 = async (url) => {
   // Your code here
}

Func.yourFunc2 = async (url) => {
   // Your code here
}

// etc ...