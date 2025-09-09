@echo off
cd /d "C:\Users\franc\Desktop\JOINT FORCE\OBSIDIAN\APPS\Grid Manager\apps\api"
set DATABASE_URL=postgresql://gridmanager:dev123456@localhost:5432/gridmanager_dev
npx prisma db push
pause