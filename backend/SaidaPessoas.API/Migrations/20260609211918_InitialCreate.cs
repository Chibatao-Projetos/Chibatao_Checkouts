using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SaidaPessoas.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Matricula = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    SenhaHash = table.Column<string>(type: "text", nullable: false),
                    Setor = table.Column<string>(type: "text", nullable: false),
                    Perfil = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Solicitacoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Setor = table.Column<string>(type: "text", nullable: false),
                    Destino = table.Column<string>(type: "text", nullable: false),
                    UnidadeDestino = table.Column<string>(type: "text", nullable: true),
                    SetorDestino = table.Column<string>(type: "text", nullable: true),
                    TipoSaida = table.Column<string>(type: "text", nullable: false),
                    PrevisaoRetorno = table.Column<bool>(type: "boolean", nullable: false),
                    DataPrevistaRetorno = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    HorarioPrevistodoRetorno = table.Column<string>(type: "text", nullable: true),
                    IsExtraordinaria = table.Column<bool>(type: "boolean", nullable: false),
                    DataSolicitacao = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    MotivoReprovacao = table.Column<string>(type: "text", nullable: true),
                    NomeVigilante = table.Column<string>(type: "text", nullable: true),
                    HoraSaida = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    HoraRetorno = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    SolicitanteId = table.Column<int>(type: "integer", nullable: false),
                    GestorAprovadorId = table.Column<int>(type: "integer", nullable: true),
                    DataAprovacaoGestor = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    RHAprovadorId = table.Column<int>(type: "integer", nullable: true),
                    DataAprovacaoRH = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Solicitacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Solicitacoes_Usuarios_SolicitanteId",
                        column: x => x.SolicitanteId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Solicitacoes_SolicitanteId",
                table: "Solicitacoes",
                column: "SolicitanteId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Matricula",
                table: "Usuarios",
                column: "Matricula",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Solicitacoes");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
