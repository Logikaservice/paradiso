# Legge id_rsa.pub e genera comandi bash (uno per riga, incolla uno alla volta)
# Uso: .\build-authorized-keys-commands.ps1          -> per /root/.ssh/authorized_keys
#      .\build-authorized-keys-commands.ps1 deploy   -> per /home/deploy/.ssh/authorized_keys
$target = if ($args[0] -eq "deploy") { "/home/deploy/.ssh/authorized_keys" } else { "/root/.ssh/authorized_keys" }
$keyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"
$key = (Get-Content $keyPath -Raw).Trim()
$chunkSize = 40
$chunks = [System.Collections.ArrayList]@()
for ($i = 0; $i -lt $key.Length; $i += $chunkSize) {
    $chunk = $key.Substring($i, [Math]::Min($chunkSize, $key.Length - $i))
    $escaped = $chunk -replace "'", "'\''"
    [void]$chunks.Add("echo -n '$escaped' >> $target")
}
$chunks -join "`n"
