import { Body, Controller, Get, NotFoundException, BadRequestException, Put } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, CurrentUser } from '../common/decorators';
import { toInstant } from '../common/dates';

class AlterarSenhaPropriaDto {
  senhaAtual!: string;
  novaSenha!: string;
}

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthUser) {
    const u = await this.prisma.usuarios.findUnique({ where: { Id: user.userId } });
    if (!u) throw new NotFoundException();
    return {
      id: u.Id,
      nome: u.Nome,
      matricula: u.Matricula,
      email: u.Email,
      setor: u.Setor,
      perfil: u.Perfil,
      status: u.Status,
      dataCadastro: toInstant(u.DataCadastro),
    };
  }

  /** Colaboradores ativos — usado no formulário de saída por terceiros. */
  @Get('colaboradores')
  async listarColaboradores() {
    const usuarios = await this.prisma.usuarios.findMany({
      where: { Status: 'Ativo' },
      select: { Id: true, Nome: true, Setor: true, Matricula: true },
      orderBy: { Nome: 'asc' },
    });
    return usuarios.map((u) => ({ id: u.Id, nome: u.Nome, setor: u.Setor, matricula: u.Matricula }));
  }

  @Put('me/senha')
  async alterarMinhaSenha(@CurrentUser() user: AuthUser, @Body() dto: AlterarSenhaPropriaDto) {
    if (!dto.novaSenha || dto.novaSenha.length < 6) {
      throw new BadRequestException({ message: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }
    const u = await this.prisma.usuarios.findUnique({ where: { Id: user.userId } });
    if (!u) throw new NotFoundException();
    if (!bcrypt.compareSync(dto.senhaAtual, u.SenhaHash)) {
      throw new BadRequestException({ message: 'Senha atual incorreta.' });
    }
    await this.prisma.usuarios.update({
      where: { Id: user.userId },
      data: { SenhaHash: bcrypt.hashSync(dto.novaSenha, 10) },
    });
    return { message: 'Senha alterada com sucesso.' };
  }
}
