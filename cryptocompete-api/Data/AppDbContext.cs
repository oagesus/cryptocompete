using CryptoCompete.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    public DbSet<User> Users => Set<User>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<EmailChangeToken> EmailChangeTokens => Set<EmailChangeToken>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<ExternalLogin> ExternalLogins => Set<ExternalLogin>();
    public DbSet<Cryptocurrency> Cryptocurrencies => Set<Cryptocurrency>();
    public DbSet<PortfolioHolding> PortfolioHoldings => Set<PortfolioHolding>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.IsBlocked).HasDefaultValue(false);
            entity.Property(e => e.PasswordHash).IsRequired(false);
            entity.Property(e => e.DisplayCurrency).HasMaxLength(10).HasDefaultValue("EUR");

            entity.HasOne(e => e.ActiveProfile)
                .WithMany()
                .HasForeignKey(e => e.ActiveProfileId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Profile>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.Username).HasMaxLength(50);
            entity.Property(e => e.IsMain).HasDefaultValue(false);
            entity.Property(e => e.Balance).HasPrecision(18, 2).HasDefaultValue(10000m);
            
            entity.HasOne(e => e.User)
                .WithMany(u => u.Profiles)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Cryptocurrency>(entity =>
        {
            entity.HasIndex(e => e.Symbol).IsUnique();
            entity.Property(e => e.Symbol).HasMaxLength(20);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.DecimalPrecision).HasDefaultValue(8);
        });

        modelBuilder.Entity<PortfolioHolding>(entity =>
        {
            entity.HasIndex(e => new { e.ProfileId, e.CryptocurrencyId }).IsUnique();
            entity.Property(e => e.Amount).HasPrecision(28, 18);
            
            entity.HasOne(e => e.Profile)
                .WithMany(p => p.Holdings)
                .HasForeignKey(e => e.ProfileId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Cryptocurrency)
                .WithMany(c => c.Holdings)
                .HasForeignKey(e => e.CryptocurrencyId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.Property(e => e.Amount).HasPrecision(28, 18);
            entity.Property(e => e.PricePerUnit).HasPrecision(18, 8);
            entity.Property(e => e.TotalValue).HasPrecision(18, 2);
            entity.Property(e => e.Type).HasConversion<string>().HasMaxLength(10);
            
            entity.HasOne(e => e.Profile)
                .WithMany(p => p.Transactions)
                .HasForeignKey(e => e.ProfileId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Cryptocurrency)
                .WithMany(c => c.Transactions)
                .HasForeignKey(e => e.CryptocurrencyId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.Role }).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmailVerificationToken>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.IsUsed).HasDefaultValue(false);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(e => e.TokenHash).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Session)
                .WithMany()
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.IsUsed).HasDefaultValue(false);
        });

        modelBuilder.Entity<EmailChangeToken>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.NewEmail).HasMaxLength(255);
            entity.Property(e => e.IsUsed).HasDefaultValue(false);
        });

        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ExternalLogin>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.Provider }).IsUnique();
            entity.HasIndex(e => new { e.Provider, e.ProviderSubjectId }).IsUnique();
            entity.Property(e => e.Provider).HasMaxLength(50);
            entity.Property(e => e.ProviderSubjectId).HasMaxLength(255);
            entity.Property(e => e.ProviderEmail).HasMaxLength(255);
            entity.Property(e => e.ProviderDisplayName).HasMaxLength(255);

            entity.HasOne(e => e.User)
                .WithMany(u => u.ExternalLogins)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}