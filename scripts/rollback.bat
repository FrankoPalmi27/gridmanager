@echo off
echo ============================================
echo  GRID MANAGER - ROLLBACK TO PRE-CLEANUP
echo ============================================
echo.
echo This script will restore the project to the state
echo before deep cleaning was performed.
echo.
echo Backup branch: cleanup/deep-cleaning-backup
echo Backup commit: 7d3526d
echo.

set /p confirm="Are you sure you want to rollback? (y/N): "
if /i "%confirm%" neq "y" (
    echo Rollback cancelled.
    exit /b 0
)

echo.
echo Rolling back to pre-cleanup state...
echo.

:: Switch to main branch
echo Switching to main branch...
git checkout main
if errorlevel 1 (
    echo ERROR: Could not switch to main branch
    exit /b 1
)

:: Reset to backup state
echo Resetting to backup state...
git reset --hard cleanup/deep-cleaning-backup
if errorlevel 1 (
    echo ERROR: Could not reset to backup state
    exit /b 1
)

echo.
echo ============================================
echo  ROLLBACK COMPLETED SUCCESSFULLY
echo ============================================
echo.
echo The project has been restored to the pre-cleanup state.
echo All changes made during deep cleaning have been reverted.
echo.
echo To verify, check:
echo - Dist folders should be present again
echo - All original files should be restored
echo - Console.log statements should be back
echo.

pause