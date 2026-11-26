import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'EasySpot API',
      description: 'Parking space reservation backend',
      status: 'running',
    };
  }
}
