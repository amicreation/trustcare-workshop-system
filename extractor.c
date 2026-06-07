#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <shellapi.h>

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // 1. Show a brief startup notice
    MessageBoxW(NULL, 
        L"Trust Care Workshop Management System is preparing to start.\n\n"
        L"Please click OK to begin. The application will launch in a few seconds.", 
        L"Trust Care", 
        MB_OK | MB_ICONINFORMATION);

    // 2. Get temporary directory path (Unicode)
    wchar_t tempPath[MAX_PATH];
    GetTempPathW(MAX_PATH, tempPath);
    
    // 3. Create a unique temporary ZIP file path (Unicode)
    wchar_t zipPath[MAX_PATH];
    if (GetTempFileNameW(tempPath, L"TC_", 0, zipPath) == 0) {
        MessageBoxW(NULL, L"Failed to create a unique temporary file path.", L"Error", MB_OK | MB_ICONERROR);
        return 1;
    }
    
    // 4. Create a unique destination directory path using dynamic tick count
    wchar_t destPath[MAX_PATH];
    swprintf(destPath, MAX_PATH, L"%sTrustCareApp_%lu", tempPath, GetTickCount());

    // 5. Load the embedded ZIP resource
    HRSRC hRes = FindResourceW(NULL, L"APP_ZIP", (LPCWSTR)RT_RCDATA);
    if (!hRes) {
        MessageBoxW(NULL, L"Failed to find internal resources.", L"Error", MB_OK | MB_ICONERROR);
        DeleteFileW(zipPath);
        return 1;
    }
    
    HGLOBAL hGlobal = LoadResource(NULL, hRes);
    if (!hGlobal) {
        MessageBoxW(NULL, L"Failed to load internal resources.", L"Error", MB_OK | MB_ICONERROR);
        DeleteFileW(zipPath);
        return 1;
    }
    
    void* pData = LockResource(hGlobal);
    DWORD size = SizeofResource(NULL, hRes);
    if (!pData || size == 0) {
        MessageBoxW(NULL, L"Internal resources are empty.", L"Error", MB_OK | MB_ICONERROR);
        DeleteFileW(zipPath);
        return 1;
    }

    // 6. Write the ZIP data to the unique temp file
    FILE* f = _wfopen(zipPath, L"wb");
    if (!f) {
        wchar_t errMsg[512];
        swprintf(errMsg, 512, L"Failed to write temporary file.\nPath: %s\nError code: %d", zipPath, GetLastError());
        MessageBoxW(NULL, errMsg, L"Error", MB_OK | MB_ICONERROR);
        DeleteFileW(zipPath);
        return 1;
    }
    fwrite(pData, 1, size, f);
    fclose(f);

    // 7. Create the destination folder and extract using PowerShell (Unicode execution)
    wchar_t psCmd[1536];
    swprintf(psCmd, 1536, L"-Command \"if (!(Test-Path '%s')) { New-Item -ItemType Directory -Path '%s' }; Expand-Archive -Path '%s' -DestinationPath '%s' -Force\"", destPath, destPath, zipPath, destPath);

    SHELLEXECUTEINFOW sei;
    ZeroMemory(&sei, sizeof(sei));
    sei.cbSize = sizeof(sei);
    sei.fMask = SEE_MASK_NOCLOSEPROCESS;
    sei.lpVerb = L"open";
    sei.lpFile = L"powershell.exe";
    sei.lpParameters = psCmd;
    sei.nShow = SW_HIDE; // HIDE the PowerShell window!

    if (ShellExecuteExW(&sei)) {
        WaitForSingleObject(sei.hProcess, INFINITE); // Wait for extraction to complete
        CloseHandle(sei.hProcess);
    } else {
        MessageBoxW(NULL, L"Failed to extract application files.", L"Error", MB_OK | MB_ICONERROR);
        DeleteFileW(zipPath);
        return 1;
    }

    // Delete the temporary zip file after extraction
    DeleteFileW(zipPath);

    // 8. Run the extracted launcher TrustCare.exe
    wchar_t exePath[MAX_PATH];
    swprintf(exePath, MAX_PATH, L"%s\\TrustCare.exe", destPath);

    ZeroMemory(&sei, sizeof(sei));
    sei.cbSize = sizeof(sei);
    sei.lpVerb = L"open";
    sei.lpFile = exePath;
    sei.nShow = SW_SHOWNORMAL;

    if (!ShellExecuteExW(&sei)) {
        MessageBoxW(NULL, L"Failed to launch the application.", L"Error", MB_OK | MB_ICONERROR);
        return 1;
    }

    return 0;
}
