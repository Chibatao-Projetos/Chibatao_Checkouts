using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaidaPessoas.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDataSaidaEAprovadores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataSaida",
                table: "Solicitacoes",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Solicitacoes_GestorAprovadorId",
                table: "Solicitacoes",
                column: "GestorAprovadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Solicitacoes_RHAprovadorId",
                table: "Solicitacoes",
                column: "RHAprovadorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Solicitacoes_Usuarios_GestorAprovadorId",
                table: "Solicitacoes",
                column: "GestorAprovadorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Solicitacoes_Usuarios_RHAprovadorId",
                table: "Solicitacoes",
                column: "RHAprovadorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Solicitacoes_Usuarios_GestorAprovadorId",
                table: "Solicitacoes");

            migrationBuilder.DropForeignKey(
                name: "FK_Solicitacoes_Usuarios_RHAprovadorId",
                table: "Solicitacoes");

            migrationBuilder.DropIndex(
                name: "IX_Solicitacoes_GestorAprovadorId",
                table: "Solicitacoes");

            migrationBuilder.DropIndex(
                name: "IX_Solicitacoes_RHAprovadorId",
                table: "Solicitacoes");

            migrationBuilder.DropColumn(
                name: "DataSaida",
                table: "Solicitacoes");
        }
    }
}
