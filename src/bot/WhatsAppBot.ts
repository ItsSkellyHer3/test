import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WAMessageKey,
  AnyMessageContent,
  MiscMessageGenerationOptions,
  delay,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import logger from '../utils/logger';
import EventEmitter from 'events';
import qrcode from 'qrcode-terminal';
import fs from 'fs';

export class WhatsAppBot extends EventEmitter {
  private socket: any;
  public maintenanceMode: boolean = false;

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
      printQRInTerminal: false,
      logger: logger as any,
    });

    this.socket.ev.on('creds.update', saveCreds);

    this.socket.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrcode.generate(qr, { small: true });
        logger.info('Scan the QR code above or use pairing code logic if enabled.');
        this.emit('qr', qr);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        logger.info({
            err: lastDisconnect?.error,
            statusCode,
            shouldReconnect
        }, 'Connection closed');

        if (shouldReconnect) {
          const retryDelay = statusCode === 515 ? 2000 : 5000;
          logger.info(`Reconnecting in ${retryDelay}ms...`);
          await delay(retryDelay);
          this.start();
        }
      } else if (connection === 'open') {
        logger.info('Connection opened successfully');
        this.emit('connected');
      } else if (connection === 'connecting') {
        logger.info('Connecting to WhatsApp...');
      }
    });

    this.socket.ev.on('messages.upsert', async (m: any) => {
      if (this.maintenanceMode) {
          // Could notify user or just ignore
      }
      this.emit('messages.upsert', m);
    });
  }

  public async requestPairingCode(phoneNumber: string) {
      if (this.socket) {
          const code = await this.socket.requestPairingCode(phoneNumber);
          return code;
      }
      return null;
  }

  public async sendMessage(jid: string, content: AnyMessageContent, options: MiscMessageGenerationOptions = {}) {
    return await this.socket.sendMessage(jid, content, options);
  }

  public getSocket() {
    return this.socket;
  }
}

export const bot = new WhatsAppBot();
