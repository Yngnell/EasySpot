import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './common/decorators/public.decorator.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET / -> 200 (public): simple check that the API is running
  @Public()
  @Get()
  getInfo() {
    return this.appService.getInfo();
  }
}
