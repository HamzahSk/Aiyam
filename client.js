"use strict";

// Konfigurasi awal
require('events').EventEmitter.defaultMaxListeners = 500;
const { Component } = require('@neoxr/wb');
const { Baileys, Function: Func, Config: env } = new Component();
const fs = require('fs');
const path = require('path');
const colors = require('@colors/colors');
const { NodeCache } = require('@cacheable/node-cache');
const cache = new NodeCache({ stdTTL: env.cooldown });

// Load modul sistem
require('./lib/system/functions');
require('./lib/system/scraper');
require('./lib/system/config');
const { redis } = require('./lib/system/redis');

class WhatsAppClient {
  async getSessionHandler() {
    if (!process?.env?.DATABASE_URL) return null;
    
    if (/mongo/.test(process.env.DATABASE_URL)) {
      return require('@session/mongo').useMongoAuthState;
    } 
    if (/postgres/.test(process.env.DATABASE_URL)) {
      return require('@session/postgres').usePostgresAuthState;
    }
    return null;
  }

  async getDatabaseInstance() {
    if (!process?.env?.DATABASE_URL) {
      return require('@database/local').createDatabase(env.database);
    }
    
    if (/mongo/.test(process.env.DATABASE_URL)) {
      return require('@database/mongo').createDatabase(
        process.env.DATABASE_URL, 
        env.database, 
        'database'
      );
    } 
    if (/postgres/.test(process.env.DATABASE_URL)) {
      return require('@database/postgres').createDatabase(
        process.env.DATABASE_URL, 
        env.database
      );
    }
    
    return require('@database/local').createDatabase(env.database);
  }

  async connect() {
    try {
      const session = await this.getSessionHandler();
      const database = await this.getDatabaseInstance();
      
            if (/mongo/.test(process.env.DATABASE_URL)) {
  const { autoDeleteOldData } = await session(process.env.DATABASE_URL, 'session-aiyam');
  if (typeof autoDeleteOldData === 'function') {
    setInterval(async () => {
      try {
        await autoDeleteOldData();
        console.log('[SESSION CLEANER] ✅ Sesi lama dihapus otomatis');
      } catch (e) {
        console.error('[SESSION CLEANER] ❌ Gagal hapus sesi lama:', e);
      }
    }, 30 * 60 * 1000); // tiap 0,5 jam
  }
}


      const client = new Baileys({
        type: '--neoxr-v1',
        plugsdir: 'plugins',
        session: session ? session(process.env.DATABASE_URL, 'session-aiyam') : 'session',
        online: true,
        bypass_disappearing: true,
        bot: id => {
          if (!id) return false;
          return (id.startsWith('3EB0') && id.length === 40) || 
                 id.startsWith('BAE') || 
                 /[-]/.test(id);
        },
        version: [2, 3000, 1023223821]
      }, {
        shouldIgnoreJid: jid => /(newsletter|bot)/.test(jid)
      });

      this.setupEventHandlers(client, database);
      return client;
    } catch (e) {
      console.error(colors.red('[CONNECTION ERROR]'), e);
      throw e;
    }
  }

  setupEventHandlers(client, database) {
    client.once('connect', async res => this.handleConnection(res, database));
    client.on('error', error => this.handleError(error));
    client.once('ready', () => this.setupSystemTasks(client, database));
    client.register('message', async ctx => this.handleMessage(client, database, ctx));
    client.register('message.delete', async ctx => this.handleDeletedMessage(client, ctx));
    client.register('presence.update', async update => this.handlePresenceUpdate(client, update));
    client.register('group.add', async ctx => this.handleGroupAdd(client, ctx));
    client.register('group.remove', async ctx => this.handleGroupRemove(client, ctx));
    client.register('caller', ctx => {
      if (typeof ctx !== 'boolean') client.sock.updateBlockStatus(ctx.jid, 'block');
    });
  }

  // Handler Functions
  async handleConnection(res, database) {
    global.db = { 
      users: [], 
      chats: [], 
      groups: [], 
      statistic: {}, 
      sticker: {}, 
      setting: {}, 
      ...(await database.fetch() || {}) 
    };
    await database.save(global.db);
    if (res?.message) Func.logFile(res.message);
  }

  async handleError(error) {
    const errMsg = error?.message || String(error);
    console.log(colors.red('[ERROR]'), errMsg);
    Func.logFile(errMsg);
    
    if (errMsg.includes('Connection closed')) {
      console.log(colors.yellow('[INFO] Koneksi tertutup, mencoba reconnect...'));
      this.connect();
    }
  }

  async handleMessage(client, database, ctx) {
    const m = ctx.m;
    if (m.fromMe) return;

    const sender = m?.sender || m?.key?.participant || m?.key?.remoteJid;
    const chat_id = m.chat;
    const isGroup = m.isGroup;
    const limit = isGroup ? 500 : 150;

    const { data: StoreR, save } = redis?.status === 'ready' 
      ? await Func.getStore(chat_id) 
      : await Func.getStoreFallback(chat_id);

    // Inisialisasi penyimpanan pesan
    StoreR.messages = StoreR.messages || {};
    StoreR.messages[chat_id] = StoreR.messages[chat_id] || [];
    
    // Tambahkan pesan baru dan batasi jumlah
    StoreR.messages[chat_id].push({
      sender,
      name: m.pushName,
      isGroup,
      text: m.text || ctx.text || '',
      timestamp: m.messageTimestamp,
      id: m.key?.id
    });
    
    while (StoreR.messages[chat_id].length > limit) {
      StoreR.messages[chat_id].shift();
    }

    // Update statistik
    if (sender) {
      StoreR.stats = StoreR.stats || {};
      StoreR.stats[sender] = (StoreR.stats[sender] || 0) + 1;
    }

    // Proses handler
    await require('./handler')(client.sock, { ...ctx, database, StoreR });
    require('./lib/system/baileys')(client.sock);
    
    // Simpan perubahan
    await save({ messages: StoreR.messages, stats: StoreR.stats });
  }

  async handleDeletedMessage(client, ctx) {
    const sock = client.sock;
    const msg = ctx.message;
    if (!msg || msg.key?.fromMe || msg.isBot || !msg.sender) return;

    const filePath = path.join(__dirname, 'delete.json');
    const sender = msg.sender;
    const jid = msg.chat;
    if (!sender || !jid) return;

    // Baca/muat data yang ada
    let data = {};
    if (fs.existsSync(filePath)) {
      try {
        data = JSON.parse(fs.readFileSync(filePath));
      } catch (err) {
        console.error('Gagal baca file delete.json:', err);
      }
    }

    // Tambahkan entri baru
    data[jid] = data[jid] || [];
    data[jid].push({
      from: msg.pushName || 'Tidak diketahui',
      text: msg.text || msg.caption || '[Pesan non-teks]',
      time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    });

    // Batasi jumlah entri
    if (data[jid].length > 10) data[jid].shift();

    // Simpan ke file
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Gagal simpan delete.json:', err);
    }

    // Handle antidelete grup
    const isGroup = msg.isGroup || jid.endsWith('@g.us');
    const groupSet = global.db.groups.find(v => v.jid === jid);
    if (isGroup && groupSet?.antidelete) {
      try {
        await sock.copyNForward(jid, msg);
      } catch (err) {
        console.log('Gagal forward pesan dihapus:', err);
      }
    }
  }

  async handlePresenceUpdate(client, update) {
    if (!update || !update.id.endsWith('g.us')) return;
    
    const sock = client.sock;
    const { id, presences } = update;
    
    for (let jid in presences) {
      if (!presences[jid] || jid == sock.decodeJid(sock.user.id)) continue;
      
      const isTyping = ['composing', 'recording'].includes(presences[jid].lastKnownPresence);
      const user = global.db?.users?.find(v => v.jid == jid);
      
      if (isTyping && user?.afk > -1) {
        const teks = await Func.getLang('client.afk', { 
          username: jid.replace(/@.+/, ''), 
          duration: Func.texted('bold', Func.toTime(new Date - user.afk)), 
          reason: user.afkReason || 'Rahasia... 😉' 
        });

        sock.reply(id, teks, user.afkObj);
        user.afk = -1;
        user.afkReason = '';
        user.afkObj = {};
      }
    }
  }

  async handleGroupAdd(client, ctx) {
    const sock = client.sock;
    if (!global.db?.groups) return;
    
    const groupSet = global.db.groups.find(v => v.jid == ctx.jid);
    let profilePic;
    
    try {
      profilePic = await sock.profilePictureUrl(ctx.member, 'image') || 'https://qu.ax/uPqo.jpg';
    } catch {
      profilePic = 'https://qu.ax/uPqo.jpg';
    }

    // Cek localonly
    if (groupSet?.localonly) {
      const user = global.db.users.find(v => v.jid == ctx.member);
      const isForeign = !ctx.member.startsWith('62');
      
      if ((user && !user.whitelist && isForeign) || isForeign) {
        const tex = await Func.getLang('client.localonly', { 
          tag: `@${ctx.member.split`@`[0]}` 
        });
        
        sock.reply(ctx.jid, Func.texted('bold', tex));
        sock.updateBlockStatus(ctx.member, 'block');
        
        await Func.delay(2000);
        await sock.groupParticipantsUpdate(ctx.jid, [ctx.member], 'remove');
        return;
      }
    }

    // Kirim welcome message
    if (groupSet?.welcome) {
      const defaultText = await Func.getLang('client.welcome', { 
        tag: `@${ctx.member.split`@`[0]}`, 
        grup: ctx.subject 
      });
      
      const customText = groupSet.text_welcome
        ? groupSet.text_welcome
            .replace('+tag', `@${ctx.member.split('@')[0]}`)
            .replace('+grup', ctx.subject) 
        : defaultText;
      
      sock.sendMessageModify(ctx.jid, customText, null, {
        largeThumb: true,
        thumbnail: profilePic,
        url: global.db.setting.link
      });
    }
  }

  async handleGroupRemove(client, ctx) {
    const sock = client.sock;
    if (!global.db?.groups) return;
    
    const groupSet = global.db.groups.find(v => v.jid == ctx.jid);
    let profilePic;
    
    try {
      profilePic = await sock.profilePictureUrl(ctx.member, 'image') || 'https://qu.ax/uPqo.jpg';
    } catch {
      profilePic = 'https://qu.ax/uPqo.jpg';
    }
    
    // Kirim left message
    if (groupSet?.left) {
      const defaultText = await Func.getLang('client.remove', { 
        tag: `@${ctx.member.split`@`[0]}`, 
        grup: ctx.subject 
      });
      
      const customText = groupSet.text_left
        ? groupSet.text_left
            .replace('+tag', `@${ctx.member.split('@')[0]}`)
            .replace('+grup', ctx.subject) 
        : defaultText;
      
      sock.sendMessageModify(ctx.jid, customText, null, {
        largeThumb: true,
        thumbnail: profilePic,
        url: global.db.setting.link
      });
    }
  }

  setupSystemTasks(client, database) {
    // Auto restart jika RAM melebihi batas
    setInterval(() => {
      const ramUsage = process.memoryUsage().rss;
      if (ramUsage >= require('bytes')(env.ram_limit)) {
        process.send('reset');
      }
    }, 60_000);
    
    setInterval(async () => {
      process.send('reset')
    }, 5_400_000);

    // Buat direktori temp jika belum ada
    if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');

    // Bersihkan folder temp setiap 10 menit
    setInterval(() => {
      try {
        fs.readdirSync('./temp')
          .filter(v => !v.endsWith('.file'))
          .forEach(v => fs.unlinkSync(`./temp/${v}`));
      } catch (e) {
        console.error('Error cleaning temp folder:', e);
      }
    }, 600_000);

    // Simpan database setiap 5 menit
    setInterval(async () => {
      if (global.db) await database.save(global.db);
    }, 120_000);
  }
}

// Main execution
const start = async () => {
  const client = new WhatsAppClient();
  try {
    await client.connect();
  } catch (e) {
    console.error(colors.red('[INITIALIZATION ERROR]'), e);
    setTimeout(start, 5000);
  }
};

start();

// Error handlers
process.on("unhandledRejection", (reason) => {
  console.log(colors.red("[UNHANDLED REJECTION]"), reason);
});

process.on("uncaughtException", (err) => {
  console.log(colors.red("[UNCAUGHT EXCEPTION]"), err);
  if (err.message.includes("Connection closed")) setTimeout(start, 3000);
});