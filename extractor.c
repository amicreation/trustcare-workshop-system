#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <shellapi.h>

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // 1. Show a brief startup notice
    MessageBox(NULL, 
        "Trust Care Workshop Management System is preparing to start.\n\n"
        "Please click OK to begin. The application will launch in a few seconds.", 
        "Trust Care", 
        MB_OK | MB_ICONINFORMATION);

    // 2. Get temporary directory path
    char tempPath[MAX_PATH];
    GetTempPath(MAX_PATH, tempPath);
    
    char zipPath[MAX_PATH];
    sprintf(zipPath, "%sTrustCareTemp.zip", tempPath);
    
    char destPath[MAX_PATH];
    sprintf(destPath, "%sTrustCareApp", tempPath);

    // 3. Load the embedded ZIP resource
    HRSRC hRes = FindResource(NULL, "APP_ZIP", RT_RCDATA);
    if (!hRes) {
        MessageBox(NULL, "Failed to find internal resources.", "Error", MB_OK | MB_ICONERROR);
        return 1;
    }
    
    HGLOBAL hGlobal = LoadResource(NULL, hRes);
    if (!hGlobal) {
        MessageBox(NULL, "Failed to load internal resources.", "Error", MB_OK | MB_ICONERROR);
        return 1;
    }
    
    void* pData = LockResource(hGlobal);
    DWORD size = SizeofResource(NULL, hRes);
    if (!pData || size == 0) {
        MessageBox(NULL, "Internal resources are empty.", "Error", MB_OK | MB_ICONERROR);
        return 1;
    }

    // 4. Write the ZIP data to %TEMP%\TrustCareTemp.zip
    FILE* f = fopen(zipPath, "wb");
    if (!f) {
        MessageBox(NULL, "Failed to write temporary files.", "Error", MB_OK | MB_ICONERROR);
        return 1;
    }
    fwrite(pData, 1, size, f);
    fclose(f);

    // 5. Create the destination folder and extract using PowerShell
    char psCmd[1024];
    sprintf(psCmd, "-Command \"if (!(Test-Path '%s')) { New-Item -ItemType Directory -Path '%s' }; Expand-Archive -Path '%s' -DestinationPath '%s' -Force\"", destPath, destPath, zipPath, destPath);

    SHELLEXECUTEINFO sei;
    ZeroMemory(&sei, sizeof(sei));
    sei.cbSize = sizeof(sei);
    sei.fMask = SEE_MASK_NOCLOSEPROCESS;
    sei.lpVerb = "open";
    sei.lpFile = "powershell.exe";
    sei.lpParameters = psCmd;
    sei.nShow = SW_HIDE; // HIDE the PowerShell window!

    if (ShellExecuteEx(&sei)) {
        WaitForSingleObject(sei.hProcess, INFINITE); // Wait for extraction to complete
        CloseHandle(sei.hProcess);
    } else {
        MessageBox(NULL, "Failed to extract application files.", "Error", MB_OK | MB_ICONERROR);
        return 1;
    }

    // Delete the temporary zip file after extraction
    DeleteFile(zipPath);

    // 6. Run the extracted launcher TrustCare.exe
    char exePath[MAX_PATH];
    sprintf(exePath, "%s\\TrustCare.exe", destPath);

    ZeroMemory(&sei, sizeof(sei));
    sei.cbSize = sizeof(sei);
    sei.lpVerb = "open";
    sei.lpFile = exePath;
    sei.nShow = SW_SHOWNORMAL;

    if (!ShellExecuteEx(&sei)) {
        MessageBox(NULL, "Failed to launch the application.", "Error", MB_OK | MB_ICONERROR);
        return 1;
    }

    return 0;
}
