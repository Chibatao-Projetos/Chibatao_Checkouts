import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../common/decorators';
import { AuthService } from './auth.service';
import { LoginDto, RegistroDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.identificacao, dto.senha);
  }

  @Public()
  @Post('registro')
  registro(@Body() dto: RegistroDto) {
    return this.auth.registro(dto);
  }
}
