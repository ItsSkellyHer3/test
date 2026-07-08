import axios from 'axios';
import logger from '../utils/logger';

async function testBackend() {
  const PORT = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    logger.info('Testing backend login...');
    const loginRes = await axios.post(`${baseUrl}/login`, {
      username: 'admin',
      password: 'admin'
    });
    const token = loginRes.data.token;
    logger.info('Login successful, token received.');

    logger.info('Testing authenticated status endpoint...');
    const statusRes = await axios.get(`${baseUrl}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logger.info(`Status endpoint response: ${JSON.stringify(statusRes.data)}`);

    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Backend test failed');
    process.exit(1);
  }
}

// We need to start the server first in this script or assume it's running
// For simplicity, let's just try to connect.
// In a real test we'd start/stop the server.
testBackend();
