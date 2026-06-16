import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { RolesGuard } from './common/roles.guard';
import { AuthModule } from './auth/auth.module';
import { SolicitacoesModule } from './solicitacoes/solicitacoes.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AdminModule } from './admin/admin.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'SaidaPessoas_SuperSecretKey_MinLength32Chars!!',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
    }),
    PrismaModule,
    AuthModule,
    SolicitacoesModule,
    NotificacoesModule,
    UsuariosModule,
    AdminModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
