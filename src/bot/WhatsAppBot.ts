import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WAMessageKey,
  WAMessageContent,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import logger from '../utils/logger';
import EventEmitter from 'events';

export class WhatsAppBot extends EventEmitter {
  private socket: any;
  private state: any;
  private saveCreds: any;

  constructor() {
    super();
  }

  public async start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    this.socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger as any),
      },
      printQRInTerminal: true,
      logger: logger as any,
    });

    this.socket.ev.on('creds.update', saveCreds);

    this.socket.ev.on('connection.update', (update: any) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        this.emit('qr', qr);
      }
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        logger.info('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
        if (shouldReconnect) {
          this.start();
        }
      } else if (connection === 'open') {
        logger.info('opened connection');
        this.emit('connected');
      }
    });

    this.socket.ev.on('messages.upsert', async (m: any) => {
      this.emit('messages.upsert', m);
    });

    // Add more event listeners as needed
  }

  public async sendMessage(jid: string, content: WAMessageContent, options: any = {}) {
    return await this.socket.sendMessage(jid, content, options);
  }

  public getSocket() {
    return this.socket;
  }
}

export const bot = new WhatsAppBot();
