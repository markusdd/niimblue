param([Parameter(Mandatory = $true)][string]$InstallerPath)
$ErrorActionPreference = 'Stop'
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -UseBasicParsing -TimeoutSec 120 -Uri 'https://go.microsoft.com/fwlink/p/?LinkId=2124703' -OutFile $InstallerPath
    $signature = Get-AuthenticodeSignature -LiteralPath $InstallerPath
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch '(?:^|,\s*)O=Microsoft Corporation(?:,|$)') {
        throw 'The WebView2 installer does not have a valid Microsoft signature.'
    }
    # Run without elevation: Microsoft's bootstrapper supports per-user installation.
    $installer = Start-Process -FilePath $InstallerPath -ArgumentList '/silent', '/install' -Wait -PassThru
    if ($installer.ExitCode -notin @(0, 3010)) {
        throw "Microsoft WebView2 setup returned exit code $($installer.ExitCode)."
    }
    exit 0
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
}
