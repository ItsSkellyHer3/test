import chalk from 'chalk';

export const printBanner = () => {
    // Note: chalk 5+ is ESM only. If using CJS, ensure it's compatible or use a CJS alternative like chalk@4
    console.log(chalk.blue(`
    ===========================================
    ║                                         ║
    ║   OSINT WHATSAPP BOT & DASHBOARD        ║
    ║   Professional Intelligence Platform    ║
    ║                                         ║
    ===========================================
    `));
    console.log(chalk.green('[-] Starting system modules...'));
};
