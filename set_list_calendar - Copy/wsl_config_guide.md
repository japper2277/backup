# WSL Stability Configuration Guide

## **Step 1: Create .wslconfig File**

Create this file in your Windows user directory: `C:\Users\[YourUsername]\.wslconfig`

```ini
[wsl2]
# Memory limit (adjust based on your system)
memory=4GB

# CPU cores (adjust based on your system)
processors=4

# Enable page reporting for better memory management
pageReporting=true

# Enable nested virtualization
nestedVirtualization=true

# Enable experimental features for better stability
experimental=true

# Set swap size
swap=2GB

# Enable localhost forwarding
localhostForwarding=true

# Set kernel command line options
kernelCommandLine=vsyscall=emulate

# Enable WSLg (if available)
guiApplications=true

# Set networking mode
networkingMode=mirrored

# Enable memory reclaim
memoryReclaim=true
```

## **Step 2: Optimize Ubuntu Configuration**

Add these lines to `/etc/wsl.conf` in your Ubuntu WSL:

```ini
[boot]
systemd=true

[automount]
enabled = true
root = /mnt/
options = "metadata,umask=22,fmask=11"
mountFsTab = false

[network]
generateHosts = true
generateResolvConf = true

[interop]
enabled = true
appendWindowsPath = false
```

## **Step 3: Windows Registry Optimizations**

Run these commands in PowerShell as Administrator:

```powershell
# Optimize WSL memory management
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Virtualization\Containers" /v "WslMemoryLimit" /t REG_DWORD /d 4294967296 /f

# Enable WSL2 optimizations
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Virtualization\Containers" /v "WslOptimizations" /t REG_DWORD /d 1 /f

# Set WSL2 as default
wsl --set-default-version 2
```

## **Step 4: Performance Monitoring**

Monitor WSL performance with these commands:

```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check running processes
ps aux --sort=-%mem | head -10

# Check WSL status
wsl --status
```

## **Step 5: Regular Maintenance Commands**

```bash
# Clean package cache
sudo apt clean
sudo apt autoremove

# Update system regularly
sudo apt update && sudo apt upgrade

# Check for disk errors
sudo fsck -f /

# Restart WSL weekly
wsl --shutdown
```

## **Step 6: Troubleshooting Common Issues**

### If WSL crashes:
1. `wsl --shutdown` (from Windows)
2. Restart WSL: `wsl -d Ubuntu`
3. Check logs: `dmesg | tail -20`

### If filesystem is corrupted:
1. `wsl --shutdown`
2. `wsl --export Ubuntu backup.tar`
3. `wsl --unregister Ubuntu`
4. `wsl --import Ubuntu C:\WSL\Ubuntu backup.tar`

### Memory issues:
1. Reduce memory limit in .wslconfig
2. Close unnecessary applications
3. Restart WSL

## **Step 7: Antivirus Exclusions**

Add these paths to your antivirus exclusions:
- `\\wsl$\`
- `C:\Users\[Username]\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu_*\LocalState\ext4.vhdx`

## **Expected Results:**
- ✅ Reduced crashes
- ✅ Better memory management
- ✅ Improved file access stability
- ✅ Faster performance
- ✅ Better compatibility with Windows applications

## **Apply These Changes:**
1. Create the .wslconfig file
2. Restart WSL: `wsl --shutdown`
3. Restart Windows
4. Test stability for a few days
