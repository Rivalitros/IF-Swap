import { createApplication } from './app.js';
import { host, port } from './config.js';
import { createPool } from './db.js';

const db = createPool();
const { server } = createApplication(db);
server.listen(port, host, () => console.log(`IF Swap em http://${host}:${port}`));
