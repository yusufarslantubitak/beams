package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
)

//go:embed dist
var distFS embed.FS

const port = 8765

func getOpenURL() string {
	// Prefer localhost; on WSL2, Windows browser may need the host IP
	addrs, err := net.InterfaceAddrs()
	if err == nil {
		for _, a := range addrs {
			if ip, ok := a.(*net.IPNet); ok && !ip.IP.IsLoopback() && ip.IP.To4() != nil {
				return fmt.Sprintf("http://%s:%d", ip.IP.String(), port)
			}
		}
	}
	return fmt.Sprintf("http://127.0.0.1:%d", port)
}

func main() {
	webRoot, err := fs.Sub(distFS, "dist")
	if err != nil {
		log.Fatalf("embedded dist not found: %v", err)
	}

	handler := http.FileServer(http.FS(webRoot))
	openURL := getOpenURL()

	http.Handle("/", handler)
	go func() {
		openBrowser(openURL)
	}()

	log.Printf("Serving at http://0.0.0.0:%d", port)
	log.Print("Press Ctrl+C to stop")
	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
		log.Fatal(err)
	}
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "linux":
		cmd = exec.Command("xdg-open", url)
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		return
	}
	cmd.Stderr = os.Stderr
	_ = cmd.Start()
}
