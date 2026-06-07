#include <windows.h>
#include <shellapi.h>
#include <stdio.h>

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // 1. Start PHP server in the background (hidden window)
    STARTUPINFO si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE; // Hide the console window!

    ZeroMemory(&pi, sizeof(pi));

    // We run php.exe directly: "bin\php\php.exe backend/artisan serve --port=8000"
    char cmd[] = "bin\\php\\php.exe backend/artisan serve --port=8000";

    if (!CreateProcess(NULL, cmd, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
        MessageBox(NULL, "Failed to start the PHP server. Make sure you extracted the files correctly.", "Error", MB_OK | MB_ICONERROR);
        return 1;
    }

    // 2. Wait 2 seconds for server to start
    Sleep(2000);

    // 3. Open default browser to http://127.0.0.1:8000
    ShellExecute(NULL, "open", "http://127.0.0.1:8000", NULL, NULL, SW_SHOWNORMAL);

    // 4. Show a system tray icon or a simple dialog box to let them close the server
    int msgboxID = MessageBox(NULL, 
        "Trust Care Workshop Management System is running.\n\n"
        "Click OK to stop the server and close the application.", 
        "Trust Care Workshop Management System", 
        MB_OK | MB_ICONINFORMATION);

    if (msgboxID == IDOK) {
        // Kill the PHP server process
        TerminateProcess(pi.hProcess, 0);
    }

    // Close process and thread handles
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    return 0;
}
