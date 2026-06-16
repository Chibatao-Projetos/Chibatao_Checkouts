import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegistroDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(identificacao: string, senha: string) {
    if (!identificacao?.trim() || !senha) {
      throw new UnauthorizedException({ message: 'Credenciais inválidas.' });
    }
    const id = identificacao.trim();
    const user = await this.prisma.usuarios.findFirst({
      where: { OR: [{ Email: id }, { Matricula: id }] },
    });

    if (!user || !bcrypt.compareSync(senha, user.SenhaHash)) {
      throw new UnauthorizedException({ message: 'Credenciais inválidas.' });
    }
    if (user.Status === 'Pendente') {
      throw new UnauthorizedException({ message: 'Sua conta está pendente de aprovação pelo administrador.' });
    }
    if (user.Status === 'Inativo') {
      throw new UnauthorizedException({ message: 'Sua conta foi desativada. Contate o administrador.' });
    }

    const token = await this.jwt.signAsync({
      sub: user.Id,
      nome: user.Nome,
      email: user.Email,
      role: user.Perfil,
      setor: user.Setor,
    });

    return { token, nome: user.Nome, perfil: user.Perfil, userId: user.Id, setor: user.Setor };
  }

  async registro(dto: RegistroDto) {
    if (await this.prisma.usuarios.findUnique({ where: { Email: dto.email } })) {
      throw new ConflictException({ message: 'E-mail já cadastrado.' });
    }
    if (await this.prisma.usuarios.findUnique({ where: { Matricula: dto.matricula } })) {
      throw new ConflictException({ message: 'Matrícula já cadastrada.' });
    }

    await this.prisma.usuarios.create({
      data: {
        Nome: dto.nome,
        Matricula: dto.matricula,
        Email: dto.email,
        Setor: dto.setor,
        SenhaHash: bcrypt.hashSync(dto.senha, 10),
        Perfil: 'Solicitante',
        Status: 'Pendente',
        DataCadastro: new Date(),
      },
    });

    return {
      message: 'Cadastro realizado com sucesso. Aguarde a aprovação do administrador para acessar o sistema.',
    };
  }
}
