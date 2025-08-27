import serverless from 'serverless-http';
import { createApp } from '../../apps/api/src/server'; // Import the createApp function

let cachedHandler: any = null;

export const handler = async (event: any, context: any) => {
  if (cachedHandler) {
    return cachedHandler(event, context);
  }

  const app = await createApp();
  cachedHandler = serverless(app);
  return cachedHandler(event, context);
};
