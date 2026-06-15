$jsonContent = Get-Content -Path "d:\Online Website\data\products.json" -Raw
$jsContent = "window.__PRODUCTS_DATA__ = " + $jsonContent + ";"
[System.IO.File]::WriteAllText("d:\Online Website\js\products-data.js", $jsContent)
Write-Host "Done! Created products-data.js"
