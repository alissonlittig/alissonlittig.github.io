# Invoice inbox -> stock ledger. Windows PowerShell 5.1 (built into Windows, no install). Fictional data.
# Every *.xml in -Inbox is processed in name order. Each invoice is atomic: it is applied completely or not at all.
#   applied   -> stock.csv updated, ledger.csv appended, file moved to processed\
#   duplicate -> invoice number already in the ledger, stock untouched, file moved to duplicates\
#   rejected  -> bad XML / missing field / unknown SKU / stock would go negative, file moved to rejected\ with a .reason.txt
# Exit code: 0 all applied or duplicate, 2 at least one rejected.
param([Parameter(Mandatory)][string]$Inbox, [Parameter(Mandatory)][string]$Data, [string]$Results = "")
$ErrorActionPreference = 'Stop'
$inv = [Globalization.CultureInfo]::InvariantCulture
$stockFile = Join-Path $Data 'stock.csv'; $ledgerFile = Join-Path $Data 'ledger.csv'
foreach ($d in 'processed', 'duplicates', 'rejected') { New-Item -ItemType Directory -Force -Path (Join-Path $Inbox $d) | Out-Null }
if (-not (Test-Path $ledgerFile)) { 'invoice,date,direction,sku,qty,unit_cost' | Set-Content -Path $ledgerFile -Encoding ASCII }

function Reject($file, $invoice, $reason) {
    Set-Content -Path (Join-Path $Inbox ('rejected\' + $file.Name + '.reason.txt')) -Value $reason -Encoding UTF8
    Move-Item -Force $file.FullName (Join-Path $Inbox 'rejected')
    [ordered]@{ file = $file.Name; invoice = $invoice; status = 'rejected'; reason = $reason; lines = @() }
}

$out = @()
foreach ($f in (Get-ChildItem -Path $Inbox -Filter *.xml -File | Sort-Object Name)) {
    $stock = @{}; foreach ($r in (Import-Csv $stockFile)) { $stock[$r.sku] = [pscustomobject]@{ sku = $r.sku; name = $r.name; on_hand = [int]$r.on_hand } }
    try { $x = [xml](Get-Content -Raw -Path $f.FullName -Encoding UTF8) } catch { $out += Reject $f '' 'malformed XML'; continue }
    $n = $x.invoice.number; $date = $x.invoice.date; $dir = $x.invoice.direction; $items = @($x.invoice.items.item)
    if (-not $n -or -not $date -or $dir -notin 'in', 'out' -or $items.Count -eq 0 -or -not $items[0]) { $out += Reject $f "$n" 'missing or invalid number/date/direction/items'; continue }
    if (@(Import-Csv $ledgerFile | Where-Object { $_.invoice -eq $n }).Count -gt 0) {
        Move-Item -Force $f.FullName (Join-Path $Inbox 'duplicates')
        $out += [ordered]@{ file = $f.Name; invoice = $n; status = 'duplicate'; reason = "invoice $n already in the ledger; stock untouched"; lines = @() }; continue
    }
    $delta = [ordered]@{}; $bad = $null
    foreach ($it in $items) {
        $q = 0
        if (-not $stock.ContainsKey($it.sku)) { $bad = "unknown SKU $($it.sku)"; break }
        if (-not [int]::TryParse($it.qty, [ref]$q) -or $q -le 0) { $bad = "qty for $($it.sku) must be an integer > 0"; break }
        $sign = if ($dir -eq 'in') { 1 } else { -1 }
        if ($delta.Contains($it.sku)) { $delta[$it.sku] += $sign * $q } else { $delta[$it.sku] = $sign * $q }
    }
    if (-not $bad) { foreach ($k in $delta.Keys) { if ($stock[$k].on_hand + $delta[$k] -lt 0) { $bad = "insufficient stock for $k (have $($stock[$k].on_hand), need $(-$delta[$k]))"; break } } }
    if ($bad) { $out += Reject $f "$n" $bad; continue }
    $lines = @()
    foreach ($k in $delta.Keys) { $b = $stock[$k].on_hand; $stock[$k].on_hand = $b + $delta[$k]; $lines += [ordered]@{ sku = $k; delta = $delta[$k]; before = $b; after = $stock[$k].on_hand } }
    foreach ($it in $items) { ('{0},{1},{2},{3},{4},{5}' -f $n, $date, $dir, $it.sku, $it.qty, $it.unit_cost) | Add-Content -Path $ledgerFile -Encoding ASCII }
    $stock.Values | Sort-Object sku | Export-Csv -Path $stockFile -NoTypeInformation -Encoding UTF8
    Move-Item -Force $f.FullName (Join-Path $Inbox 'processed')
    $out += [ordered]@{ file = $f.Name; invoice = $n; status = 'applied'; reason = ''; lines = $lines }
}
if ($Results) { [IO.File]::WriteAllText($Results, (ConvertTo-Json -InputObject $out -Depth 5), (New-Object Text.UTF8Encoding $false)) }
$out | ForEach-Object { '{0,-10} {1,-12} {2}' -f $_.status, $_.invoice, $_.reason }
if (@($out | Where-Object { $_.status -eq 'rejected' }).Count) { exit 2 } else { exit 0 }
