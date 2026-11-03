@echo off
cd /d "%~dp0"
python start_odor_backend.py
if errorlevel 1 pause
