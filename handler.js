"use strict";

const { Component } = require('@neoxr/wb');
const { Function: Func, Scraper, Config: env } = new Component();
const cron = require('node-cron');
const chalk = require('chalk');

class Cooldown {
  constructor(defaultCooldown = 0) {
    this.cooldowns = new Map();
    this.default = defaultCooldown;
  }

  set(key, seconds = this.default) {
    this.cooldowns.set(key, Date.now() + (seconds * 1000));
    setTimeout(() => this.cooldowns.delete(key), seconds * 1000);
  }

  get(key) {
    const cooldownEnd = this.cooldowns.get(key);
    if (!cooldownEnd) return 0;
    return Math.max(0, (cooldownEnd - Date.now()) / 1000);
  }

  delete(key) {
    this.cooldowns.delete(key);
  }
}

const cooldown = new Cooldown(env.cooldown || 0);

class MessageHandler {
  constructor(client, ctx) {
    this.client = client;
    this.ctx = ctx;
    this.m = ctx.m;
    this.store = ctx.store;
    this.StoreR = ctx.StoreR;
    this.database = ctx.database;
  }

  async initialize() {
    try {
      this.debugIncomingMessage();
      await this.initData();
      await this.handleMessage();
    } catch (e) {
      this.handleError(e);
    } finally {
      Func.reload(require.resolve(__filename));
    }
  }

  debugIncomingMessage() {
    if (this.m && !this.m.fromMe) {
      const { sender, pushName, isGroup } = this.m;
      const name = pushName || 'Tanpa Nama';
      const text = this.getMessageText();
      
      console.log(`${chalk.blue('[MSG]')} ${chalk.cyan(isGroup ? 'Group' : 'Private')} | ` +
        `${chalk.yellow(name)} ${chalk.green(`(${sender})`)} : ${chalk.white(text)}`);
    }
  }

  getMessageText() {
    const { message } = this.m;
    return message?.conversation ||
           message?.extendedTextMessage?.text ||
           message?.imageMessage?.caption ||
           '[Non-text Message]';
  }

  async initData() {
    require('./lib/system/schema')(this.m, env);

    this.groupSet = global.db.groups.find(v => v.jid === this.m.chat) || { member: {} };
    this.chats = global.db.chats.find(v => v.jid === this.m.chat) || {};
    this.users = global.db.users.find(v => v.jid === this.m.sender) || {};
    this.setting = global.db.setting || {};

    this.isOwner = this.checkOwner();
    this.isRegister = this.users?.register;
    this.isPrem = this.users?.premium || this.isOwner;

    if (this.m.isGroup) {
      this.groupMetadata = await this.client.getGroupMetadata(this.m.chat);
      this.participants = this.groupMetadata?.participants || [];
      this.adminList = await this.client.groupAdmin(this.m.chat);
      this.isAdmin = this.adminList.includes(this.m.sender);
      this.isBotAdmin = this.adminList.includes((this.client.user.id.split(':')[0]) + '@s.whatsapp.net');
    }

    this.blockList = await this.getBlockList();
  }

  checkOwner() {
    const ownerNumbers = [
      this.client.decodeJid(this.client.user.id).replace(/@.+/, ''),
      env.owner,
      ...(this.setting.owners || [])
    ].map(v => v + '@s.whatsapp.net');
    
    return ownerNumbers.includes(this.m.sender);
  }

  async getBlockList() {
    try {
      const list = await this.client.fetchBlocklist();
      return typeof list !== 'undefined' ? list : [];
    } catch (e) {
      console.error('Error fetching blocklist:', e);
      return [];
    }
  }

  async handleMessage() {
    const activePlugins = this.filterActivePlugins();

    await this.handleStatusUpdate();
    this.setBotPresence();
    this.handleGroupMode();
    this.initNewUser();

    if (!this.setting.multiprefix) this.setting.noprefix = false;

    if (this.setting.debug && !this.m.fromMe && this.isOwner) {
      this.client.reply(this.m.chat, Func.jsonFormat(this.m), this.m);
    }

    await this.handleExpiredGroup();
    await this.handleExpiredPremium();
    this.updateActivity();
    await this.handleAfkUser();
    this.setupCronJobs();
    this.setupIntervals();
    this.updateGroupMemberActivity();

    await this.handleCommands(activePlugins);
  }

  filterActivePlugins() {
    return Object.fromEntries(
      Object.entries(this.ctx.plugins)
        .filter(([name, _]) => !(this.setting.pluginDisable || []).includes(name))
    );
  }

  async handleStatusUpdate() {
    if (!this.client.storyJid) this.client.storyJid = [];
    
    if (this.m.chat.endsWith('broadcast') && 
        !this.client.storyJid.includes(this.m.sender) && 
        this.m.sender !== this.client.decodeJid(this.client.user.id)) {
      this.client.storyJid.push(this.m.sender);
    }

    if (this.m.chat.endsWith('broadcast') && 
        [...new Set(this.client.storyJid)].includes(this.m.sender) && 
        !/protocol/.test(this.m.mtype)) {
      await this.client.sendMessage('status@broadcast', {
        react: {
          text: Func.random(['🤣', '🥹', '😂', '😋', '😎', '🤓', '🤪', '🥳', '😠', '😱', '🤔']),
          key: this.m.key
        }
      }, {
        statusJidList: [this.m.sender]
      });
    }
  }

  setBotPresence() {
    if (!this.setting.online) {
      this.client.sendPresenceUpdate('unavailable', this.m.chat);
    } else {
      this.client.sendPresenceUpdate('available', this.m.chat);
      this.client.readMessages([this.m.key]);
    }
  }

  handleGroupMode() {
    if (this.m.isGroup && !this.isBotAdmin) {
      this.groupSet.localonly = false;
    }
  }

  initNewUser() {
    if (!this.users || typeof this.users.limit === 'undefined') {
      global.db.users.push({
        jid: this.m.sender,
        banned: false,
        limit: env.limit,
        hit: 0,
        spam: 0,
        allowedCommands: []
      });
    }
  }

  async handleExpiredGroup() {
    if (this.m.isGroup && !this.groupSet?.stay && 
        (new Date() * 1) >= (this.groupSet?.expired || 0) && 
        (this.groupSet?.expired || 0) != 0) {
      const tex = await Func.getLang('group.expsewa');
      await this.client.reply(this.m.chat, Func.texted('italic', tex), this.m);
      this.groupSet.expired = 0;
      await Func.delay(2000);
      await this.client.groupLeave(this.m.chat);
    }
  }

  async handleExpiredPremium() {
    if (this.users && (new Date() * 1) >= (this.users?.expired || 0) && 
        (this.users?.expired || 0) != 0) {
      const tex = await Func.getLang('users.expprem');
      await this.client.reply(this.users.jid, Func.texted('italic', tex));
      this.users.premium = false;
      this.users.expired = 0;
      this.users.limit = env.limit;
    }
  }

  updateActivity() {
    if (this.m.isGroup) this.groupSet.activity = new Date() * 1;
    
    if (this.users) {
      this.users.name = this.m.pushName;
      this.users.lastseen = new Date() * 1;
    }
    
    if (this.chats) {
      this.chats.chat = (this.chats.chat || 0) + 1;
      this.chats.lastseen = new Date() * 1;
    }
  }

  async handleAfkUser() {
    if (this.m.isGroup && !this.m.isBot && this.users?.afk > -1) {
      const data = {
        duration: Func.texted('bold', Func.toTime(new Date() - this.users.afk)),
        reasonTitle: Func.texted('bold', 'Alasan'),
        reason: this.users.afkReason || '-'
      };
      const tex = await Func.getLang('users.afkback', data);
      await this.client.reply(this.m.chat, tex, this.m);
      this.users.afk = -1;
      this.users.afkReason = '';
      this.users.afkObj = {};
    }
  }

  setupCronJobs() {
    cron.schedule('00 00 * * *', () => {
      this.setting.lastReset = new Date() * 1;
      
      global.db.users
        .filter(v => (v?.limit || 0) < env.limit && !v.premium)
        .forEach(v => v.limit = env.limit);
      
      Object.entries(global.db.statistic || {})
        .forEach(([_, prop]) => prop.today = 0);
    }, {
      scheduled: true,
      timezone: process.env.TZ
    });
  }

  setupIntervals() {
    setInterval(() => {
      Func.jadwalCheck(this.client, this.groupSet, this.groupMetadata);
    }, 1000 * 30);
  }

  updateGroupMemberActivity() {
    if (this.m.isGroup && !this.m.fromMe) {
      const now = new Date() * 1;
      
      if (!this.groupSet.member) this.groupSet.member = {};
      
      if (!this.groupSet.member[this.m.sender]) {
        this.groupSet.member[this.m.sender] = {
          lastseen: now,
          warning: 0
        };
      } else {
        this.groupSet.member[this.m.sender].lastseen = now;
      }
    }
  }

  async handleCommands(activePlugins) {
    const { body, prefix, prefixes, command, commands, text } = this.ctx;
        
    const matcher = Func.matcher(command, commands).filter(v => v.accuracy >= 60);
    
    if (prefix && !commands.includes(command) && matcher.length > 0 && !this.setting.self) {
      if (!this.m.isGroup || (this.m.isGroup && !this.groupSet?.mute)) {
        const suggestions = matcher.map(v => 
          `➠ *${prefix ? prefix : ''}${v.string}* (${v.accuracy}%)`
        ).join('\n');
        
        return this.client.reply(
          this.m.chat,
          `🚩 Perintah yang Anda gunakan salah, coba rekomendasi berikut:\n\n${suggestions}`,
          this.m
        );
      }
    }
   
    if ( (body && prefix && commands.includes(command)) ||
    (body && !prefix && commands.includes(command) && this.setting.noprefix) ||
    (body && !prefix && commands.includes(command) && this.isOwner) ||
    (body && !prefix && commands.includes(command) && env.evaluate_chars.includes(command)) ) {
      
      if (!this.isOwner && this.setting.antispam) {
        let spamCheck = await Func.spam(this.m);
        if (spamCheck.ignore) {
          if (spamCheck.message) {
            this.client.reply(this.m.chat, spamCheck.message, this.m);
          }
          return;
        }
      }
      
      await this.processCommands(activePlugins);
    } else {
      await this.processEvents(activePlugins);
    }
  }

  async processCommands(activePlugins) {
    const { command, prefix, prefixes, text, args } = this.ctx;
    
    if ((this.setting.error || []).includes(command)) {
      return this.client.reply(
        this.m.chat,
        Func.texted('bold', `🚩 Perintah _${prefix ? prefix : ''}${command}_ dinonaktifkan.`),
        this.m
      );
    }

    if (!this.m.isGroup && (env.blocks || []).some(no => this.m.sender.startsWith(no))) {
      return this.client.updateBlockStatus(this.m.sender, 'block');
    }

    if (this.ctx.commands.includes(command)) {
      this.users.hit = (this.users.hit || 0) + 1;
      this.users.usebot = new Date() * 1;
      Func.hitstat(command, this.m.sender);
    }

    const availableCommands = Object.fromEntries(
      Object.entries(activePlugins).filter(([_, prop]) => 
        prop.run.usage || prop.run.hidden
      )
    );

    for (const [name, cmdObj] of Object.entries(availableCommands)) {
      const cmd = cmdObj.run;
      
      const isCommandNormal = Array.isArray(cmd.usage) 
        ? cmd.usage.includes(command)
        : cmd.usage === command;
        
      const isCommandHidden = cmd.hidden && (
        Array.isArray(cmd.hidden)
          ? cmd.hidden.includes(command)
          : cmd.hidden === command
      );

      if (!isCommandNormal && !isCommandHidden) continue;

      const cooldownKey = `${this.m.sender}:${command}`;
      const cmdCooldown = cmd.cooldown ?? cooldown.default;
      
      if (cmdCooldown > 0 && !this.isOwner) {
        const remaining = cooldown.get(cooldownKey);
        if (remaining > 0) {
          const timeLeft = Func.toTime(remaining * 1000);
          return this.client.reply(
            this.m.chat,
            `⏳ Command ini memiliki cooldown. Tunggu ${timeLeft} sebelum menggunakannya lagi.`,
            this.m
          );
        }
        
        cooldown.set(cooldownKey, cmdCooldown);
      }

      if (await this.shouldSkipCommand(cmd, name)) continue;
      
      await this.executeCommand(cmd, name, args, text, prefix, prefixes);
      break;
    }
  }

  async shouldSkipCommand(cmd, name) {
    if (this.users.allowedCommands?.includes(this.ctx.command)) {
      return false;
    }

    if (this.m.isBot || this.m.chat.endsWith('broadcast') || /edit/.test(this.m.mtype)) {
      return true;
    }

    if (this.setting.self && !this.isOwner && !this.m.fromMe) {
      return true;
    }

    if (!this.m.isGroup && !['owner'].includes(name) && this.chats && 
        !this.isPrem && !this.users?.banned && 
        new Date() * 1 - (this.chats?.lastchat || 0) < env.timeout) {
      return true;
    }

    if (!this.m.isGroup && !['owner', 'menfess', 'scan', 'verify', 'payment', 'premium'].includes(name) && 
        this.chats && !this.isPrem && !this.users?.banned && this.setting?.groupmode) {
        const tex = await Func.getLang('handler.evenprem', { prefix: prefixes[0] });
      this.client.sendMessageModify(
        this.m.chat,
        tex,
        this.m,
        {
          largeThumb: true,
          thumbnail: 'https://telegra.ph/file/0b32e0a0bb3b81fef9838.jpg',
          url: this.setting.link
        }
      ).then(() => this.chats.lastchat = new Date() * 1);
      return true;
    }

    if (!['me', 'owner', 'exec'].includes(name) && this.users && 
        (this.users?.banned || new Date() - (this.users?.ban_temporary || 0) < env.timeout)) {
      return true;
    }

    if (this.m.isGroup && !['activation', 'groupinfo'].includes(name) && this.groupSet?.mute) {
      return true;
    }

    if (cmd.owner && !this.isOwner) {
      this.client.reply(this.m.chat, global.status.owner, this.m);
      return true;
    }

    if (cmd.restrict && !this.isPrem && !this.isOwner && this.ctx.body && 
        new RegExp('\\b' + (this.setting.toxic || []).join('\\b|\\b') + '\\b')
        .test(this.ctx.body.toLowerCase())) {
        const tex = await Func.getLang('handler.banned');
      this.client.reply(
        this.m.chat,
        tex,
        this.m
      ).then(() => {
        this.users.banned = true;
        this.client.updateBlockStatus(this.m.sender, 'block');
      });
      return true;
    }

    if (cmd.premium && !this.isPrem) {
      this.client.reply(this.m.chat, global.status.premium, this.m);
      return true;
    }

    if (cmd.register && !this.isRegister) {
      this.client.reply(this.m.chat, global.status.register, this.m);
      return true;
    }

    if (cmd.limit && !this.isOwner) {
      return await this.handleCommandLimits(cmd);
    }

    if (cmd.group && !this.m.isGroup && this.isOwner !== true) {
      this.client.reply(this.m.chat, global.status.group, this.m);
      return true;
    }

    if (cmd.botAdmin && !this.isBotAdmin) {
      this.client.reply(this.m.chat, global.status.botAdmin, this.m);
      return true;
    }

    if (cmd.admin && !this.isAdmin && this.isOwner !== true) {
      this.client.reply(this.m.chat, global.status.admin, this.m);
      return true;
    }

    if (cmd.private && this.m.isGroup) {
      this.client.reply(this.m.chat, global.status.private, this.m);
      return true;
    }

    return false;
  }

  async handleCommandLimits(cmd) {
    if (cmd.limit === false) return false;

    const cost = typeof cmd.limit === 'boolean' ? 1 : parseInt(cmd.limit);
    const userLimit = this.users?.limit || 0;

    if (userLimit < cost) {
      const tex = await Func.getLang('handler.minlimit');
      this.client.reply(
        this.m.chat,
        Func.texted('bold', tex),
        this.m
      );
      return true;
    }

    this.users.limit -= cost;
    return false;
  }

  async executeCommand(cmd, name, args, text, prefix, prefixes) {
    await cmd.async(this.m, {
      client: this.client,
      args,
      text,
      isPrefix: prefix,
      prefixes,
      command: this.ctx.command,
      groupMetadata: this.groupMetadata,
      participants: this.participants,
      users: this.users,
      chats: this.chats,
      groupSet: this.groupSet,
      setting: this.setting,
      isOwner: this.isOwner,
      isRegister: this.isRegister,
      isPrem: this.isPrem,
      isAdmin: this.isAdmin,
      isBotAdmin: this.isBotAdmin,
      plugins: this.filterActivePlugins(),
      blockList: this.blockList,
      env,
      ctx: this.ctx,
      store: this.store,
      database: this.database,
      StoreR: this.StoreR,
      Func,
      Scraper
    });
  }

  async processEvents(activePlugins) {
    const { body, prefixes } = this.ctx;
    
    const availableEvents = Object.fromEntries(
      Object.entries(activePlugins)
        .filter(([_, prop]) => !prop.run.usage)
    );

    for (const [name, eventObj] of Object.entries(availableEvents)) {
      const event = eventObj.run;

      if ((this.m.fromMe && this.m.isBot) || 
          this.m.chat.endsWith('broadcast') || 
          /pollUpdate/.test(this.m.mtype)) {
        continue;
      }

      if (!this.m.isGroup && (env.blocks || []).some(no => this.m.sender.startsWith(no))) {
        return this.client.updateBlockStatus(this.m.sender, 'block');
      }

      if (this.setting.self && 
          !['menfess_ev', 'anti_link', 'anti_tagall', 'anti_virtex', 'filter'].includes(event.pluginName) && 
          !this.isOwner && !this.m.fromMe) {
        continue;
      }

      if (!['anti_link', 'anti_tagall', 'anti_virtex', 'filter'].includes(name) && 
          this.users && (this.users?.banned || 
          new Date() - (this.users?.ban_temporary || 0) < env.timeout)) {
        continue;
      }

      if (!['anti_link', 'anti_tagall', 'anti_virtex', 'filter'].includes(name) && 
          this.groupSet && this.groupSet.mute) {
        continue;
      }

      if (!this.m.isGroup && 
          !['menfess_ev', 'chatbot', 'auto_download'].includes(name) && 
          this.chats && !this.isPrem && !this.users?.banned && 
          new Date() * 1 - (this.chats?.lastchat || 0) < env.timeout) {
        continue;
      }

      if (!this.m.isGroup && this.setting.groupmode && 
          !['system_ev', 'menfess_ev', 'chatbot', 'auto_download'].includes(name) && 
          !this.isPrem) {
          const tex = await Func.getLang('handler.evenprem', { prefix: prefixes[0] });
        await this.client.sendMessageModify(
          this.m.chat,
          tex,
          this.m,
          {
            largeThumb: true,
            thumbnail: await Func.fetchBuffer('https://telegra.ph/file/0b32e0a0bb3b81fef9838.jpg'),
            url: this.setting.link
          }
        ).then(() => this.chats.lastchat = new Date() * 1);
        return;
      }

      if (event.error) continue;
      if (event.owner && !this.isOwner) continue;
      if (event.group && !this.m.isGroup) continue;

      if (event.limit && !event.game && 
          (this.users?.limit || 0) < 1 && body && 
          Func.generateLink(body) && 
          Func.generateLink(body).some(v => Func.socmed(v))) {
          const tex = await Func.getLang('handler.evenlimit');
        await this.client.reply(
          this.m.chat,
          tex,
          this.m
        ).then(() => {
          this.users.premium = false;
          this.users.expired = 0;
        });
        return;
      }

      if (event.botAdmin && !this.isBotAdmin) continue;
      if (event.admin && !this.isAdmin) continue;
      if (event.private && this.m.isGroup) continue;

      if (event.download && 
          (!this.setting.autodownload || 
          (body && (env.evaluate_chars || []).some(v => body.startsWith(v))))) {
        continue;
      }

      await event.async(this.m, {
        client: this.client,
        body,
        prefixes,
        groupMetadata: this.groupMetadata,
        participants: this.participants,
        users: this.users,
        chats: this.chats,
        groupSet: this.groupSet,
        setting: this.setting,
        isOwner: this.isOwner,
        isAdmin: this.isAdmin,
        isBotAdmin: this.isBotAdmin,
        plugins: this.filterActivePlugins(),
        blockList: this.blockList,
        env,
        ctx: this.ctx,
        store: this.store,
        database: this.database,
        StoreR: this.StoreR,
        Func,
        Scraper
      });
    }
  }

  handleError(e) {
    if (/(undefined|overlimit|timed|timeout|users|item|time)/ig.test(e.message)) return;
    
    console.error(e);
    
    if (!this.m.fromMe) {
      this.m.reply(Func.jsonFormat(new Error(env.bot_name + '-bot mengalami error :' + e)));
    }
  }
}

module.exports = async (client, ctx) => {
  const handler = new MessageHandler(client, ctx);
  await handler.initialize();
};