# Database Backup Script for Todo App (PowerShell)
# Supports SQLite database backup with compression and rotation

param(
    [string]$BackupDir = ".\backups",
    [string]$DbPath = ".\apps\api\prisma\dev.db",
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

# Configuration
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "backup_${Timestamp}.db"
$CompressedFile = "${BackupFile}.gz"

# Colors
$Green = "[ConsoleColor]::Green"
$Yellow = "[ConsoleColor]::Yellow"
$Red = "[ConsoleColor]::Red"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    switch ($Level) {
        "INFO" {
            Write-Host "[$Timestamp] " -NoNewline -ForegroundColor Green
            Write-Host $Message
        }
        "WARN" {
            Write-Host "[$Timestamp] WARNING: " -NoNewline -ForegroundColor Yellow
            Write-Host $Message
        }
        "ERROR" {
            Write-Host "[$Timestamp] ERROR: " -NoNewline -ForegroundColor Red
            Write-Host $Message
        }
    }
}

# Create backup directory
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Log "Created backup directory: $BackupDir"
}

# Check if database exists
if (!(Test-Path $DbPath)) {
    Write-Log "Database file not found: $DbPath" -Level "ERROR"
    exit 1
}

Write-Log "Starting database backup..."
Write-Log "Source: $DbPath"
Write-Log "Destination: $BackupDir\$CompressedFile"

# Create backup
$BackupPath = Join-Path $BackupDir $BackupFile
try {
    # Try using sqlite3 if available
    $sqlite3 = Get-Command sqlite3 -ErrorAction SilentlyContinue
    if ($sqlite3) {
        Write-Log "Using sqlite3 for online backup..."
        sqlite3 $DbPath ".backup '$BackupPath'"
    } else {
        Write-Log "sqlite3 not found, using file copy..." -Level "WARN"
        Copy-Item $DbPath $BackupPath -Force
    }

    # Compress using .NET
    Write-Log "Compressing backup..."
    $CompressedPath = "$BackupPath.gz"
    $InputStream = [System.IO.FileStream]::new($BackupPath, [System.IO.FileMode]::Open)
    $OutputStream = [System.IO.FileStream]::new($CompressedPath, [System.IO.FileMode]::Create)
    $GzipStream = [System.IO.Compression.GzipStream]::new($OutputStream, [System.IO.Compression.CompressionMode]::Compress)
    $InputStream.CopyTo($GzipStream)
    $GzipStream.Close()
    $OutputStream.Close()
    $InputStream.Close()

    # Remove uncompressed file
    Remove-Item $BackupPath -Force

    # Verify backup
    if (Test-Path $CompressedPath) {
        $FileSize = (Get-Item $CompressedPath).Length
        $FileSizeMB = [math]::Round($FileSize / 1MB, 2)
        Write-Log "Backup completed successfully!"
        Write-Log "File: $CompressedFile"
        Write-Log "Size: $FileSizeMB MB"
    } else {
        throw "Backup file creation failed!"
    }
}
catch {
    Write-Log "Backup failed: $_" -Level "ERROR"
    exit 1
}

# Clean up old backups
Write-Log "Cleaning up backups older than $RetentionDays days..."
$CutoffDate = (Get-Date).AddDays(-$RetentionDays)
$OldBackups = Get-ChildItem $BackupDir -Filter "backup_*.db.gz" | Where-Object { $_.LastWriteTime -lt $CutoffDate }
$DeletedCount = $OldBackups.Count

if ($DeletedCount -gt 0) {
    $OldBackups | Remove-Item -Force
    Write-Log "Deleted $DeletedCount old backup(s)"
} else {
    Write-Log "No old backups to delete"
}

# List recent backups
Write-Log "Recent backups:"
Get-ChildItem $BackupDir -Filter "backup_*.db.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
    $Size = [math]::Round($_.Length / 1KB, 2)
    Write-Log "  $($_.Name) - $Size KB"
}

Write-Log "Backup process completed!"
