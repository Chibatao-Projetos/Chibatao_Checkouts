import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { SolicitacoesService, ListarParams } from './solicitacoes.service';
import { CriarSolicitacaoDto, RegistrarSaidaDto, ReprovarDto } from './dto';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';

@Controller('solicitacoes')
export class SolicitacoesController {
  constructor(private readonly service: SolicitacoesService) {}

  @Get()
  listar(@CurrentUser() user: AuthUser, @Query() query: ListarParams) {
    return this.service.listar(user, query);
  }

  @Get('export')
  async export(@Query() query: ListarParams & { format?: string }, @CurrentUser() user: AuthUser, @Res() res: Response) {
    // Exporta o resultado já filtrado (mesma lógica da listagem, sem paginação prática).
    const result = await this.service.listar(user, { ...query, page: '1', pageSize: '100000' });
    if ((query.format ?? 'csv').toLowerCase() === 'json') {
      return res.json(result.data);
    }
    const headers = ['ID', 'Nome', 'Setor', 'Destino', 'Tipo', 'Retorno', 'Data Saida', 'Data Solicitacao', 'Status', 'Vigilante', 'Hora Saida', 'Hora Retorno'];
    const linhas = result.data.map((s) => [
      s.id, `"${s.nome}"`, `"${s.setor}"`, `"${s.destino}"`,
      s.tipoSaida === 'AServico' ? 'A Servico' : 'Particular',
      s.previsaoRetorno ? 'Sim' : 'Nao',
      s.dataSaida ?? '', s.dataSolicitacao ?? '', s.status,
      `"${s.nomeVigilante ?? ''}"`, s.horaSaida ?? '', s.horaRetorno ?? '',
    ].join(','));
    const csv = '﻿' + [headers.join(','), ...linhas].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="solicitacoes.csv"');
    return res.send(csv);
  }

  @Get(':id')
  obterPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obterPorId(id);
  }

  @Post()
  @Roles('Solicitante', 'Gestor', 'Admin')
  criar(@CurrentUser() user: AuthUser, @Body() dto: CriarSolicitacaoDto) {
    return this.service.criar(user, dto);
  }

  @Delete(':id')
  @Roles('Solicitante', 'Gestor', 'Admin')
  excluir(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.excluir(user, id);
  }

  @Put(':id/aprovar-gestor')
  @Roles('Gestor', 'Admin')
  aprovarGestor(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.aprovarGestor(user, id);
  }

  @Put(':id/reprovar-gestor')
  @Roles('Gestor', 'Admin')
  reprovarGestor(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: ReprovarDto) {
    return this.service.reprovarGestor(user, id, dto.motivo);
  }

  @Put(':id/aprovar-rh')
  @Roles('RH', 'Admin')
  aprovarRH(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.aprovarRH(user, id);
  }

  @Put(':id/reprovar-rh')
  @Roles('RH', 'Admin')
  reprovarRH(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: ReprovarDto) {
    return this.service.reprovarRH(user, id, dto.motivo);
  }

  @Put(':id/registrar-saida')
  @Roles('Portaria', 'Admin')
  registrarSaida(@Param('id', ParseIntPipe) id: number, @Body() dto: RegistrarSaidaDto) {
    return this.service.registrarSaida(id, dto.nomeVigilante);
  }

  @Put(':id/registrar-retorno')
  @Roles('Portaria', 'Admin')
  registrarRetorno(@Param('id', ParseIntPipe) id: number) {
    return this.service.registrarRetorno(id);
  }
}
