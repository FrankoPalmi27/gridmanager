Set-Location "C:\Users\franc\Desktop\JOINT FORCE\OBSIDIAN\APPS\Grid Manager\apps\api"
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/gridmanager_dev"
npm run db:seed