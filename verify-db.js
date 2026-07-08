"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./src/database"));
const User_1 = __importDefault(require("./src/models/User"));
const logger_1 = __importDefault(require("./src/utils/logger"));
async function verifyModels() {
    try {
        await database_1.default.authenticate();
        logger_1.default.info('Connection to database has been established successfully.');
        await database_1.default.sync({ force: true });
        logger_1.default.info('All models were synchronized successfully.');
        // Create a test user
        const testUser = await User_1.default.create({
            id: '1234567890@s.whatsapp.net',
            name: 'Test User',
            role: 'OWNER'
        });
        logger_1.default.info(`Test user created: ${JSON.stringify(testUser.toJSON())}`);
        const users = await User_1.default.findAll();
        logger_1.default.info(`All users: ${JSON.stringify(users.map(u => u.toJSON()))}`);
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Unable to connect to the database or sync models');
        process.exit(1);
    }
    finally {
        await database_1.default.close();
    }
}
verifyModels();
