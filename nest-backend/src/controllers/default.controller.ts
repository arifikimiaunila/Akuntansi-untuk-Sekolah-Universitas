import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class DefaultController {
  @Get()
  root(@Res() res: Response) {
    return res.json({ website: 'spp.nest', message: 'Migrated from Beego' });
  }
}
