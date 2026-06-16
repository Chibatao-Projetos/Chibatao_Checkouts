import {
  BadRequestException, Body, Controller, Delete, Get, NotFoundException,
  Param, ParseIntPipe, Put, Query,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { toInstant } from '../common/dates';

const STATUS_USUARIO = ['Pendente', 'Ativo', 'Inativo'];
const PERFIS = ['Solicitante', 'Gestor', 'RH', 'Portaria', 'Admin'];

class AlterarPerfilDto { perfil!: string; }
class AlterarSenhaAdminDto { novaSenha!: string; }

@Controller('admin')
@Roles('Admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  private map(u: any) {
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

  @Get('usuarios')
  async listar(@Query('status') status?: string) {
    const where = status && STATUS_USUARIO.includes(status) ? { Status: status } : {};
    const usuarios = await this.prisma.usuarios.findMany({
      where,
      orderBy: [{ Status: 'asc' }, { Nome: 'asc' }],
    });
    return usuarios.map((u) => this.map(u));
  }

  @Put('usuarios/:id/aprovar')
  async aprovar(@Param('id', ParseIntPipe) id: number) {
    await this.requireUser(id);
    await this.prisma.usuarios.update({ where: { Id: id }, data: { Status: 'Ativo' } });
    return { message: 'Usuário aprovado e liberado para acesso.' };
  }

  @Put('usuarios/:id/rejeitar')
  async rejeitar(@Param('id', ParseIntPipe) id: number) {
    await this.requireUser(id);
    await this.prisma.usuarios.update({ where: { Id: id }, data: { Status: 'Inativo' } });
    return { message: 'Usuário rejeitado.' };
  }

  @Put('usuarios/:id/bloquear')
  async bloquear(@CurrentUser() admin: AuthUser, @Param('id', ParseIntPipe) id: number) {
    if (id === admin.userId) throw new BadRequestException({ message: 'Você não pode bloquear sua própria conta.' });
    const u = await this.requireUser(id);
    if (u.Status === 'Inativo') throw new BadRequestException({ message: 'Usuário já está bloqueado.' });
    await this.prisma.usuarios.update({ where: { Id: id }, data: { Status: 'Inativo' } });
    return { message: 'Usuário bloqueado com sucesso.' };
  }

  @Delete('usuarios/:id')
  async excluir(@CurrentUser() admin: AuthUser, @Param('id', ParseIntPipe) id: number) {
    if (id === admin.userId) throw new BadRequestException({ message: 'Você não pode excluir sua própria conta.' });
    await this.requireUser(id);
    await this.prisma.usuarios.delete({ where: { Id: id } });
    return { message: 'Usuário excluído permanentemente.' };
  }

  @Put('usuarios/:id/perfil')
  async alterarPerfil(@Param('id', ParseIntPipe) id: number, @Body() dto: AlterarPerfilDto) {
    if (!PERFIS.includes(dto.perfil)) throw new BadRequestException({ message: 'Perfil inválido.' });
    await this.requireUser(id);
    await this.prisma.usuarios.update({ where: { Id: id }, data: { Perfil: dto.perfil } });
    return { message: `Perfil alterado para ${dto.perfil}.` };
  }

  @Put('usuarios/:id/senha')
  async alterarSenha(@Param('id', ParseIntPipe) id: number, @Body() dto: AlterarSenhaAdminDto) {
    if (!dto.novaSenha || dto.novaSenha.length < 6) {
      throw new BadRequestException({ message: 'A senha deve ter no mínimo 6 caracteres.' });
    }
    await this.requireUser(id);
    await this.prisma.usuarios.update({ where: { Id: id }, data: { SenhaHash: bcrypt.hashSync(dto.novaSenha, 10) } });
    return { message: 'Senha alterada com sucesso.' };
  }

  private async requireUser(id: number) {
    const u = await this.prisma.usuarios.findUnique({ where: { Id: id } });
    if (!u) throw new NotFoundException();
    return u;
  }
}
