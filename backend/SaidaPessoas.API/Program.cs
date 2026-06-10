using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using SaidaPessoas.API.Data;

// Compatibilidade de timestamp: trata DateTime como 'timestamp without time zone',
// tolerando datas vindas do cliente (ex.: DataPrevistaRetorno) sem Kind=Utc.
// Mantém o comportamento que o SQLite tinha. Revisitar para tz-aware no futuro.
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Escuta em todas as interfaces de rede (localhost + IP da rede da empresa),
// permitindo que este PC funcione como servidor para outros computadores.
builder.WebHost.UseUrls("http://0.0.0.0:5000");

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        // Timestamps (instantes) serializados como UTC com 'Z' → cliente converte ao fuso local.
        opts.JsonSerializerOptions.Converters.Add(new SaidaPessoas.API.Json.UtcDateTimeConverter());
        opts.JsonSerializerOptions.Converters.Add(new SaidaPessoas.API.Json.NullableUtcDateTimeConverter());
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Sistema de Saída de Pessoas", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
    });
    c.AddSecurityRequirement(new()
    {
        {
            new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var jwtKey = builder.Configuration["Jwt:Key"] ?? "SaidaPessoas_SuperSecretKey_MinLength32Chars!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "SaidaPessoasAPI",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "SaidaPessoasClient",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
    options.AddPolicy("AllowFrontend", policy =>
        // Rede interna: aceita qualquer origem (localhost e PCs da rede via IP/hostname).
        // Seguro porque a auth é via Bearer token, não cookies.
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    ctx.Database.Migrate();
    DbSeeder.Seed(ctx);
}

app.Run();
